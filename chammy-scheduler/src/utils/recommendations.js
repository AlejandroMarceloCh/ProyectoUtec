/**
 * Motor de recomendaciones: analiza el schedule + capacidad y sugiere
 * acciones concretas para subir el score hacia 100.
 *
 * Cada recomendación tiene:
 * - id: estable, útil para keys en React
 * - priority: 'high' | 'medium' | 'low'
 * - title: frase corta accionable
 * - detail: explicación
 * - impact: estimación textual del impacto
 * - category: 'staffing' | 'roles' | 'roster' | 'quality'
 */

import { DAYS, DAY_LABELS, analyzeCapacity } from './optimizer'

export function generateRecommendations(schedule, employees, dayLevels, snowByDay, scoreData) {
  const recs = []
  if (!scoreData) return recs

  // ── 1) Días con falta de staff ──────────────────────────────────────────
  const understaffedDays = DAYS.filter(d => {
    const ds = scoreData.dayScores?.[d]
    return ds && ds.actual < ds.optimal
  })
  understaffedDays.forEach(d => {
    const ds = scoreData.dayScores[d]
    const gap = ds.optimal - ds.actual
    const otherDays = DAYS.filter(other => {
      const o = scoreData.dayScores[other]
      return o && o.actual > o.optimal
    })
    const sourceHint =
      otherDays.length > 0
        ? `Podrías mover a alguien desde ${otherDays.map(x => DAY_LABELS[x]).join(', ')} (donde hay exceso).`
        : 'Considera sumar disponibilidad.'
    recs.push({
      id: `under-${d}`,
      priority: gap >= 2 ? 'high' : 'medium',
      category: 'staffing',
      title: `${DAY_LABELS[d]}: faltan ${gap} ${gap === 1 ? 'persona' : 'personas'}`,
      detail: `Hay ${ds.actual}/${ds.optimal} personas asignadas. ${sourceHint}`,
      impact: `+${gap * 2} puntos de score al cubrir`,
    })
  })

  // ── 2) Exceso de staff ──────────────────────────────────────────────────
  const overstaffedDays = DAYS.filter(d => {
    const ds = scoreData.dayScores?.[d]
    return ds && ds.actual > ds.max
  })
  overstaffedDays.forEach(d => {
    const ds = scoreData.dayScores[d]
    const surplus = ds.actual - ds.optimal
    recs.push({
      id: `over-${d}`,
      priority: 'medium',
      category: 'staffing',
      title: `${DAY_LABELS[d]}: sobran ${surplus} personas`,
      detail: `Estás en ${ds.actual}/${ds.optimal}. Quitar turnos libera horas y mejora el score.`,
      impact: `+${surplus} puntos de score`,
    })
  })

  // ── 3) Faltan cajeras ───────────────────────────────────────────────────
  DAYS.forEach(d => {
    const ds = scoreData.dayScores?.[d]
    if (!ds) return
    const need = ds.requiredCashiers
    if (ds.cashiers < need) {
      const gap = need - ds.cashiers
      const capable = employees.filter(e => (e.isCashier || e.cashierKnowledge) && e.availability[d])
      const workingButNotCash = capable.filter(e => schedule[e.id]?.[d]).length
      const notWorking = capable.filter(e => !schedule[e.id]?.[d])
      const suggestion =
        notWorking.length > 0
          ? `Sugerencia: añade a ${notWorking.slice(0, 2).map(e => e.name).join(' o ')} ese día.`
          : workingButNotCash > 0
            ? 'Hay personal capacitado trabajando — ya cuentan como cajeros efectivos.'
            : 'Nadie con capacidad de caja disponible ese día — considera entrenar más personal.'
      recs.push({
        id: `cash-${d}`,
        priority: 'high',
        category: 'roles',
        title: `${DAY_LABELS[d]}: faltan ${gap} ${gap === 1 ? 'cajera' : 'cajeras'}`,
        detail: `Necesitas ${need}, tienes ${ds.cashiers}. ${suggestion}`,
        impact: `+${gap * 4} puntos de score`,
      })
    }
  })

  // ── 4) Sin supervisor ───────────────────────────────────────────────────
  DAYS.forEach(d => {
    const ds = scoreData.dayScores?.[d]
    if (ds && ds.managers === 0) {
      const availableMgrs = employees.filter(e => e.isManager && e.availability[d])
      const hint =
        availableMgrs.length > 0
          ? `Puedes asignar a ${availableMgrs[0].name}.`
          : 'Nadie con rol de supervisor disponible ese día — considera capacitar a alguien más.'
      recs.push({
        id: `mgr-${d}`,
        priority: 'high',
        category: 'roles',
        title: `${DAY_LABELS[d]}: sin supervisor`,
        detail: `Debe haber al menos 1 supervisor cada día. ${hint}`,
        impact: '+5 puntos de score',
      })
    }
  })

  // ── 5) Empleados bajo su mínimo ─────────────────────────────────────────
  scoreData.employeeWarnings?.forEach(w => {
    recs.push({
      id: `emp-${w.name}`,
      priority: 'low',
      category: 'quality',
      title: `${w.name}: ${w.worked}/${w.required} días asignados`,
      detail: `Quedó por debajo de su contrato. Revisa si hay un día donde puedas sumarlo.`,
      impact: '+1 punto de score',
    })
  })

  // ── 6) Recomendaciones de roster (capacidad) ────────────────────────────
  const cap = analyzeCapacity(employees, dayLevels)
  if (cap.status === 'severely-over') {
    recs.push({
      id: 'roster-over',
      priority: 'medium',
      category: 'roster',
      title: `Sobre-contratación marcada: ${cap.overRatio}% de ocupación`,
      detail: `Hay ${cap.surplusShifts} turnos comprometidos por semana de más. Reducir la planilla a ~${cap.recommendedHeadcount} empleados activos alinearía la oferta con la demanda.`,
      impact: `-${Math.abs(cap.surplusHours)}h innecesarias por semana`,
    })
  } else if (cap.status === 'under') {
    recs.push({
      id: 'roster-under',
      priority: 'high',
      category: 'roster',
      title: 'Planilla corta para la demanda',
      detail: `Tienes ${cap.weeklyContractedShifts} turnos comprometidos vs. ${cap.weeklyOptimalShifts} óptimos. Considera contratar +${cap.recommendedHeadcount - cap.totalEmployees} empleados o ampliar los mínimos de los PT.`,
      impact: 'Cubriría días que hoy quedan bajos',
    })
  }

  // ── 7) Entrenar a más personal en caja (si sólo una clase puede cobrar) ─
  const cashCapableCount = employees.filter(e => e.isCashier || e.cashierKnowledge).length
  if (cashCapableCount < 4 && employees.length >= 6) {
    recs.push({
      id: 'train-cash',
      priority: 'low',
      category: 'quality',
      title: `Sólo ${cashCapableCount} empleados saben operar caja`,
      detail:
        'Entrenar a 1-2 personas adicionales como respaldo (atributo "Sabe operar la caja") da más flexibilidad para cubrir viernes y sábados.',
      impact: 'Reduce huecos de cajera futuros',
    })
  }

  // Ordena por prioridad
  const order = { high: 0, medium: 1, low: 2 }
  recs.sort((a, b) => order[a.priority] - order[b.priority])
  return recs
}
