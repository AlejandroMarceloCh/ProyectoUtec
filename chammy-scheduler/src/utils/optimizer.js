/**
 * Chammy Scheduler - Optimization Engine
 *
 * Formulation:
 *   Minimize over-staffing cost while guaranteeing:
 *   - At least `optimal` staff per day (hard: at least `min`)
 *   - At least 1 manager/supervisor per day
 *   - Cajeras: siempre ≥1 por día de servicio; a veces 2 en vie/sáb según ocupación + nieve
 *   - Each employee works their minDaysPerWeek (respecting availability)
 *   - Employees with second jobs can work fewer days
 *
 * Algorithm: Multi-pass greedy with fairness (load balancing).
 * Objective value = weighted deviations from optimal per day.
 */

import {
  SNOW_MM_HEAVY_PACK,
  SNOW_MM_POWDER,
  SNOW_MM_DRY,
  CASHIER_SATURDAY_LOW_SNOW_CM,
  SHIFT_HOURS_BY_LEVEL,
  SCORE_MAX_PENALTY,
  PENALTY,
  CAPACITY_RATIO_SEVERELY_OVER,
  CAPACITY_RATIO_OVER,
  CAPACITY_RATIO_UNDER,
} from './constants'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const DAY_LABELS = {
  Mon: 'Lunes',
  Tue: 'Martes',
  Wed: 'Miércoles',
  Thu: 'Jueves',
  Fri: 'Viernes',
  Sat: 'Sábado',
  Sun: 'Domingo',
}

export const DAY_SHORT = {
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Mié',
  Thu: 'Jue',
  Fri: 'Vie',
  Sat: 'Sáb',
  Sun: 'Dom',
}

// Staffing requirements per demand level
export const STAFFING_REQS = {
  slow: { min: 5, optimal: 6, max: 7, label: 'Tranquilo', shortLabel: 'Tranq.' },
  medium: { min: 6, optimal: 7, max: 8, label: 'Moderado', shortLabel: 'Mod.' },
  busy: { min: 7, optimal: 8, max: 9, label: 'Ocupado', shortLabel: 'Ocup.' },
  'very-busy': { min: 8, optimal: 9, max: 9, label: 'Muy Ocupado', shortLabel: 'Muy Ocup.' },
}

// Base day-of-week demand (without weather influence)
export const BASE_DAY_LEVELS = {
  Mon: 'slow',
  Tue: 'slow',
  Wed: 'slow',
  Thu: 'medium',
  Fri: 'busy',
  Sat: 'busy',
  Sun: 'medium',
}

const LEVELS = ['slow', 'medium', 'busy', 'very-busy']

/**
 * Determine busyness level from snow accumulation and base day demand.
 * snowMm: daily snowfall in mm (from forecast)
 */
