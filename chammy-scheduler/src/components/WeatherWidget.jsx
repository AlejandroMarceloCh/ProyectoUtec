import { DAYS, DAY_SHORT, STAFFING_REQS, getRequiredCashiers } from '../utils/optimizer'
import { weatherIcon, snowLabel } from '../utils/weatherApi'

const LEVEL_STYLES = {
  slow:       { card: 'bg-sky-50 border-sky-200',        badge: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-400' },
  medium:     { card: 'bg-amber-50 border-amber-200',    badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  busy:       { card: 'bg-orange-50 border-orange-200',  badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  'very-busy':{ card: 'bg-red-50 border-red-200',        badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
}

const LEVEL_LABELS = {
  slow:       'Tranquilo',
  medium:     'Moderado',
  busy:       'Ocupado',
  'very-busy':'Muy Ocup.',
}

export default function WeatherWidget({ weatherData, dayLevels, isMock, locationLabel }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">🌨️</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Pronóstico Nieve & Afluencia Estimada
            </h2>
            {locationLabel && (
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                📍 {locationLabel}
              </p>
            )}
          </div>
        </div>
        {isMock && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-medium">
            Datos de ejemplo
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => {
          const wx = weatherData?.[day]
          const level = dayLevels[day] ?? 'medium'
          const styles = LEVEL_STYLES[level]
          const req = STAFFING_REQS[level]
          const snow = wx?.snowCm ?? 0

          return (
            <div
              key={day}
              className={`rounded-xl border p-2.5 text-center flex flex-col items-center gap-1 ${styles.card}`}
            >
              <span className="text-xs font-bold text-slate-600">{DAY_SHORT[day]}</span>
              <span className="text-2xl leading-none">{weatherIcon(wx?.condition, snow)}</span>
              <span className="text-xs text-slate-500 font-medium">{snowLabel(snow)}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles.badge}`}
              >
                {LEVEL_LABELS[level]}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                <span className="text-[11px] font-bold text-slate-700">
                  {req.optimal} personas
                </span>
              </div>
              <span
                className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded"
                title="Mínimo de cajeras ese día (siempre ≥1)"
              >
                Cajeras mín.: {getRequiredCashiers(day, level, wx?.snowMm ?? 0)}
              </span>
              {wx && (
                <span className="text-[10px] text-slate-400">
                  {wx.tempMax}° / {wx.tempMin}°C
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
