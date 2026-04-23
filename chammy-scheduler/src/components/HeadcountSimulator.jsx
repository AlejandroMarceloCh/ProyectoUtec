import { useMemo, useState } from 'react'
import { simulateHeadcount } from '../utils/simulator'

const RANGE = { min: -4, max: 4 }

const STATUS_COLOR = {
  optimal: '#10b981',
  over: '#f59e0b',
  'severely-over': '#ef4444',
  under: '#3b82f6',
}

const STATUS_LABEL = {
  optimal: 'Óptimo',
  over: 'Sobrecontratado',
  'severely-over': 'Sobrecontratado',
  under: 'Corto',
}

export default function HeadcountSimulator({ employees, dayLevels, snowByDay }) {
  const [type, setType] = useState('full-time')

  const scenarios = useMemo(
    () => simulateHeadcount(employees, dayLevels, snowByDay, { ...RANGE, type }),
    [employees, dayLevels, snowByDay, type]
  )
  const current = scenarios.find(s => s.delta === 0)

  return (
    <details className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-2xl">
            🔮
          </span>
          <div>
            <h2 className="font-bold text-slate-800 text-base leading-tight">
              Simulador: ¿qué pasaría si…?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prueba cómo cambia el horario contratando o quitando empleados
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>

      <div className="mt-5">
        <fieldset className="mb-4">
          <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tipo de empleado a simular
          </legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Tipo de empleado simulado">
            <TypeOption
              active={type === 'full-time'}
              onClick={() => setType('full-time')}
              label="Full-time (5 días)"
            />
            <TypeOption
              active={type === 'part-time'}
              onClick={() => setType('part-time')}
              label="Part-time (2 días)"
            />
          </div>
        </fieldset>

        <SimulationChart scenarios={scenarios} currentDelta={0} />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">
              Resultados de la simulación por cada variación de planilla
            </caption>
            <thead className="bg-slate-50">
              <tr>
                <Th>Escenario</Th>
                <Th>Empleados</Th>
                <Th>Score</Th>
                <Th>Horas asignadas</Th>
                <Th>Ocupación</Th>
                <Th>Estado</Th>
                <Th>Alertas</Th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => {
                const isCurrent = s.delta === 0
                return (
                  <tr
                    key={s.delta}
                    className={
                      isCurrent
                        ? 'bg-indigo-50 font-semibold'
                        : 'hover:bg-slate-50 transition-colors'
                    }
                  >
                    <Td>
                      {isCurrent ? (
                        <span className="text-indigo-700">⬤ Hoy</span>
                      ) : s.delta > 0 ? (
                        <span className="text-emerald-600">+{s.delta}</span>
                      ) : (
                        <span className="text-red-600">{s.delta}</span>
                      )}
                    </Td>
                    <Td>{s.headcount}</Td>
                    <Td>
                      <ScorePill score={s.score} />
                    </Td>
                    <Td>{s.totalHours}h</Td>
                    <Td>{s.overRatio}%</Td>
                    <Td>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${STATUS_COLOR[s.status]}22`,
                          color: STATUS_COLOR[s.status],
                        }}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </Td>
                    <Td>
                      {s.warnings === 0 ? (
                        <span className="text-emerald-600">✓ 0</span>
                      ) : (
                        <span className="text-amber-600">⚠ {s.warnings}</span>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {current && (
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            <strong>Cómo leerlo:</strong> la fila resaltada es tu planilla actual ({current.headcount}
            &nbsp;empleados, score {current.score}/100). Las filas de arriba quitan personas, las
            de abajo las suman. El{' '}
            <span className="text-indigo-600 font-semibold">score</span> sube cuando la planilla
            se acerca al óptimo (no demasiado exceso ni demasiado déficit).
          </p>
        )}
      </div>
    </details>
  )
}

function TypeOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        active
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

function Th({ children }) {
  return (
    <th
      scope="col"
      className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="px-3 py-2 text-slate-700">{children}</td>
}

function ScorePill({ score }) {
  const color =
    score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : score >= 45 ? '#f97316' : '#ef4444'
  return (
    <span
      className="inline-block min-w-[42px] text-center font-bold rounded-md px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {score}
    </span>
  )
}

/**
 * Gráfico SVG con dos series: score (línea) y surplus de turnos (barras).
 * Marca en rojo la configuración actual (delta=0).
 */
function SimulationChart({ scenarios, currentDelta }) {
  const W = 640
  const H = 240
  const PAD = { top: 20, right: 50, bottom: 36, left: 42 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  if (scenarios.length === 0) return null

  const n = scenarios.length
  const xAt = i => PAD.left + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const scoreY = s => PAD.top + innerH - (s / 100) * innerH

  // Surplus axis: symmetric around 0
  const maxAbsSurplus = Math.max(
    1,
    ...scenarios.map(s => Math.abs(s.surplusShifts))
  )
  const surplusY = v => PAD.top + innerH / 2 - (v / maxAbsSurplus) * (innerH / 2)

  const scoreLine = scenarios
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${scoreY(s.score)}`)
    .join(' ')

  return (
    <div role="img" aria-label="Gráfico de simulación: score y excedente por escenario">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* grid horizontal: 0/25/50/75/100 score */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={scoreY(v)}
              y2={scoreY(v)}
              stroke="#e2e8f0"
              strokeDasharray={v === 0 || v === 100 ? '0' : '3 3'}
            />
            <text
              x={PAD.left - 6}
              y={scoreY(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Zero line for surplus */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH / 2}
          y2={PAD.top + innerH / 2}
          stroke="#cbd5e1"
        />

        {/* Surplus bars */}
        {scenarios.map((s, i) => {
          const y0 = PAD.top + innerH / 2
          const y1 = surplusY(s.surplusShifts)
          const h = Math.abs(y1 - y0)
          const y = Math.min(y0, y1)
          const fill = s.surplusShifts > 0 ? '#fbbf2466' : '#60a5fa66'
          return (
            <rect
              key={s.delta}
              x={xAt(i) - 14}
              y={y}
              width={28}
              height={h}
              fill={fill}
              rx={3}
            />
          )
        })}

        {/* Score line */}
        <path d={scoreLine} fill="none" stroke="#6366f1" strokeWidth="2.5" />

        {/* Score points */}
        {scenarios.map((s, i) => {
          const isCurrent = s.delta === currentDelta
          return (
            <g key={s.delta}>
              <circle
                cx={xAt(i)}
                cy={scoreY(s.score)}
                r={isCurrent ? 7 : 4}
                fill={isCurrent ? '#ef4444' : '#6366f1'}
                stroke="white"
                strokeWidth="2"
              />
              {isCurrent && (
                <text
                  x={xAt(i)}
                  y={scoreY(s.score) - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ef4444"
                >
                  hoy
                </text>
              )}
            </g>
          )
        })}

        {/* X labels: delta */}
        {scenarios.map((s, i) => (
          <text
            key={s.delta}
            x={xAt(i)}
            y={H - PAD.bottom + 14}
            textAnchor="middle"
            fontSize="11"
            fontWeight={s.delta === 0 ? 'bold' : 'normal'}
            fill={s.delta === 0 ? '#1e293b' : '#64748b'}
          >
            {s.delta > 0 ? `+${s.delta}` : s.delta}
          </text>
        ))}
        <text
          x={W / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#94a3b8"
        >
          Δ empleados respecto a hoy
        </text>

        {/* Y labels */}
        <text
          x={14}
          y={PAD.top + innerH / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#6366f1"
          transform={`rotate(-90 14 ${PAD.top + innerH / 2})`}
        >
          Score (0–100)
        </text>
      </svg>

      <div className="flex items-center justify-center gap-5 text-[11px] text-slate-500 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />
          Score
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-300 inline-block rounded-sm" />
          Exceso de turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-300 inline-block rounded-sm" />
          Déficit de turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
          Configuración actual
        </span>
      </div>
    </div>
  )
}