export function getDayLevel(dayKey, snowMm = 0) {
  const baseIdx = LEVELS.indexOf(BASE_DAY_LEVELS[dayKey] ?? 'medium')
  let boost = 0
  if (snowMm > SNOW_MM_HEAVY_PACK) boost = 2 // resort packed
  else if (snowMm > SNOW_MM_POWDER) boost = 1 // powder day
  else if (snowMm < SNOW_MM_DRY) boost = -1 // bare/dry: slower traffic
  const finalIdx = Math.max(0, Math.min(LEVELS.length - 1, baseIdx + boost))
  return LEVELS[finalIdx]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function initSchedule(employees) {
  const s = {}
  employees.forEach(emp => {
    s[emp.id] = {}
    DAYS.forEach(d => (s[emp.id][d] = false))
  })
  return s
}

function countOnDay(schedule, day) {
  return Object.values(schedule).filter(e => e[day]).length
}

function daysAssigned(empSchedule) {
  return DAYS.filter(d => empSchedule[d]).length
}

function managersOnDay(schedule, employees, day) {
  return employees.filter(e => e.isManager && schedule[e.id]?.[day]).length
}

/**
 * "Cajeros efectivos" del día = cualquier persona con capacidad de cobrar
 * (cashierKnowledge) que esté trabajando ese día. Los cajeros dedicados
 * (isCashier) son un subconjunto que siempre tiene cashierKnowledge.
 */
function cashiersOnDay(schedule, employees, day) {
  return employees.filter(
    e => (e.cashierKnowledge || e.isCashier) && schedule[e.id]?.[day]
  ).length
}

/** Sólo cajeros dedicados (rol primario en caja). */
function dedicatedCashiersOnDay(schedule, employees, day) {
  return employees.filter(e => e.isCashier && schedule[e.id]?.[day]).length
}

/**
 * Cajeras/os mínimos por día de servicio (un solo bloque horario en el modelo).
 *
 * Regla fija: siempre al menos 1 cajera por día — nunca 0.
 * Encima de eso, según clima y día:
 * - Sábado: 2 salvo día muy tranquilo (slow y poca nieve, menos de 40 mm).
 * - Viernes: 2 si busy/very-busy o nieve ≥ 80 mm; si no, sigue 1.
 */
export function getRequiredCashiers(dayKey, dayLevel, snowMm = 0) {
  const snow = Number(snowMm) || 0
  const powderDay = snow >= SNOW_MM_POWDER
  const busyPlus = dayLevel === 'busy' || dayLevel === 'very-busy'

  let need = 1

  if (dayKey === 'Sat') {
    if (!(dayLevel === 'slow' && snow < CASHIER_SATURDAY_LOW_SNOW_CM)) need = 2
  } else if (dayKey === 'Fri') {
    if (busyPlus || powderDay) need = 2
  }

  return Math.max(1, need)
}

// ─── Main Optimizer ─────────────────────────────────────────────────────────

/**
 * Run the scheduling optimization.
 * @param {Array} employees
 * @param {Object} dayLevels  e.g. { Mon: 'slow', Tue: 'medium', ... }
 * @param {Record<string, number>} [snowByDay]  snowfall mm por día (del API)
 * @returns {{ schedule, score, optimalSchedule }}
 */
export function optimizeSchedule(employees, dayLevels, snowByDay = {}) {
  const schedule = initSchedule(employees)
  const demands = buildDemands(dayLevels)

  // Days sorted busiest-first (prioritize hard-to-fill days)
  const sortedDays = [...DAYS].sort(
    (a, b) => demands[b].optimal - demands[a].optimal
  )

  // ── Pass 1: Guarantee at least one manager per day ──────────────────────
  const managers = employees.filter(e => e.isManager)
  sortedDays.forEach(day => {
    const alreadyCovered = managersOnDay(schedule, employees, day) > 0
    if (alreadyCovered) return

    const candidates = managers
      .filter(m => m.availability[day] && daysAssigned(schedule[m.id]) < m.minDaysPerWeek)
      .sort((a, b) => daysAssigned(schedule[a.id]) - daysAssigned(schedule[b.id]))

    if (candidates.length > 0) {
      schedule[candidates[0].id][day] = true
    }
  })

  // ── Pass 1b: Cashier coverage (después de supervisores) ─────────────────
  // Orden: primero intentamos cubrir con cajeros dedicados. Si faltan, usamos
  // empleados con cashierKnowledge como respaldo (managers, personal senior).
  const dedicatedCashiers = employees.filter(e => e.isCashier)
  const cashierBackups = employees.filter(e => e.cashierKnowledge && !e.isCashier)
  const sortedDaysForCashiers = [...DAYS].sort((a, b) => {
    const ra = getRequiredCashiers(a, dayLevels[a] ?? 'medium', snowByDay[a])
    const rb = getRequiredCashiers(b, dayLevels[b] ?? 'medium', snowByDay[b])
    if (rb !== ra) return rb - ra
    return demands[b].optimal - demands[a].optimal
  })

  sortedDaysForCashiers.forEach(day => {
    const need = getRequiredCashiers(day, dayLevels[day] ?? 'medium', snowByDay[day])
    let have = cashiersOnDay(schedule, employees, day)

    // 1) Intentar con cajeros dedicados primero.
    while (have < need) {
      const candidates = dedicatedCashiers
        .filter(
          c =>
            c.availability[day] &&
            !schedule[c.id][day] &&
            daysAssigned(schedule[c.id]) < c.minDaysPerWeek
        )
        .sort((a, b) => daysAssigned(schedule[a.id]) - daysAssigned(schedule[b.id]))
      if (candidates.length === 0) break
      schedule[candidates[0].id][day] = true
      have++
    }

    // 2) Fallback: personal con cashierKnowledge como respaldo.
    while (have < need) {
      const candidates = cashierBackups
        .filter(
          c =>
            c.availability[day] &&
            !schedule[c.id][day] &&
            daysAssigned(schedule[c.id]) < c.minDaysPerWeek
        )
        .sort((a, b) => daysAssigned(schedule[a.id]) - daysAssigned(schedule[b.id]))
      if (candidates.length === 0) break
      schedule[candidates[0].id][day] = true
      have++
    }
  })

  // Comparador de prioridad: quien esté más lejos de su mínimo contratado
  // gana el slot. Esto evita que PT (minDays=2) desplacen a FT (minDays=5)
  // sólo por tener menos días asignados en términos absolutos.
  const byDeficitDesc = (a, b) => {
    const da = a.minDaysPerWeek - daysAssigned(schedule[a.id])
    const db = b.minDaysPerWeek - daysAssigned(schedule[b.id])
    if (db !== da) return db - da
    // Desempate: el que menos días tiene asignados (balance)
    return daysAssigned(schedule[a.id]) - daysAssigned(schedule[b.id])
  }

  // ── Pass 2: Fill to optimal staffing level ───────────────────────────────
  sortedDays.forEach(day => {
    const current = countOnDay(schedule, day)
    const needed = demands[day].optimal - current
    if (needed <= 0) return

    const candidates = employees
      .filter(
        emp =>
          emp.availability[day] &&
          !schedule[emp.id][day] &&
          daysAssigned(schedule[emp.id]) < emp.minDaysPerWeek
      )
      .sort(byDeficitDesc)

    candidates.slice(0, needed).forEach(emp => {
      schedule[emp.id][day] = true
    })
  })

  // ── Pass 3: Ensure every employee reaches their minimum days ─────────────
  // Procesamos empleados con mayor déficit primero para que los FT no queden
  // en los últimos puestos esperando slots que ya se llenaron con su `max`.
  const byMissingDesc = [...employees].sort(
    (a, b) =>
      b.minDaysPerWeek -
      daysAssigned(schedule[b.id]) -
      (a.minDaysPerWeek - daysAssigned(schedule[a.id]))
  )
  byMissingDesc.forEach(emp => {
    const missing = emp.minDaysPerWeek - daysAssigned(schedule[emp.id])
    if (missing <= 0) return

    const unassigned = DAYS.filter(d => !schedule[emp.id][d] && emp.availability[d])
    unassigned
      .sort((a, b) => countOnDay(schedule, a) - countOnDay(schedule, b))
      .slice(0, missing)
      .forEach(day => {
        if (countOnDay(schedule, day) < demands[day].max) {
          schedule[emp.id][day] = true
        }
      })
  })

  const score = calculateScore(schedule, employees, dayLevels, snowByDay)
  return { schedule, score }
}

// ─── Score Calculator ────────────────────────────────────────────────────────

/**
 * Calculate the objective score (0–100) for a given schedule.
 * 100 = every day exactly at optimal with no constraint violations.
 * Deductions:
 *   - Over-staffing: -1 pt per extra person per day
 *   - Under-staffing: -2 pt per missing person per day (worse)
 *   - Missing manager: -5 pt per day
 *   - Missing cashier vs. requisito (clima/día): -4 pt por cajero faltante
 *   - Employee below min hours: -1 pt per person
 */
export function calculateScore(schedule, employees, dayLevels, snowByDay = {}) {
  const demands = buildDemands(dayLevels)
  let deductions = 0
  const dayScores = {}

  DAYS.forEach(day => {
    const actual = countOnDay(schedule, day)
    const { min, optimal, max } = demands[day]
    const over = Math.max(0, actual - optimal)
    const under = Math.max(0, optimal - actual)
    deductions += over * PENALTY.OVERSTAFFED_PER_PERSON + under * PENALTY.UNDERSTAFFED_PER_PERSON

    let status = 'optimal'
    if (actual < min) status = 'critical'
    else if (actual < optimal) status = 'low'
    else if (actual === optimal) status = 'optimal'
    else if (actual <= max) status = 'acceptable'
    else status = 'overstaffed'

    const mgrs = managersOnDay(schedule, employees, day)
    if (mgrs === 0) deductions += PENALTY.MISSING_MANAGER_PER_DAY

    const needCash = getRequiredCashiers(day, dayLevels[day] ?? 'medium', snowByDay[day])
    const haveCash = cashiersOnDay(schedule, employees, day)
    const cashShort = Math.max(0, needCash - haveCash)
    if (cashShort > 0) deductions += PENALTY.MISSING_CASHIER_PER_PERSON * cashShort

    const dedicatedCash = dedicatedCashiersOnDay(schedule, employees, day)
    dayScores[day] = {
      actual,
      optimal,
      min,
      max,
      status,
      over,
      under,
      managers: mgrs,
      cashiers: haveCash,
      dedicatedCashiers: dedicatedCash,
      backupCashiers: haveCash - dedicatedCash,
      requiredCashiers: needCash,
    }
  })

  // Employee constraint deductions
  const employeeWarnings = []
  employees.forEach(emp => {
    const worked = daysAssigned(schedule[emp.id] ?? {})
    if (worked < emp.minDaysPerWeek) {
      deductions += PENALTY.EMPLOYEE_BELOW_MIN_DAYS
      employeeWarnings.push({
        name: emp.name,
        worked,
        required: emp.minDaysPerWeek,
      })
    }
  })

  // Manager warnings
  const managerWarnings = DAYS.filter(d => managersOnDay(schedule, employees, d) === 0).map(
    d => DAY_LABELS[d]
  )

  const cashierWarnings = DAYS.filter(d => {
    const need = getRequiredCashiers(d, dayLevels[d] ?? 'medium', snowByDay[d])
    return cashiersOnDay(schedule, employees, d) < need
  }).map(d => ({
    day: DAY_LABELS[d],
    need: getRequiredCashiers(d, dayLevels[d] ?? 'medium', snowByDay[d]),
    have: cashiersOnDay(schedule, employees, d),
  }))

  // Score: normalize penalties (más restricciones = techo un poco mayor)
  const score = Math.round(
    Math.max(0, Math.min(100, 100 - (deductions / SCORE_MAX_PENALTY) * 100))
  )

  const { totalHours, optimalHours } = calcHours(schedule, dayLevels, demands)
  const hoursSaved = optimalHours - totalHours

  return {
    score,
    deductions,
    dayScores,
    managerWarnings,
    cashierWarnings,
    employeeWarnings,
    totalHours,
    optimalHours,
    hoursSaved,
  }
}

// ─── Capacity Analysis ────────────────────────────────────────────────────────

const SHIFT_HOURS = SHIFT_HOURS_BY_LEVEL

/**
 * Analyzes whether the roster size is well-matched to the weekly demand.
 *
 * Key insight: if the sum of employees' minimum contracted days exceeds
 * the sum of optimal staff slots across the week, the roster is over-contracted —
 * the manager is forced to schedule people even when not needed.
 *
 * Returns a plain object safe to display directly.
 */
export function analyzeCapacity(employees, dayLevels) {
  const demands = {}
  DAYS.forEach(d => (demands[d] = STAFFING_REQS[dayLevels[d] ?? 'medium']))

  // Weekly demand side: how many person-slots do we actually need?
  const weeklyOptimalShifts = DAYS.reduce((s, d) => s + demands[d].optimal, 0)
  const weeklyMinShifts     = DAYS.reduce((s, d) => s + demands[d].min, 0)
  const weeklyMaxShifts     = DAYS.reduce((s, d) => s + demands[d].max, 0)

  const weeklyOptimalHours  = DAYS.reduce((s, d) => s + demands[d].optimal * (SHIFT_HOURS[dayLevels[d]] ?? 7), 0)

  // Supply side: how many person-slots have we committed to (contracted minimum)?
  const avgShiftH = DAYS.reduce((a, d) => a + (SHIFT_HOURS[dayLevels[d]] ?? 7), 0) / 7
  const weeklyContractedShifts = employees.reduce((s, e) => s + (e.minDaysPerWeek ?? 5), 0)
  const weeklyContractedHours  = employees.reduce((s, e) => s + (e.minDaysPerWeek ?? 5) * avgShiftH, 0)

  const fullTimeCount = employees.filter(e => (e.employmentType ?? 'full-time') === 'full-time').length
  const partTimeCount = employees.length - fullTimeCount
  const ftShifts = employees
    .filter(e => (e.employmentType ?? 'full-time') === 'full-time')
    .reduce((s, e) => s + (e.minDaysPerWeek ?? 5), 0)
  const ptShifts = weeklyContractedShifts - ftShifts

  const surplusShifts = weeklyContractedShifts - weeklyOptimalShifts
  const surplusHours  = Math.round(weeklyContractedHours - weeklyOptimalHours)

  // Ideal headcount: how many people could we hire and keep them fully productive?
  // (using average of 5 working days / person for simplicity)
  const avgWorkDaysPerEmp = employees.length > 0
    ? weeklyContractedShifts / employees.length
    : 5
  const recommendedHeadcount = Math.round(weeklyOptimalShifts / Math.max(1, avgWorkDaysPerEmp))

  // Status thresholds
  let status // 'optimal' | 'over' | 'severely-over' | 'under'
  const overRatio = weeklyContractedShifts / weeklyOptimalShifts
  if (overRatio >= CAPACITY_RATIO_SEVERELY_OVER) status = 'severely-over'
  else if (overRatio >= CAPACITY_RATIO_OVER) status = 'over'
  else if (overRatio < CAPACITY_RATIO_UNDER) status = 'under'
  else status = 'optimal'

  // Per-day breakdown
  const dayBreakdown = DAYS.map(day => ({
    day,
    optimal: demands[day].optimal,
    min:     demands[day].min,
    max:     demands[day].max,
    hours:   SHIFT_HOURS[dayLevels[day]] ?? 7,
  }))

  return {
    // supply
    totalEmployees: employees.length,
    fullTimeCount,
    partTimeCount,
    ftShifts,
    ptShifts,
    weeklyContractedShifts,
    weeklyContractedHours: Math.round(weeklyContractedHours),
    // demand
    weeklyOptimalShifts,
    weeklyMinShifts,
    weeklyMaxShifts,
    weeklyOptimalHours,
    // gap
    surplusShifts,
    surplusHours,
    overRatio: Math.round(overRatio * 100),
    status,
    recommendedHeadcount,
    dayBreakdown,
  }
}

// ─── Utility exports ─────────────────────────────────────────────────────────

export function buildDemands(dayLevels) {
  const d = {}
  DAYS.forEach(day => (d[day] = STAFFING_REQS[dayLevels[day] ?? 'medium']))
  return d
}

export function getEmployeeWeekStats(empId, schedule, dayLevels) {
  const shiftH = SHIFT_HOURS_BY_LEVEL
  const empSched = schedule[empId] ?? {}
  const workedDays = DAYS.filter(d => empSched[d])
  const hours = workedDays.reduce((sum, d) => sum + (shiftH[dayLevels[d]] ?? 7), 0)
  const offDays = DAYS.filter(d => !empSched[d])
  return { daysWorked: workedDays.length, hours, offDays, workedDays }
}

function calcHours(schedule, dayLevels, demands) {
  const shiftH = SHIFT_HOURS_BY_LEVEL
  let totalHours = 0
  let optimalHours = 0
  DAYS.forEach(day => {
    const h = shiftH[dayLevels[day]] ?? 7
    totalHours += countOnDay(schedule, day) * h
    optimalHours += demands[day].optimal * h
  })
  return { totalHours, optimalHours }
}
