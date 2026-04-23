import { memo, useCallback, useState } from 'react'
import {
  DAYS,
  DAY_LABELS,
  DAY_SHORT,
  STAFFING_REQS,
  getEmployeeWeekStats,
} from '../utils/optimizer'

const STATUS_STYLES = {
  optimal: 'bg-emerald-500 text-emerald-50',
  acceptable: 'bg-amber-400 text-amber-900',
  low: 'bg-orange-500 text-white',
  critical: 'bg-red-600 text-white animate-pulse',
  overstaffed: 'bg-violet-500 text-white',
}

const STATUS_LABELS = {
  optimal: '✓',
  acceptable: '≈',
  low: '▼',
  critical: '!!',
  overstaffed: '▲',
}

const STATUS_TEXT = {
  optimal: 'Óptimo',
  acceptable: 'Aceptable',
  low: 'Bajo',
  critical: 'Crítico',
  overstaffed: 'Exceso',
}

const DND_MIME = 'application/x-chammy-shift'

export default function ScheduleGrid({
  employees,
  schedule,
  dayLevels,
  scoreData,
  onToggle,
  onMoveShift,
  onSwapAssignment,
  optimizedSchedule,
  onEditEmployee,
}) {
  // Tracker de la celda que está siendo arrastrada, para estilos.
  const [draggingFrom, setDraggingFrom] = useState(null) // { empId, day } | null
  const [hoverTarget, setHoverTarget] = useState(null) // { empId, day } | null

  if (!schedule || employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 mb-5 text-center">
        <p className="text-slate-400 text-sm">
          Presiona <strong>Optimizar</strong> para generar el horario automáticamente, o activa
          turnos manualmente en la tabla.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 overflow-hidden">
      <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2 flex-wrap">
        <span aria-hidden="true">💡</span>
        <span>
          <strong>Tip:</strong> haz clic en una celda para activar/quitar el turno, o{' '}
          <strong>arrastra un turno</strong> ✓ a otro día (misma persona) o a otra fila (intercambia
          con otro empleado).
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Horario semanal por empleado</caption>
          <thead>
            <tr className="bg-slate-800 text-white">
              <th
                scope="col"
                className="text-left px-4 py-3 text-sm font-semibold w-36 sticky left-0 bg-slate-800 z-10"
              >
                Empleado
              </th>
              {DAYS.map(day => {
                const req = STAFFING_REQS[dayLevels[day] ?? 'medium']
                return (
                  <th key={day} scope="col" className="px-2 py-3 text-center min-w-[72px]">
                    <div className="text-xs font-bold">{DAY_SHORT[day]}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      óptimo: {req.optimal}
                    </div>
                  </th>
                )
              })}
              <th
                scope="col"
                className="px-3 py-3 text-center text-xs font-semibold text-slate-300 min-w-[80px]"
              >
                Días / Hrs
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, idx) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                idx={idx}
                empSchedule={schedule[emp.id]}
                empOptimized={optimizedSchedule?.[emp.id]}
                dayLevels={dayLevels}
                onToggle={onToggle}
                onEditEmployee={onEditEmployee}
                draggingFrom={draggingFrom}
                hoverTarget={hoverTarget}
                setDraggingFrom={setDraggingFrom}
                setHoverTarget={setHoverTarget}
                onMoveShift={onMoveShift}
                onSwapAssignment={onSwapAssignment}
              />
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-slate-800 text-white">
              <th
                scope="row"
                className="text-left px-4 py-3 text-sm font-bold sticky left-0 bg-slate-800 z-10"
              >
                Total staff
              </th>
              {DAYS.map(day => {
                const ds = scoreData?.dayScores?.[day]
                const count = ds?.actual ?? 0
                const statusStyle = ds ? STATUS_STYLES[ds.status] : 'bg-slate-600'

                return (
                  <td key={day} className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold">{count}</span>
                      {ds && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusStyle}`}
                          title={`Óptimo: ${ds.optimal} | Mín: ${ds.min} | Máx: ${ds.max}`}
                        >
                          {STATUS_LABELS[ds.status]}
                        </span>
                      )}
                    </div>
                  </td>
                )
              })}
              <td className="px-3 py-3 text-center">
                <div className="text-xs text-slate-400 font-medium">
                  {scoreData ? `${scoreData.totalHours}h total` : '—'}
                </div>
              </td>
            </tr>

            <tr className="bg-slate-700">
              <td colSpan={DAYS.length + 2} className="px-4 py-2">
                <div className="flex items-center gap-4 text-[10px] text-slate-300 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([status, symbol]) => (
                    <span key={status} className="flex items-center gap-1">
                      <span
                        className={`px-1 py-0 rounded text-[9px] font-bold ${STATUS_STYLES[status]}`}
                      >
                        {symbol}
                      </span>
                      <span>{STATUS_TEXT[status] ?? status}</span>
                    </span>
                  ))}
                  <span className="flex items-center gap-1 ml-4">
                    <span className="w-3 h-3 rounded border-2 border-amber-400 inline-block" />
                    Cambio manual
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const EmployeeRow = memo(function EmployeeRow({
  emp,
  idx,
  empSchedule,
  empOptimized,
  dayLevels,
  onToggle,
  onEditEmployee,
  draggingFrom,
  hoverTarget,
  setDraggingFrom,
  setHoverTarget,
  onMoveShift,
  onSwapAssignment,
}) {
  const stats = getEmployeeWeekStats(emp.id, { [emp.id]: empSchedule }, dayLevels)
  const isEven = idx % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-slate-50'

  const handleEdit = useCallback(() => onEditEmployee?.(emp), [onEditEmployee, emp])

  return (
    <tr className={`${rowBg} hover:bg-slate-100 transition-colors`}>
      <th
        scope="row"
        className={`text-left font-normal px-4 py-2.5 sticky left-0 z-10 ${rowBg} hover:bg-slate-100`}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: emp.color }}
          />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handleEdit}
              aria-label={`Editar ${emp.name}`}
              className="text-sm font-medium text-slate-800 leading-tight text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors w-full truncate"
              title="Editar perfil o eliminar empleado"
            >
              {emp.name}
            </button>
            <div className="flex items-center gap-1 mt-0.5">
              {emp.isManager && (
                <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0 rounded font-semibold leading-tight">
                  Supervisor
                </span>
              )}
              {emp.isCashier && (
                <span className="text-[8px] bg-teal-100 text-teal-800 px-1 py-0 rounded font-semibold">
                  CAJA
                </span>
              )}
              {!emp.isCashier && emp.cashierKnowledge && (
                <span
                  className="text-[8px] bg-teal-50 text-teal-700 px-1 py-0 rounded font-semibold border border-teal-200"
                  title="Sabe operar caja (respaldo)"
                >
                  CAJA+
                </span>
              )}
              {emp.isDishwasher && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0 rounded font-semibold">
                  DISH
                </span>
              )}
              {emp.hasSecondJob && (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0 rounded font-semibold">
                  2JOB
                </span>
              )}
            </div>
          </div>
        </div>
      </th>

      {DAYS.map(day => (
        <ShiftCell
          key={day}
          emp={emp}
          day={day}
          isWorking={empSchedule?.[day] ?? false}
          wasOptimal={empOptimized?.[day] ?? false}
          hasOptimized={!!empOptimized}
          onToggle={onToggle}
          onMoveShift={onMoveShift}
          onSwapAssignment={onSwapAssignment}
          draggingFrom={draggingFrom}
          hoverTarget={hoverTarget}
          setDraggingFrom={setDraggingFrom}
          setHoverTarget={setHoverTarget}
        />
      ))}

      <td className="px-3 py-2.5 text-center">
        <div className="text-sm font-bold text-slate-700">{stats.daysWorked}d</div>
        <div className="text-[11px] text-slate-400">{stats.hours}h</div>
        {stats.daysWorked < emp.minDaysPerWeek && (
          <div className="text-[10px] text-red-500 font-semibold mt-0.5">
            ↓ min {emp.minDaysPerWeek}d
          </div>
        )}
      </td>
    </tr>
  )
})

const ShiftCell = memo(function ShiftCell({
  emp,
  day,
  isWorking,
  wasOptimal,
  hasOptimized,
  onToggle,
  onMoveShift,
  onSwapAssignment,
  draggingFrom,
  hoverTarget,
  setDraggingFrom,
  setHoverTarget,
}) {
  const isAvailable = emp.availability[day]
  const isManualChange = hasOptimized && isWorking !== wasOptimal

  const isDragOrigin =
    draggingFrom && draggingFrom.empId === emp.id && draggingFrom.day === day
  const isDragOver =
    hoverTarget && hoverTarget.empId === emp.id && hoverTarget.day === day

  const handleClick = useCallback(() => onToggle(emp.id, day), [onToggle, emp.id, day])

  const handleDragStart = useCallback(
    e => {
      if (!isWorking) {
        e.preventDefault()
        return
      }
      const payload = { empId: emp.id, day }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData(DND_MIME, JSON.stringify(payload))
      // Fallback para navegadores que requieren algún dato
      e.dataTransfer.setData('text/plain', `${emp.id}|${day}`)
      setDraggingFrom(payload)
    },
    [isWorking, emp.id, day, setDraggingFrom]
  )

  const handleDragEnd = useCallback(() => {
    setDraggingFrom(null)
    setHoverTarget(null)
  }, [setDraggingFrom, setHoverTarget])

  const handleDragOver = useCallback(
    e => {
      if (!isAvailable) return
      if (!draggingFrom) return
      // Mismo origen: no hacer nada
      if (draggingFrom.empId === emp.id && draggingFrom.day === day) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (!isDragOver) setHoverTarget({ empId: emp.id, day })
    },
    [isAvailable, draggingFrom, emp.id, day, isDragOver, setHoverTarget]
  )

  const handleDragLeave = useCallback(() => {
    if (isDragOver) setHoverTarget(null)
  }, [isDragOver, setHoverTarget])

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData('text/plain')
      if (!raw) return
      let payload
      try {
        payload = raw.includes('{') ? JSON.parse(raw) : null
      } catch {
        payload = null
      }
      if (!payload) {
        const [pEmp, pDay] = raw.split('|')
        payload = { empId: pEmp, day: pDay }
      }
      setDraggingFrom(null)
      setHoverTarget(null)

      // Caso 1: mismo empleado, diferente día → mover
      if (payload.empId === emp.id && payload.day !== day) {
        onMoveShift?.(emp.id, payload.day, day)
        return
      }
      // Caso 2: distinto empleado, mismo día → swap
      if (payload.empId !== emp.id && payload.day === day) {
        onSwapAssignment?.(payload.empId, emp.id, day)
        return
      }
      // Caso 3: distinto empleado + distinto día → no soportado por ahora
    },
    [emp.id, day, onMoveShift, onSwapAssignment, setDraggingFrom, setHoverTarget]
  )

  if (!isAvailable) {
    return (
      <td className="px-1.5 py-1.5 text-center">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-200 mx-auto"
          aria-label={`${emp.name}, ${DAY_LABELS[day]}: no disponible`}
          title="No disponible este día"
        >
          <span aria-hidden="true" className="text-slate-300 text-xs">
            —
          </span>
        </div>
      </td>
    )
  }

  return (
    <td className="px-1.5 py-1.5 text-center" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isWorking}
        draggable={isWorking}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        aria-label={`${emp.name}, ${DAY_LABELS[day]}: ${isWorking ? 'trabajando (clic para quitar, arrastra para mover)' : 'libre (clic para agregar)'}${isManualChange ? ' — cambio manual' : ''}`}
        className={`shift-cell focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
          isWorking ? 'shift-on cursor-grab active:cursor-grabbing' : 'shift-off'
        } ${isManualChange ? 'ring-2 ring-amber-400 ring-offset-1' : ''} ${
          isDragOrigin ? 'opacity-40 scale-95' : ''
        } ${
          isDragOver ? 'ring-4 ring-indigo-400 ring-offset-1 scale-110' : ''
        } transition-all`}
        style={isWorking ? { backgroundColor: emp.color } : {}}
        title={
          isWorking
            ? 'Trabajando — clic para quitar, arrastra para mover'
            : 'Libre — clic para agregar, o suelta aquí un turno'
        }
      >
        <span aria-hidden="true">{isWorking ? '✓' : ''}</span>
      </button>
    </td>
  )
})
