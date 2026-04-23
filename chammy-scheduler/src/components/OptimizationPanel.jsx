import { useMemo, useState } from 'react'
import { DAYS, DAY_SHORT } from '../utils/optimizer'
import { generateRecommendations } from '../utils/recommendations'

const PRIORITY_STYLES = {
  high: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    label: 'Prioridad alta',
    labelCls: 'text-red-700 bg-red-100',
  },
  medium: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    label: 'Media',
    labelCls: 'text-amber-800 bg-amber-100',
  },
  low: {
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    label: 'Baja',
    labelCls: 'text-slate-700 bg-slate-100',
  },
}

const CATEGORY_ICON = {
  staffing: '👥',
  roles: '🎯',
  roster: '📋',
  quality: '✨',
}

export default function OptimizationPanel({
  scoreData,
  hasSchedule,
  isOptimized,
  onOptimize,
  isLoading,
  schedule,
  employees,
  dayLevels,
  snowByDay,
}) {
  const recommendations = useMemo(
    () =>
      hasSchedule && scoreData && schedule
        ? generateRecommendations(schedule, employees, dayLevels, snowByDay, scoreData)
        : [],
    [hasSchedule, scoreData, schedule, employees, dayLevels, snowByDay]
  )

  const [showAllRecs, setShowAllRecs] = useState(false)
  const visibleRecs = showAllRecs ? recommendations : recommendations.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 overflow-hidden">
      {/* ── Hero: score + acción principal ──────────────────────────── */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-indigo-50 via-white to-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {hasSchedule && scoreData ? (
            <BigScoreRing score={scoreData.score} />
          ) : (
            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-5xl" aria-hidden="true">
                ⚡
              </span>
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Score de Optimización
            </h2>
            {hasSchedule && scoreData ? (
              <>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight">
                  <ScoreLabel score={scoreData.score} />
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  {scoreData.totalHours}h asignadas
                  {scoreData.hoursSaved > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">
                      (ahorras {scoreData.hoursSaved}h vs. sin límite)
                    </span>
                  )}
                </p>
                {isOptimized === false && (
                  <p className="text-xs text-amber-700 mt-1 font-medium inline-flex items-center gap-1">
                    ⚠️ Modificado manualmente — score actualizado en vivo
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Presiona <strong>Optimizar</strong> y el modelo generará el horario ideal de la
                semana. También puedes editarlo a mano o arrastrar turnos entre días.
              </p>
            )}

            <button
              type="button"
              onClick={onOptimize}
              disabled={isLoading}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Optimizando…
                </>
              ) : (
                <>⚡ {hasSchedule ? 'Re-optimizar' : 'Optimizar semana'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Recomendaciones ─────────────────────────────────────────── */}
      {hasSchedule && scoreData && (
        <div className="px-5 sm:px-7 pt-5 pb-5 border-t border-slate-100">
          {recommendations.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
              <span className="text-xl">✅</span>
              <div>
                <strong>El horario está óptimo.</strong> No hay recomendaciones de mejora.
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                💡 Cómo llegar al 100% ({recommendations.length} recomendaciones)
              </h3>
              <ul className="space-y-2">
                {visibleRecs.map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </ul>
              {recommendations.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllRecs(s => !s)}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {showAllRecs
                    ? 'Mostrar sólo las 3 principales ↑'
                    : `Ver las otras ${recommendations.length - 3} ↓`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Gráfico por día ─────────────────────────────────────────── */}
      {hasSchedule && scoreData && (
        <div className="px-5 sm:px-7 pt-5 pb-6 border-t border-slate-100">
          <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
            Staff por día vs. óptimo
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => {
              const ds = scoreData.dayScores?.[day]
              if (!ds) return null
              const maxBar = 10
              const actualPct = Math.min(100, (ds.actual / maxBar) * 100)
              const optPct = Math.min(100, (ds.optimal / maxBar) * 100)
              const over = ds.actual > ds.optimal
              const under = ds.actual < ds.optimal

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className="relative w-8 h-24 bg-slate-100 rounded-md overflow-hidden flex items-end">
                    <div
                      className="absolute w-full border-t-2 border-dashed border-indigo-400 z-10"
                      style={{ bottom: `${optPct}%` }}
                    />
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ${
                        over ? 'bg-violet-400' : under ? 'bg-orange-400' : 'bg-emerald-400'
                      }`}
                      style={{ height: `${actualPct}%` }}
                      title={`${ds.actual} personas (óptimo: ${ds.optimal})`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">{ds.actual}</span>
                  <span className="text-[10px] text-slate-400">{DAY_SHORT[day]}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed border-indigo-400 inline-block" />
              Óptimo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
              Exacto
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />
              Bajo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-violet-400 inline-block" />
              Exceso
            </span>
          </div>
        </div>
      )}

      {/* ── Explicación ─────────────────────────────────────────────── */}
      <details className="px-5 sm:px-7 pb-5 text-xs text-slate-500 border-t border-slate-100 pt-4">
        <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-800 select-none">
          ¿Cómo se calcula el óptimo?
        </summary>
        <ul className="mt-2 list-disc pl-4 space-y-1.5 leading-relaxed">
          <li>
            <strong>Clima:</strong> el pronóstico de nieve sube o baja el nivel de ocupación de
            cada día.
          </li>
          <li>
            <strong>Objetivo:</strong> acercarse al número <em>óptimo</em> de personas por día sin
            pasarse del máximo razonable.
          </li>
          <li>
            <strong>Reglas duras:</strong> ≥1 supervisor/día y ≥1 cajera/día (fines de semana
            pueden pedir 2). Empleados con &ldquo;Sabe operar la caja&rdquo; cuentan como respaldo.
          </li>
          <li>
            <strong>Equidad:</strong> se reparten turnos respetando disponibilidad y mínimo
            contratado.
          </li>
        </ul>
      </details>
    </div>
  )
}

function BigScoreRing({ score }) {
  const radius = 70
  const stroke = 12
  const circ = 2 * Math.PI * radius
  const fill = (score / 100) * circ
  const color =
    score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : score >= 45 ? '#f97316' : '#ef4444'

  return (
    <div className="relative flex-shrink-0">
      <svg width="176" height="176" viewBox="0 0 176 176" aria-hidden="true">
        <circle cx="88" cy="88" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 88 88)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
        <text
          x="88"
          y="82"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="44"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>
        <text
          x="88"
          y="115"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#94a3b8"
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
      </svg>
    </div>
  )
}

function ScoreLabel({ score }) {
  if (score >= 90) return <span className="text-emerald-600">Excelente ✨</span>
  if (score >= 75) return <span className="text-amber-600">Bueno</span>
  if (score >= 55) return <span className="text-orange-600">Mejorable</span>
  return <span className="text-red-600">Necesita revisión</span>
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function RecommendationCard({ rec }) {
  const style = PRIORITY_STYLES[rec.priority]
  return (
    <li
      className={`border ${style.border} ${style.bg} rounded-xl px-4 py-3 flex items-start gap-3`}
    >
      <span className="text-xl mt-0.5" aria-hidden="true">
        {CATEGORY_ICON[rec.category]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="text-sm font-semibold text-slate-800 leading-tight">{rec.title}</h4>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${style.labelCls}`}
          >
            {style.label}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-snug">{rec.detail}</p>
        {rec.impact && (
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            💡 Impacto estimado: {rec.impact}
          </p>
        )}
      </div>
    </li>
  )
}
