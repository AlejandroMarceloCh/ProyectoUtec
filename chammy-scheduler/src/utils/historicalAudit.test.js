import { describe, it, expect } from 'vitest'
import { runHistoricalAudit } from './historicalAudit'
import { DEFAULT_EMPLOYEES } from '../data/defaultData'
import { DAYS } from './optimizer'

describe('runHistoricalAudit', () => {
  it('simula 90 días por defecto y devuelve 13 semanas completas', () => {
    const result = runHistoricalAudit(DEFAULT_EMPLOYEES)
    expect(result.weeks.length).toBeGreaterThanOrEqual(12)
    expect(result.weeks.length).toBeLessThanOrEqual(13)
    expect(result.daily.length).toBe(result.weeks.length * 7)
  })

  it('respeta el parámetro days para periodos cortos', () => {
    const result = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 28 })
    expect(result.weeks.length).toBe(4)
    expect(result.daily.length).toBe(28)
  })

  it('es determinista con la misma seed', () => {
    const a = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 30, seed: 7 })
    const b = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 30, seed: 7 })
    expect(a.summary.avgScore).toBe(b.summary.avgScore)
    expect(a.daily[0].snowMm).toBe(b.daily[0].snowMm)
  })

  it('distintas seeds producen resultados distintos', () => {
    const a = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 30, seed: 1 })
    const b = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 30, seed: 99 })
    const snowA = a.daily.map(d => d.snowMm).join(',')
    const snowB = b.daily.map(d => d.snowMm).join(',')
    expect(snowA).not.toBe(snowB)
  })

  it('cada día tiene métricas esperadas', () => {
    const result = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 14 })
    result.daily.forEach(d => {
      expect(d.snowMm).toBeGreaterThanOrEqual(0)
      expect(d.staff).toBeGreaterThanOrEqual(0)
      expect(d.optimal).toBeGreaterThan(0)
      expect(DAYS).toContain(d.dayKey)
    })
  })

  it('resumen por día de semana cubre los 7 días', () => {
    const result = runHistoricalAudit(DEFAULT_EMPLOYEES, { days: 28 })
    DAYS.forEach(d => {
      expect(result.summary.byWeekday[d]).toBeDefined()
      expect(result.summary.byWeekday[d].samples).toBe(4)
    })
  })
})
