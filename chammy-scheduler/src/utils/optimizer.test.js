import { describe, it, expect } from 'vitest'
import {
  DAYS,
  getDayLevel,
  getRequiredCashiers,
  optimizeSchedule,
  calculateScore,
  analyzeCapacity,
  buildDemands,
} from './optimizer'
import { DEFAULT_EMPLOYEES } from '../data/defaultData'

function dayLevelsFromSnow(snowByDay = {}) {
  const levels = {}
  DAYS.forEach(d => (levels[d] = getDayLevel(d, snowByDay[d] ?? 0)))
  return levels
}

describe('getDayLevel', () => {
  it('sin nieve → degrada días base', () => {
    expect(getDayLevel('Mon', 0)).toBe('slow')
    expect(getDayLevel('Fri', 0)).toBe('medium') // base busy - 1
  })

  it('powder day (>8cm) → sube un nivel', () => {
    expect(getDayLevel('Mon', 100)).toBe('medium')
    expect(getDayLevel('Fri', 100)).toBe('very-busy')
  })

  it('resort packed (>20cm) → sube dos niveles y clampea', () => {
    expect(getDayLevel('Mon', 300)).toBe('busy')
    expect(getDayLevel('Sat', 300)).toBe('very-busy')
  })
})

describe('getRequiredCashiers', () => {
  it('mínimo siempre es 1', () => {
    expect(getRequiredCashiers('Mon', 'slow', 0)).toBe(1)
    expect(getRequiredCashiers('Wed', 'slow', 0)).toBe(1)
  })

  it('sábado pide 2 salvo si está tranquilo y con poca nieve', () => {
    expect(getRequiredCashiers('Sat', 'medium', 0)).toBe(2)
    expect(getRequiredCashiers('Sat', 'busy', 50)).toBe(2)
    expect(getRequiredCashiers('Sat', 'slow', 10)).toBe(1)
  })

  it('viernes pide 2 cuando está ocupado o hay nieve fresca', () => {
    expect(getRequiredCashiers('Fri', 'busy', 0)).toBe(2)
    expect(getRequiredCashiers('Fri', 'slow', 100)).toBe(2)
    expect(getRequiredCashiers('Fri', 'medium', 0)).toBe(1)
  })
})

