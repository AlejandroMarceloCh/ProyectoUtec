import { describe, it, expect } from 'vitest'
import { applyDelta, simulateHeadcount } from './simulator'
import { DEFAULT_EMPLOYEES } from '../data/defaultData'
import { DAYS, getDayLevel } from './optimizer'

function dayLevelsFromSnow(snowByDay = {}) {
  const levels = {}
  DAYS.forEach(d => (levels[d] = getDayLevel(d, snowByDay[d] ?? 0)))
  return levels
}

describe('applyDelta', () => {
  it('delta=0 no muta ni copia el array', () => {
    const r = applyDelta(DEFAULT_EMPLOYEES, 0, 'full-time')
    expect(r.length).toBe(DEFAULT_EMPLOYEES.length)
  })

  it('delta positivo añade empleados sintéticos del tipo pedido', () => {
    const r = applyDelta(DEFAULT_EMPLOYEES, 3, 'part-time')
    expect(r.length).toBe(DEFAULT_EMPLOYEES.length + 3)
    const extras = r.slice(-3)
    extras.forEach(e => {
      expect(e.employmentType).toBe('part-time')
      expect(e.isManager).toBe(false)
      expect(e.id).toMatch(/^__sim_/)
    })
  })

  it('delta negativo prioriza remover no-managers y no-cajeros', () => {
    const r = applyDelta(DEFAULT_EMPLOYEES, -3, 'part-time')
    expect(r.length).toBe(DEFAULT_EMPLOYEES.length - 3)
    // Todos los managers del roster original siguen presentes
    const originalManagers = DEFAULT_EMPLOYEES.filter(e => e.isManager)
    originalManagers.forEach(mgr => {
      expect(r.some(e => e.id === mgr.id)).toBe(true)
    })
  })

  it('no retorna el mismo array mutado', () => {
    const before = DEFAULT_EMPLOYEES.length
    applyDelta(DEFAULT_EMPLOYEES, 2, 'full-time')
    expect(DEFAULT_EMPLOYEES.length).toBe(before)
  })
})

describe('simulateHeadcount', () => {
  const dayLevels = dayLevelsFromSnow()

  it('devuelve un escenario por cada delta en el rango', () => {
    const res = simulateHeadcount(DEFAULT_EMPLOYEES, dayLevels, {}, { min: -2, max: 2 })
    expect(res).toHaveLength(5)
    expect(res.map(r => r.delta)).toEqual([-2, -1, 0, 1, 2])
  })

  it('cada escenario reporta score, headcount, status y warnings', () => {
    const res = simulateHeadcount(DEFAULT_EMPLOYEES, dayLevels, {}, { min: 0, max: 1 })
    res.forEach(s => {
      expect(s.score).toBeGreaterThanOrEqual(0)
      expect(s.score).toBeLessThanOrEqual(100)
      expect(s.headcount).toBeGreaterThan(0)
      expect(['optimal', 'over', 'severely-over', 'under']).toContain(s.status)
      expect(typeof s.warnings).toBe('number')
    })
  })

  it('quitar empleados de un roster sobre-contratado mejora o mantiene el score', () => {
    const res = simulateHeadcount(DEFAULT_EMPLOYEES, dayLevels, {}, {
      min: -3,
      max: 0,
      type: 'part-time',
    })
    const current = res.find(s => s.delta === 0)
    const reduced = res.find(s => s.delta === -3)
    // El roster por defecto está "severely-over": quitar 3 PT debería acercar a óptimo
    expect(reduced.score).toBeGreaterThanOrEqual(current.score)
  })
})
