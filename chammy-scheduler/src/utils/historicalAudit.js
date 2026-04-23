/**
 * Auditoría histórica: simula 90 días (≈13 semanas) de operación generando
 * datos climáticos sintéticos realistas para un resort de ski, corre el
 * optimizador cada semana y emite una serie de tiempo con métricas clave.
 *
 * No depende de la API de clima — usa un generador determinista con seed
 * para que los resultados sean reproducibles.
 */

import { DAYS, getDayLevel, optimizeSchedule } from './optimizer'

// ── PRNG determinista (mulberry32) ───────────────────────────────────────────
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Genera nieve (mm/día) plausible para la temporada de ski.
 * - Ciclo estacional: más nieve en el medio del periodo que en los extremos.
 * - Días consecutivos correlacionados (si ayer nevó fuerte, hoy probablemente también).
 * - Clusters de "tormentas" cada ~10-14 días.
 */
function generateSnowSeries(days, seed = 42) {
  const rand = mulberry32(seed)
  const series = []
  let momentum = 0

  for (let i = 0; i < days; i++) {
    // Curva estacional: suave pico a la mitad
    const seasonal = Math.sin((i / days) * Math.PI) * 0.7 + 0.3
    // Momentum (tormenta continua)
    momentum = momentum * 0.6 + (rand() - 0.3) * 40
    // Ruido de fondo
    const base = rand() * 40

    let snowMm = Math.max(0, base * seasonal + momentum)
    // Tormenta esporádica
    if (rand() < 0.08) snowMm += 150 + rand() * 200

    series.push(Math.round(snowMm))
  }
  return series
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isoDate(d) {
  return d.toISOString().split('T')[0]
}

function dayKey(date) {
  const idx = date.getDay() === 0 ? 6 : date.getDay() - 1
  return DAYS[idx]
}

/**
 * Corre el optimizador semana por semana sobre el periodo indicado.
 * Devuelve tanto la serie diaria (para gráficos) como resúmenes semanales.
 */
export function runHistoricalAudit(
  employees,
  { days = 90, startDate = new Date(), seed = 42 } = {}
) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  // Alinear al lunes más cercano hacia atrás
  const dayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1
  start.setDate(start.getDate() - dayOfWeek)

  const snowSeries = generateSnowSeries(days, seed)

  const weeks = []
  const daily = []
  let totalAssignedHours = 0
  let totalOptimalHours = 0
  let totalManagerGaps = 0
  let totalCashierGaps = 0

  for (let weekStart = 0; weekStart < days; weekStart += 7) {
    const weekDays = []
    const dayLevels = {}
    const snowByDay = {}

    for (let i = 0; i < 7 && weekStart + i < days; i++) {
      const date = addDays(start, weekStart + i)
      const dk = dayKey(date)
      const snowMm = snowSeries[weekStart + i]
      weekDays.push({ date, dayKey: dk, snowMm })
      dayLevels[dk] = getDayLevel(dk, snowMm)
      snowByDay[dk] = snowMm
    }
    if (weekDays.length < 7) break

    const { schedule, score } = optimizeSchedule(employees, dayLevels, snowByDay)

    weekDays.forEach(({ date, dayKey: dk, snowMm }) => {
      const ds = score.dayScores[dk]
      daily.push({
        date: isoDate(date),
        dayKey: dk,
        snowMm,
        level: dayLevels[dk],
        staff: ds.actual,
        optimal: ds.optimal,
        min: ds.min,
        max: ds.max,
        status: ds.status,
        managers: ds.managers,
        cashiers: ds.cashiers,
        requiredCashiers: ds.requiredCashiers,
        understaffed: ds.under,
        overstaffed: ds.over,
      })
    })

    totalAssignedHours += score.totalHours
    totalOptimalHours += score.optimalHours
    totalManagerGaps += score.managerWarnings.length
    totalCashierGaps += score.cashierWarnings?.length ?? 0

    weeks.push({
      weekStart: isoDate(weekDays[0].date),
      weekEnd: isoDate(weekDays[6].date),
      score: score.score,
      totalHours: score.totalHours,
      optimalHours: score.optimalHours,
      hoursSaved: score.hoursSaved,
      managerGaps: score.managerWarnings.length,
      cashierGaps: score.cashierWarnings?.length ?? 0,
      employeeGaps: score.employeeWarnings.length,
      schedule,
      dayLevels,
    })
  }

  // ── Agregados ───────────────────────────────────────────────────────────
  const scores = weeks.map(w => w.score)
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const minScore = scores.length ? Math.min(...scores) : 0
  const maxScore = scores.length ? Math.max(...scores) : 0

  const understaffedDays = daily.filter(d => d.status === 'critical' || d.status === 'low').length
  const overstaffedDays = daily.filter(d => d.status === 'overstaffed').length
  const optimalDays = daily.filter(d => d.status === 'optimal').length

  // Por día de la semana: ¿qué días son sistemáticamente problemáticos?
  const byWeekday = {}
  DAYS.forEach(d => {
    const dayRows = daily.filter(x => x.dayKey === d)
    const avgStaff = dayRows.reduce((s, x) => s + x.staff, 0) / Math.max(1, dayRows.length)
    const avgOptimal = dayRows.reduce((s, x) => s + x.optimal, 0) / Math.max(1, dayRows.length)
    const cashierShortDays = dayRows.filter(x => x.cashiers < x.requiredCashiers).length
    byWeekday[d] = {
      samples: dayRows.length,
      avgStaff: Math.round(avgStaff * 10) / 10,
      avgOptimal: Math.round(avgOptimal * 10) / 10,
      cashierShortDays,
      understaffedPct:
        dayRows.length === 0
          ? 0
          : Math.round(
              (dayRows.filter(x => x.status === 'critical' || x.status === 'low').length /
                dayRows.length) *
                100
            ),
      overstaffedPct:
        dayRows.length === 0
          ? 0
          : Math.round(
              (dayRows.filter(x => x.status === 'overstaffed').length / dayRows.length) * 100
            ),
    }
  })

  return {
    daily,
    weeks,
    summary: {
      totalDays: daily.length,
      weeksSimulated: weeks.length,
      avgScore: Math.round(avgScore),
      minScore,
      maxScore,
      totalAssignedHours,
      totalOptimalHours,
      hoursSaved: totalOptimalHours - totalAssignedHours,
      understaffedDays,
      overstaffedDays,
      optimalDays,
      totalManagerGaps,
      totalCashierGaps,
      byWeekday,
    },
  }
}
