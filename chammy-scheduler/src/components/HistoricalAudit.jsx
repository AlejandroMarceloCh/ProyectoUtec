import { useMemo, useState } from 'react'
import { runHistoricalAudit } from '../utils/historicalAudit'
import { DAYS, DAY_SHORT } from '../utils/optimizer'
import { applyDelta } from '../utils/simulator'

const PERIODS = [
  { days: 30, label: '30 días' },
  { days: 60, label: '60 días' },
  { days: 90, label: '90 días' },
]

export default function HistoricalAudit({ employees }) {
  const [days, setDays] = useState(90)
  const [deltaFT, setDeltaFT] = useState(0)
  const [deltaPT, setDeltaPT] = useState(0)

  const baseline = useMemo(
    () => runHistoricalAudit(employees, { days }),
    [employees, days]
  )

  const scenario = useMemo(() => {
    if (deltaFT === 0 && deltaPT === 0) return null
    let roster = employees
    if (deltaFT !== 0) roster = applyDelta(roster, deltaFT, 'full-time')
    if (deltaPT !== 0) roster = applyDelta(roster, deltaPT, 'part-time')
    return runHistoricalAudit(roster, { days })
  }, [employees, days, deltaFT, deltaPT])

  return (
    <details className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-2xl">
            📊
          </span>
          <div>
            <h2 className="font-bold text-slate-800 text-base leading-tight">
              Auditoría histórica · Análisis de serie de tiempo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simula {days} días de operación con clima sintético y mide el desempeño del
              algoritmo
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>

      <div className="mt-5 space-y-5">
        {/* Controles */}
        <div className="flex flex-wrap items-end gap-4">
          <Control label="Periodo">
            <div className="flex gap-1" role="radiogroup" aria-label="Periodo de auditoría">
              {PERIODS.map(p => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setDays(p.days)}
                  role="radio"
                  aria-checked={days === p.days}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors ${
                    days === p.days
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Control>

          <Control label="Escenario: Δ Full-time">
            <DeltaPicker value={deltaFT} onChange={setDeltaFT} />
          </Control>

          <Control label="Escenario: Δ Part-time">
            <DeltaPicker value={deltaPT} onChange={setDeltaPT} />
          </Control>

          {(deltaFT !== 0 || deltaPT !== 0) && (
            <button
              type="button"
              onClick={() => {
                setDeltaFT(0)
                setDeltaPT(0)
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline self-center"
            >
              Reset escenario
            </button>
          )}
        </div>

        {/* KPIs */}
        <KpiRow baseline={baseline.summary} scenario={scenario?.summary} />

        {/* Gráfico serie de tiempo */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Score semanal a lo largo del periodo
          </h3>
          <TimeSeriesChart baseline={baseline} scenario={scenario} />
        </div>

        {/* Análisis por día de semana */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            ¿Qué días son sistemáticamente problemáticos?
          </h3>
          <WeekdayBreakdown byWeekday={baseline.summary.byWeekday} />
        </div>

        {/* Distribución */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Distribución de {baseline.summary.totalDays} días simulados
          </h3>
          <Distribution summary={baseline.summary} scenario={scenario?.summary} />
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong>Nota:</strong> los datos climáticos se generan con un modelo estocástico
          plausible para un resort (estacionalidad + tormentas) usando seed fija para que los
          resultados sean reproducibles. Esto <em>no</em> sustituye datos reales, pero sirve
          para stress-testear cómo responde el algoritmo ante meses de demanda variable.
        </p>
      </div>
    </details>
  )
}

function Control({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function DeltaPicker({ value, onChange }) {
  return (
    <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(-4, value - 1))}
        aria-label="Disminuir"
        className="px-2 py-1 hover:bg-slate-100 text-slate-600 font-bold focus:outline-none focus:bg-slate-100"
      >
        −
      </button>
      <span
        className={`px-3 py-1 text-sm font-bold min-w-[40px] text-center ${
          value === 0 ? 'text-slate-400' : value > 0 ? 'text-emerald-600' : 'text-red-600'
        }`}
        aria-live="polite"
      >
        {value > 0 ? `+${value}` : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(4, value + 1))}
        aria-label="Aumentar"
        className="px-2 py-1 hover:bg-slate-100 text-slate-600 font-bold focus:outline-none focus:bg-slate-100"
      >
        +
      </button>
    </div>
  )
}

function KpiRow({ baseline, scenario }) {
  const kpis = [
    { label: 'Score promedio', base: baseline.avgScore, scen: scenario?.avgScore, suffix: '/100' },
    {
      label: 'Días óptimos',
      base: baseline.optimalDays,
      scen: scenario?.optimalDays,
      suffix: ` / ${baseline.totalDays}`,
    },
    {
      label: 'Días con poco staff',
      base: baseline.understaffedDays,
      scen: scenario?.understaffedDays,
      suffix: '',
      negative: true,
    },
    {
      label: 'Días con exceso',
      base: baseline.overstaffedDays,
      scen: scenario?.overstaffedDays,
      suffix: '',
      negative: true,
    },
    {
      label: 'Huecos de cajera',
      base: baseline.totalCashierGaps,
      scen: scenario?.totalCashierGaps,
      suffix: '',
      negative: true,
    },
    {
      label: 'Horas asignadas',
      base: baseline.totalAssignedHours,
      scen: scenario?.totalAssignedHours,
      suffix: 'h',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {kpis.map(k => (
        <Kpi key={k.label} {...k} />
      ))}
    </div>
  )
}

function Kpi({ label, base, scen, suffix, negative }) {
  const delta = scen != null ? scen - base : null
  const deltaColor =
    delta == null || delta === 0
      ? 'text-slate-400'
      : (delta > 0) === !negative
        ? 'text-emerald-600'
        : 'text-red-600'

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">
        {label}
      </div>
      <div className="text-xl font-extrabold text-slate-800 mt-1">
        {scen != null ? scen : base}
        <span className="text-xs font-medium text-slate-400 ml-0.5">{suffix}</span>
      </div>
      {delta != null && delta !== 0 && (
        <div className={`text-[11px] font-bold mt-0.5 ${deltaColor}`}>
          {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}
          {suffix.includes('h') && 'h'} <span className="font-normal text-slate-400">vs. hoy</span>
        </div>
      )}
    </div>
  )
}

function TimeSeriesChart({ baseline, scenario }) {
  const W = 680
  const H = 220
  const PAD = { top: 20, right: 20, bottom: 38, left: 36 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const weeks = baseline.weeks
  if (weeks.length === 0) return null

  const xAt = i => PAD.left + (weeks.length === 1 ? innerW / 2 : (i * innerW) / (weeks.length - 1))
  const yAt = v => PAD.top + innerH - (v / 100) * innerH

  const baselinePath = weeks
    .map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(w.score)}`)
    .join(' ')

  const scenarioPath = scenario?.weeks
    ?.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(w.score)}`)
    .join(' ')

  return (
    <div role="img" aria-label="Gráfico de serie de tiempo del score semanal">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Horizontal grid */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="#e2e8f0"
              strokeDasharray={v === 0 || v === 100 ? '0' : '3 3'}
            />
            <text
              x={PAD.left - 6}
              y={yAt(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Umbral "bueno" (65) */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={yAt(65)}
          y2={yAt(65)}
          stroke="#10b98155"
          strokeWidth="1"
          strokeDasharray="6 4"
        />
        <text x={W - PAD.right - 2} y={yAt(65) - 4} fontSize="9" fill="#10b981" textAnchor="end">
          umbral bueno
        </text>

        {/* Baseline area */}
        <path
          d={`${baselinePath} L ${xAt(weeks.length - 1)} ${PAD.top + innerH} L ${xAt(0)} ${PAD.top + innerH} Z`}
          fill="#6366f122"
        />

        {/* Baseline line */}
        <path d={baselinePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />

        {/* Baseline points */}
        {weeks.map((w, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(w.score)} r={3.5} fill="#6366f1" />
        ))}

        {/* Scenario line */}
        {scenarioPath && <path d={scenarioPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />}
        {scenario?.weeks?.map((w, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(w.score)} r={3} fill="#ef4444" />
        ))}

        {/* Eje X: semanas */}
        {weeks.map((w, i) => {
          if (i % Math.ceil(weeks.length / 7) !== 0 && i !== weeks.length - 1) return null
          const label = new Date(w.weekStart).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          })
          return (
            <text
              key={i}
              x={xAt(i)}
              y={H - PAD.bottom + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {label}
            </text>
          )
        })}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
          Semana inicio
        </text>
      </svg>

      <div className="flex items-center justify-center gap-5 text-[11px] text-slate-500 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" />
          Hoy (planilla actual)
        </span>
        {scenario && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 inline-block"
              style={{
                background:
                  'repeating-linear-gradient(90deg,#ef4444 0 5px,transparent 5px 8px)',
              }}
            />
            Escenario simulado
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-emerald-500 inline-block" />
          Umbral “bueno” (65)
        </span>
      </div>
    </div>
  )
}

function WeekdayBreakdown({ byWeekday }) {
  const maxOptimal = Math.max(...Object.values(byWeekday).map(d => d.avgOptimal), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <Th>Día</Th>
            <Th>Staff promedio</Th>
            <Th>Staff óptimo prom.</Th>
            <Th>% días con poco staff</Th>
            <Th>% días con exceso</Th>
            <Th>Faltas de cajera</Th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map(d => {
            const row = byWeekday[d]
            return (
              <tr key={d} className="border-t border-slate-100">
                <Td>
                  <strong>{DAY_SHORT[d]}</strong>
                </Td>
                <Td>{row.avgStaff}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{row.avgOptimal}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded">
                      <div
                        className="h-full bg-indigo-400 rounded"
                        style={{ width: `${(row.avgOptimal / maxOptimal) * 100}%` }}
                      />
                    </div>
                  </div>
                </Td>
                <Td>
                  <PercentBadge value={row.understaffedPct} negative />
                </Td>
                <Td>
                  <PercentBadge value={row.overstaffedPct} negative />
                </Td>
                <Td>
                  {row.cashierShortDays === 0 ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-red-600 font-semibold">{row.cashierShortDays}</span>
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PercentBadge({ value, negative }) {
  const isBad = (negative && value > 20) || (!negative && value < 50)
  const color = value === 0 ? '#94a3b8' : isBad ? '#ef4444' : value > 10 ? '#f59e0b' : '#10b981'
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {value}%
    </span>
  )
}

function Distribution({ summary, scenario }) {
  const total = summary.totalDays
  const segments = [
    { key: 'optimal', label: 'Óptimo', color: '#10b981', value: summary.optimalDays },
    {
      key: 'other',
      label: 'Aceptable',
      color: '#64748b',
      value: total - summary.optimalDays - summary.understaffedDays - summary.overstaffedDays,
    },
    { key: 'under', label: 'Poco staff', color: '#ef4444', value: summary.understaffedDays },
    { key: 'over', label: 'Exceso', color: '#f59e0b', value: summary.overstaffedDays },
  ]

  return (
    <div>
      <div className="flex h-6 rounded-lg overflow-hidden border border-slate-200">
        {segments.map(s => {
          const pct = (s.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={s.key}
              title={`${s.label}: ${s.value} días (${Math.round(pct)}%)`}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="flex items-center justify-center text-[10px] font-bold text-white"
            >
              {pct > 6 ? `${Math.round(pct)}%` : ''}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-600">
        {segments.map(s => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}: <strong>{s.value}</strong>
            {scenario && (
              <span className="text-slate-400">
                (→ {scenario[keyFor(s.key)]})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function keyFor(k) {
  return {
    optimal: 'optimalDays',
    under: 'understaffedDays',
    over: 'overstaffedDays',
  }[k]
}

function Th({ children }) {
  return (
    <th
      scope="col"
      className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider text-[11px]"
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="px-3 py-2 text-slate-700">{children}</td>
}
