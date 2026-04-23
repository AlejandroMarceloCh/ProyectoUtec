import { describe, it, expect } from 'vitest'
import { generateRecommendations } from './recommendations'
import { DAYS, getDayLevel, optimizeSchedule } from './optimizer'
import { DEFAULT_EMPLOYEES } from '../data/defaultData'

function dayLevels() {
  const l = {}
  DAYS.forEach(d => (l[d] = getDayLevel(d, 0)))
  return l
}

describe('generateRecommendations', () => {
  it('devuelve lista vacía sin scoreData', () => {
    const recs = generateRecommendations(null, [], dayLevels(), {}, null)
    expect(recs).toEqual([])
  })

  it('recomienda cubrir días con falta de staff', () => {
    // Roster mínimo → estará under-staffed
    const emps = [
      { id: 'a', name: 'A', isManager: true, isCashier: true, cashierKnowledge: true, employmentType: 'full-time', minDaysPerWeek: 5, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }, color: '#000' },
    ]
    const dl = dayLevels()
    const { schedule, score } = optimizeSchedule(emps, dl, {})
    const recs = generateRecommendations(schedule, emps, dl, {}, score)
    expect(recs.some(r => r.id.startsWith('under-'))).toBe(true)
  })

  it('recomienda reducir planilla cuando hay sobrecontratación marcada', () => {
    const dl = dayLevels()
    const { schedule, score } = optimizeSchedule(DEFAULT_EMPLOYEES, dl, {})
    const recs = generateRecommendations(schedule, DEFAULT_EMPLOYEES, dl, {}, score)
    expect(recs.some(r => r.id === 'roster-over')).toBe(true)
  })

  it('recomendaciones vienen ordenadas por prioridad', () => {
    const dl = dayLevels()
    const { schedule, score } = optimizeSchedule(DEFAULT_EMPLOYEES, dl, {})
    const recs = generateRecommendations(schedule, DEFAULT_EMPLOYEES, dl, {}, score)
    const order = { high: 0, medium: 1, low: 2 }
    for (let i = 1; i < recs.length; i++) {
      expect(order[recs[i].priority]).toBeGreaterThanOrEqual(order[recs[i - 1].priority])
    }
  })

  it('cada recomendación tiene id, title, detail y priority', () => {
    const dl = dayLevels()
    const { schedule, score } = optimizeSchedule(DEFAULT_EMPLOYEES, dl, {})
    const recs = generateRecommendations(schedule, DEFAULT_EMPLOYEES, dl, {}, score)
    recs.forEach(r => {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.detail).toBeTruthy()
      expect(['high', 'medium', 'low']).toContain(r.priority)
    })
  })
})
