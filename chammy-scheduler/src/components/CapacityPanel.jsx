import { DAY_SHORT } from '../utils/optimizer'

const STATUS_CONFIG = {
  'optimal': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '✅',
    title: 'Planilla bien dimensionada',
    titleColor: 'text-emerald-700',
    pill: 'bg-emerald-100 text-emerald-800',
  },
  'over': {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: '⚠️',
    title: 'Posible sobre-contratación',
    titleColor: 'text-amber-700',
    pill: 'bg-amber-100 text-amber-800',
  },
  'severely-over': {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: '🚨',
    title: 'Sobre-contratación marcada',
    titleColor: 'text-red-700',
    pill: 'bg-red-100 text-red-800',
  },
  'under': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: '📉',
    title: 'Planilla corta para la demanda',
    titleColor: 'text-blue-700',
    pill: 'bg-blue-100 text-blue-800',
  },
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center ${highlight ? 'bg-white shadow-sm border border-slate-100' : ''}`}>
      <div className={`text-2xl font-extrabold ${highlight ? 'text-slate-800' : 'text-slate-600'}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-500 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function GapBar({ contracted, optimal, max }) {
  const safeMax = Math.max(contracted, max, 1)
  const optPct  = Math.min(100, (optimal    / safeMax) * 100)
  const maxPct  = Math.min(100, (max        / safeMax) * 100)
  const contPct = Math.min(100, (contracted / safeMax) * 100)
  const isOver  = contracted > optimal

  return (
    <div className="w-full">
      <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
        {/* Acceptable zone */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-100 rounded-full"
          style={{ left: 0, width: `${maxPct}%` }}
        />
        {/* Optimal marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-emerald-500 z-20"
          style={{ left: `${optPct}%` }}
          title={`Óptimo: ${optimal} turnos/semana`}
        />
        {/* Max marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-300 z-20"
          style={{ left: `${maxPct}%` }}
          title={`Máximo: ${max} turnos/semana`}
        />
        {/* Contracted bar */}
        <div
          className={`absolute top-0 bottom-0 rounded-full z-10 transition-all duration-500 ${isOver ? 'bg-red-400' : 'bg-emerald-400'}`}
          style={{ width: `${contPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
        <span>0</span>
        <span className="text-emerald-600 font-semibold">Óptimo: {optimal}</span>
        <span className="text-orange-500">Máx: {max}</span>
        <span className={`font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
          Contratado: {contracted}
        </span>
      </div>
    </div>
  )
}

export default function CapacityPanel({ capacityData }) {
  if (!capacityData) return null

  const cfg = STATUS_CONFIG[capacityData.status]
  const {
    totalEmployees,
    weeklyContractedShifts,
    weeklyContractedHours,
    weeklyOptimalShifts,
    weeklyOptimalHours,
    weeklyMaxShifts,
    surplusShifts,
    surplusHours,
    overRatio,
    status,
    recommendedHeadcount,
    dayBreakdown,
  } = capacityData
  // weeklyMinShifts unused but destructured above for GapBar

  const isOver = status === 'over' || status === 'severely-over'
  const isOptimal = status === 'optimal'

  return (
    <div className={`rounded-2xl border-2 p-5 mb-5 ${cfg.bg} ${cfg.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <h2 className={`font-bold text-base leading-tight ${cfg.titleColor}`}>
              {cfg.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Análisis de planilla vs. demanda semanal estimada por el clima
            </p>
          </div>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${cfg.pill}`}>
          {overRatio}% de ocupación
        </span>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <Stat
          label="Empleados activos"
          value={totalEmployees}
          sub={`FT: ${capacityData.fullTimeCount}  ·  PT: ${capacityData.partTimeCount}`}
          highlight
        />
        <Stat
          label="Turnos contratados / sem."
          value={weeklyContractedShifts}
          sub={`FT: ${capacityData.ftShifts} · PT: ${capacityData.ptShifts} · ${weeklyContractedHours}h`}
          highlight
        />
        <Stat
          label="Turnos óptimos / sem."
          value={weeklyOptimalShifts}
          sub={`${weeklyOptimalHours}h ideales`}
          highlight
        />
        <Stat
          label={isOver ? 'Exceso de turnos' : 'Margen disponible'}
          value={isOver ? `+${surplusShifts}` : surplusShifts <= 0 ? Math.abs(surplusShifts) : `+${surplusShifts}`}
          sub={`≈ ${Math.abs(surplusHours)}h extra/sem.`}
          highlight
        />
      </div>

      {/* Visual gap bar */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Turnos comprometidos vs. rango óptimo de la semana
        </p>
        <GapBar
          contracted={weeklyContractedShifts}
          optimal={weeklyOptimalShifts}
          max={weeklyMaxShifts}
        />
      </div>

      {/* Actionable message */}
      <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${isOver ? 'bg-white/60 border border-red-100' : isOptimal ? 'bg-white/60 border border-emerald-100' : 'bg-white/60 border border-slate-100'}`}>
        {status === 'severely-over' && (
          <p>
            <strong>La planilla tiene {surplusShifts} turnos más por semana de los que el local necesita</strong>
            {' '}(~{Math.abs(surplusHours)}h extra). Eso obliga al sistema a asignar personas cuando realmente no hacen falta,
            y crea los días en que hay 5 personas en la cocina sin mucho que hacer.
            {' '}<strong>Reducir la planilla a ~{recommendedHeadcount} empleados activos</strong> (o bajar los mínimos de días contratados)
            llevaría el horario a ser óptimo automáticamente.
          </p>
        )}
        {status === 'over' && (
          <p>
            Hay un <strong>exceso de {surplusShifts} turnos semanales</strong> comprometidos sobre el óptimo.
            El optimizador puede manejar esto, pero algunos días quedará con más gente de la necesaria.
            Considera bajar los mínimos de días de empleados de apoyo/adicionales, o ajustar el headcount.
          </p>
        )}
        {status === 'optimal' && (
          <p>
            La planilla está bien dimensionada para la demanda de esta semana.
            El optimizador puede generar un horario cercano al ideal.
          </p>
        )}
        {status === 'under' && (
          <p>
            La planilla tiene <strong>menos turnos comprometidos ({weeklyContractedShifts}) que los necesarios ({weeklyOptimalShifts})</strong>.
            Pueden quedar días sin cubrir el mínimo de personal. Considera subir los mínimos o contratar más personal.
          </p>
        )}
      </div>

      {/* Per-day breakdown */}
      <details className="mt-4">
        <summary className="text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700">
          Ver desglose por día ›
        </summary>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {dayBreakdown.map(d => (
            <div key={d.day} className="bg-white/70 rounded-lg p-2 text-center border border-slate-100">
              <div className="text-xs font-bold text-slate-600">{DAY_SHORT[d.day]}</div>
              <div className="text-sm font-extrabold text-slate-800 mt-0.5">{d.optimal}</div>
              <div className="text-[9px] text-slate-400 leading-tight">pers. óptimas</div>
              <div className="text-[9px] text-slate-400">{d.hours}h/turno</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
