import { EMPLOYMENT_TYPES } from '../data/defaultData'

/**
 * Grid de tarjetas de empleado. Click en una tarjeta dispara `onEdit(emp)`.
 */
export default function EmployeeCardGrid({ employees, onEdit }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
      role="list"
      aria-label="Equipo de empleados"
    >
      {employees.map(emp => (
        <EmployeeCard key={emp.id} emp={emp} onEdit={onEdit} />
      ))}
    </div>
  )
}

function EmployeeCard({ emp, onEdit }) {
  const employmentLabel =
    emp.employmentType === 'part-time' ? `PT·${emp.minDaysPerWeek}d` : 'FT·5d'
  const badgeClass =
    EMPLOYMENT_TYPES[emp.employmentType ?? 'full-time']?.badgeClass ??
    'bg-slate-100 text-slate-600'

  return (
    <button
      type="button"
      role="listitem"
      onClick={() => onEdit(emp)}
      aria-label={`Editar ${emp.name}`}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-left hover:shadow-md hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          aria-hidden="true"
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: emp.color }}
        />
        <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
          {emp.name}
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        <span className={`text-[9px] px-1 py-0 rounded font-bold leading-tight ${badgeClass}`}>
          {employmentLabel}
        </span>
        {emp.isManager && (
          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0 rounded font-bold leading-tight">
            Sup.
          </span>
        )}
        {emp.isCashier && (
          <span className="text-[9px] bg-teal-100 text-teal-800 px-1 py-0 rounded font-bold">
            Caja
          </span>
        )}
        {!emp.isCashier && emp.cashierKnowledge && (
          <span
            className="text-[9px] bg-teal-50 text-teal-700 px-1 py-0 rounded font-bold border border-teal-200"
            title="Puede cubrir caja si falta una cajera"
          >
            Caja+
          </span>
        )}
        {emp.isDishwasher && (
          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0 rounded font-bold">
            DW
          </span>
        )}
        {emp.hasSecondJob && (
          <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0 rounded font-bold">
            2J
          </span>
        )}
      </div>
      {emp.notes && <p className="text-[10px] text-slate-400 mt-1 truncate">{emp.notes}</p>}
    </button>
  )
}