describe('optimizeSchedule', () => {
  const emps = DEFAULT_EMPLOYEES.map(e => ({ ...e, availability: { ...e.availability } }))
  const dayLevels = dayLevelsFromSnow({ Fri: 50, Sat: 80, Sun: 20 })

  it('devuelve un schedule con entrada para cada empleado y día', () => {
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    emps.forEach(e => {
      DAYS.forEach(d => expect(schedule[e.id]).toHaveProperty(d))
    })
  })

  it('garantiza al menos un supervisor cada día', () => {
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    DAYS.forEach(d => {
      const mgrs = emps.filter(e => e.isManager && schedule[e.id][d]).length
      expect(mgrs).toBeGreaterThanOrEqual(1)
    })
  })

  it('prioriza cajeras en días que las exigen (sin exceder su contrato)', () => {
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    const cashiers = emps.filter(e => e.isCashier)
    // Ninguna cajera excede su mínimo contratado (PT=2d)
    cashiers.forEach(c => {
      const worked = DAYS.filter(d => schedule[c.id][d]).length
      expect(worked).toBeLessThanOrEqual(c.minDaysPerWeek)
    })
    // Si la oferta de cajeras es suficiente, se cubre el mínimo del sábado (always ≥1)
    const satCashiers = cashiers.filter(c => schedule[c.id].Sat).length
    expect(satCashiers).toBeGreaterThanOrEqual(1)
  })

  it('no asigna un día donde el empleado no está disponible', () => {
    const mods = emps.map(e =>
      e.id === 'ch_heem' ? { ...e, availability: { ...e.availability, Sun: false } } : e
    )
    const { schedule } = optimizeSchedule(mods, dayLevels, {})
    expect(schedule['ch_heem'].Sun).toBe(false)
  })

  it('ningún empleado excede 5 días asignados (cap duro)', () => {
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    emps.forEach(e => {
      const worked = DAYS.filter(d => schedule[e.id][d]).length
      expect(worked).toBeLessThanOrEqual(5)
    })
  })

  it('priorización por déficit: todos los FT llegan a 5 cuando el roster está dimensionado', () => {
    // Caso balanceado: 6 FT + 2 PT cajeras. 6*5 + 2*2 = 34 slots comprometidos,
    // y la semana tiene 48 óptimos → sobra margen para que cada FT llegue a 5.
    const balanced = [
      { id: 'm1', name: 'M1', isManager: true, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'm2', name: 'M2', isManager: true, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'ft3', name: 'F3', isManager: false, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'ft4', name: 'F4', isManager: false, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'ft5', name: 'F5', isManager: false, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'ft6', name: 'F6', isManager: false, isCashier: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'pt1', name: 'P1', isManager: false, isCashier: true, employmentType: 'part-time', minDaysPerWeek: 2, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
      { id: 'pt2', name: 'P2', isManager: false, isCashier: true, employmentType: 'part-time', minDaysPerWeek: 2, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
    ]
    const { schedule } = optimizeSchedule(balanced, dayLevels, {})
    const ft = balanced.filter(e => e.employmentType === 'full-time')
    ft.forEach(e => {
      const worked = DAYS.filter(d => schedule[e.id][d]).length
      expect(worked).toBe(5)
    })
  })

  it('con roster sobre-contratado (el default) el fix mantiene el promedio FT > 3', () => {
    // El roster por defecto tiene 13 PT × 2 = 26 slots comprometidos, dejando
    // sólo 22 slots óptimos para 10 FT. Antes del fix, los PT con 0 días
    // desplazaban a FT con 1 día y el promedio caía a ~2.7. Con priorización
    // por déficit relativo el promedio debe quedar claramente por encima.
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    const ft = emps.filter(e => e.employmentType === 'full-time')
    const avg = ft.reduce((s, e) => s + DAYS.filter(d => schedule[e.id][d]).length, 0) / ft.length
    expect(avg).toBeGreaterThan(3)
  })

  it('respeta el mínimo contratado de los part-time', () => {
    const { schedule } = optimizeSchedule(emps, dayLevels, {})
    const pt = emps.filter(e => e.employmentType === 'part-time')
    pt.forEach(e => {
      const worked = DAYS.filter(d => schedule[e.id][d]).length
      expect(worked).toBeGreaterThanOrEqual(1)
      expect(worked).toBeLessThanOrEqual(e.minDaysPerWeek)
    })
  })
})

describe('cashierKnowledge backup coverage', () => {
  it('usa empleados con cashierKnowledge cuando no alcanzan las cajeras dedicadas', () => {
    // Roster con 2 managers (ambos con cashierKnowledge) + 1 cajera dedicada
    // + cocineros. Entre managers y cajera cubren caja en los 7 días.
    const allDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }
    const roster = [
      { id: 'mgr1', name: 'M1', isManager: true, isCashier: false, cashierKnowledge: true, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
      { id: 'mgr2', name: 'M2', isManager: true, isCashier: false, cashierKnowledge: true, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
      { id: 'ca', name: 'C', isManager: false, isCashier: true, cashierKnowledge: true, employmentType: 'part-time', minDaysPerWeek: 2, availability: { ...allDays }, color: '#000' },
      { id: 'ft1', name: 'F1', isManager: false, isCashier: false, cashierKnowledge: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
      { id: 'ft2', name: 'F2', isManager: false, isCashier: false, cashierKnowledge: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
      { id: 'ft3', name: 'F3', isManager: false, isCashier: false, cashierKnowledge: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
      { id: 'ft4', name: 'F4', isManager: false, isCashier: false, cashierKnowledge: false, employmentType: 'full-time', minDaysPerWeek: 5, availability: { ...allDays }, color: '#000' },
    ]
    const dayLevels = dayLevelsFromSnow()
    const { schedule, score } = optimizeSchedule(roster, dayLevels, {})
    // Cada día debe tener al menos 1 persona con capacidad de caja
    DAYS.forEach(d => {
      const hasCashCapable = roster.some(
        e => (e.isCashier || e.cashierKnowledge) && schedule[e.id][d]
      )
      expect(hasCashCapable).toBe(true)
    })
    // dayScores debe separar dedicadas vs respaldo
    DAYS.forEach(d => {
      expect(score.dayScores[d]).toHaveProperty('dedicatedCashiers')
      expect(score.dayScores[d]).toHaveProperty('backupCashiers')
    })
  })
})

describe('calculateScore', () => {
  const emps = DEFAULT_EMPLOYEES
  const dayLevels = dayLevelsFromSnow()

  it('score está entre 0 y 100', () => {
    const { schedule, score } = optimizeSchedule(emps, dayLevels, {})
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
    // Recalcular da el mismo número
    const recomputed = calculateScore(schedule, emps, dayLevels, {})
    expect(recomputed.score).toBe(score.score)
  })

  it('penaliza fuertemente la falta de supervisor', () => {
    const empty = {}
    emps.forEach(e => {
      empty[e.id] = {}
      DAYS.forEach(d => (empty[e.id][d] = false))
    })
    const s = calculateScore(empty, emps, dayLevels, {})
    expect(s.managerWarnings.length).toBe(DAYS.length)
    expect(s.score).toBeLessThan(30)
  })
})

describe('analyzeCapacity', () => {
  it('detecta sobre-contratación cuando minDays suma mucho más que el óptimo', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `e${i}`,
      name: `E${i}`,
      employmentType: 'full-time',
      minDaysPerWeek: 5,
    }))
    const res = analyzeCapacity(many, dayLevelsFromSnow())
    expect(res.status).toBe('severely-over')
    expect(res.surplusShifts).toBeGreaterThan(0)
  })

  it('marca "under" cuando la planilla es demasiado chica', () => {
    const few = [{ id: 'a', name: 'A', employmentType: 'full-time', minDaysPerWeek: 5 }]
    const res = analyzeCapacity(few, dayLevelsFromSnow())
    expect(res.status).toBe('under')
  })
})

describe('buildDemands', () => {
  it('devuelve un objeto con todos los días y la forma STAFFING_REQS', () => {
    const d = buildDemands(dayLevelsFromSnow())
    DAYS.forEach(day => {
      expect(d[day]).toHaveProperty('min')
      expect(d[day]).toHaveProperty('optimal')
      expect(d[day]).toHaveProperty('max')
    })
  })
})
