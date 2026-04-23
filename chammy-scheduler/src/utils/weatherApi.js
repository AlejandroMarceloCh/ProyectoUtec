/**
 * Weather integration via Open-Meteo API.
 * Free tier — no API key required.
 * Returns 7-day daily forecast including snowfall, which determines
 * the busyness prediction for each day at Chammy ski resort.
 */

import { DAYS, getDayLevel } from './optimizer'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

/**
 * Fetch a full week forecast (Mon–Sun) starting from `weekMonday`.
 * @param {number} lat
 * @param {number} lon
 * @param {Date} weekMonday
 * @returns {Promise<Object>} Keyed by day ('Mon', 'Tue', …)
 */
export async function fetchWeekForecast(lat, lon, weekMonday) {
  const startDate = fmtDate(weekMonday)
  const endDate = fmtDate(addDays(weekMonday, 6))

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'snowfall_sum',
      'precipitation_sum',
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  })

  try {
    const res = await fetch(`${OPEN_METEO}?${params}`)
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
    const data = await res.json()
    return { data: parseResponse(data), isMock: false, error: null }
  } catch (err) {
    console.warn('Weather fetch failed, usando datos de ejemplo:', err.message)
    return {
      data: getMockForecast(weekMonday),
      isMock: true,
      error: err.message ?? 'No se pudo obtener el pronóstico',
    }
  }
}

function parseResponse(data) {
  const { daily } = data
  const result = {}

  daily.time.forEach((dateStr, i) => {
    const date = new Date(dateStr + 'T12:00:00')
    const dayKey = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]
    // open-meteo snowfall is in cm
    const snowCm = Math.max(0, Math.round(daily.snowfall_sum[i] ?? 0))
    const snowMm = snowCm * 10
    const code = daily.weathercode[i] ?? 0

    result[dayKey] = {
      date: dateStr,
      snowCm,
      snowMm,
      weatherCode: code,
      condition: conditionFromCode(code),
      tempMax: Math.round(daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(daily.temperature_2m_min[i] ?? 0),
      precipitation: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
      busynessLevel: getDayLevel(dayKey, snowMm),
    }
  })

  return result
}

function conditionFromCode(code) {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code <= 49) return 'fog'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'heavy_rain'
  if (code <= 86) return 'heavy_snow'
  return 'thunderstorm'
}

export function weatherIcon(condition, snowCm) {
  if (snowCm >= 25) return '🌨️'
  if (snowCm >= 15) return '❄️'
  if (snowCm >= 5) return '🌨️'
  if (snowCm >= 1) return '🌧️'
  if (condition === 'clear') return '☀️'
  if (condition === 'cloudy') return '☁️'
  if (condition === 'fog') return '🌫️'
  return '🌤️'
}

export function snowLabel(snowCm) {
  if (snowCm === 0) return 'Sin nieve'
  if (snowCm < 5) return `${snowCm}cm`
  if (snowCm < 15) return `${snowCm}cm ✨`
  return `${snowCm}cm 🔥`
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function getMockForecast(weekMonday) {
  const mockSnowCm = { Mon: 2, Tue: 5, Wed: 8, Thu: 18, Fri: 25, Sat: 30, Sun: 0 }
  const result = {}

  DAYS.forEach((day, i) => {
    const snowCm = mockSnowCm[day]
    const snowMm = snowCm * 10
    const condition = snowCm > 10 ? 'heavy_snow' : snowCm > 0 ? 'snow' : 'clear'

    result[day] = {
      date: fmtDate(addDays(weekMonday, i)),
      snowCm,
      snowMm,
      weatherCode: snowCm > 0 ? 73 : 0,
      condition,
      tempMax: -2 + i,
      tempMin: -9 + i,
      precipitation: snowCm * 1.2,
      busynessLevel: getDayLevel(day, snowMm),
      isMock: true,
    }
  })

  return result
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Format a Date as "7 de Abril, 2026" */
export function formatWeekRange(monday) {
  const sunday = addDays(monday, 6)
  const opts = { day: 'numeric', month: 'long', year: 'numeric' }
  const start = monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  const end = sunday.toLocaleDateString('es-ES', opts)
  return `${start} – ${end}`
}
