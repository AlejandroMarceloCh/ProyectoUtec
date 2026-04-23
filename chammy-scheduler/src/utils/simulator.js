/**
 * Simulador de planilla: corre el optimizador con rosters hipotéticos
 * (añadiendo o quitando N empleados) y reporta el impacto en el score y la
 * capacidad. Útil para responder "¿qué pasaría si contrato X personas más?".
 *
 * No muta el roster original.
 */

import { optimizeSchedule, analyzeCapacity } from './optimizer'

const ALL_DAYS_AVAILABLE = {
  Mon: true,
  Tue: true,
  Wed: true,
  Thu: true,
  Fri: true,
  Sat: true,
  Sun: true,
}

function makeSyntheticEmployee(index, employmentType) {
  const isFT = employmentType === 'full-time'
  return {
    id: `__sim_${employmentType}_${index}`,
    name: isFT ? `Sim FT ${index + 1}` : `Sim PT ${index + 1}`,
    employmentType,
    minDaysPerWeek: isFT ? 5 : 2,
    scheduleGroup: 'kitchen',
    isManager: false,
    isCashier: false,
    isDishwasher: false,
    hasSecondJob: false,
    availability: { ...ALL_DAYS_AVAILABLE },
    color: '#94a3b8',
    notes: '',
  }
}

/**
 * Devuelve un roster con `delta` empleados del tipo `type` añadidos
 * (delta > 0) o removidos (delta < 0). Al remover, prioriza dejar intactos
 * a managers y cajeros (son restricciones duras del negocio).
 */
export function applyDelta(employees, delta, type) {
  if (delta === 0) return employees
  const wantFT = type === 'full-time'

  if (delta > 0) {
    const extras = Array.from({ length: delta }, (_, i) =>
      makeSyntheticEmployee(i, type)
    )
    return [...employees, ...extras]
  }

  const toRemove = -delta
  // Orden de preferencia para remover: primero empleados del tipo pedido,
  // no-manager, no-cashier, con menos compromiso (menor minDaysPerWeek).
  const prioritizedRemoval = [...employees].sort((a, b) => {
    const aMatchesType = (a.employmentType === 'full-time') === wantFT ? 0 : 1
    const bMatchesType = (b.employmentType === 'full-time') === wantFT ? 0 : 1
    if (aMatchesType !== bMatchesType) return aMatchesType - bMatchesType

    const aCritical = (a.isManager ? 2 : 0) + (a.isCashier ? 1 : 0)
    const bCritical = (b.isManager ? 2 : 0) + (b.isCashier ? 1 : 0)
    if (aCritical !== bCritical) return aCritical - bCritical

    return (a.minDaysPerWeek ?? 0) - (b.minDaysPerWeek ?? 0)
  })

  const removeIds = new Set(prioritizedRemoval.slice(0, toRemove).map(e => e.id))
  return employees.filter(e => !removeIds.has(e.id))
}

/**
 * Corre el optimizador para cada delta en [min, max] y devuelve los
 * resultados listos para graficar.
 */
export function simulateHeadcount(
  employees,
  dayLevels,
  snowByDay = {},
  { min = -4, max = 4, type = 'full-time' } = {}
) {
  const scenarios = []
  for (let delta = min; delta <= max; delta++) {
    const roster = applyDelta(employees, delta, type)
    if (roster.length === 0) continue

    const { score } = optimizeSchedule(roster, dayLevels, snowByDay)
    const capacity = analyzeCapacity(roster, dayLevels)

    scenarios.push({
      delta,
      headcount: roster.length,
      score: score.score,
      totalHours: score.totalHours,
      surplusShifts: capacity.surplusShifts,
      surplusHours: capacity.surplusHours,
      overRatio: capacity.overRatio,
      status: capacity.status,
      warnings:
        score.managerWarnings.length +
        (score.cashierWarnings?.length ?? 0) +
        score.employeeWarnings.length,
    })
  }
  return scenarios
}
