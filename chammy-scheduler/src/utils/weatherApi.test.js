import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWeekForecast, weatherIcon, snowLabel, formatWeekRange } from './weatherApi'
import { DAYS } from './optimizer'

describe('weatherIcon', () => {
  it('devuelve snow-heavy con nieve > 25', () => {
    expect(weatherIcon('snow', 30)).toBe('🌨️')
  })
  it('devuelve sol en día despejado sin nieve', () => {
    expect(weatherIcon('clear', 0)).toBe('☀️')
  })
  it('devuelve niebla cuando condition=fog y sin nieve', () => {
    expect(weatherIcon('fog', 0)).toBe('🌫️')
  })
})

describe('snowLabel', () => {
  it('muestra "Sin nieve" cuando snowCm=0', () => {
    expect(snowLabel(0)).toBe('Sin nieve')
  })
  it('incluye emoji ✨ en cantidades medias', () => {
    expect(snowLabel(10)).toContain('✨')
  })
  it('incluye emoji 🔥 en cantidades altas', () => {
    expect(snowLabel(25)).toContain('🔥')
  })
})

describe('formatWeekRange', () => {
  it('formatea un rango de lunes a domingo', () => {
    const monday = new Date('2026-04-20T00:00:00') // lunes
    const range = formatWeekRange(monday)
    expect(range).toContain('–')
    expect(range).toMatch(/abril/i)
  })
})

describe('fetchWeekForecast', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve mock cuando la red falla, marcando isMock=true y error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    )
    const result = await fetchWeekForecast(39, -120, new Date('2026-04-20T00:00:00'))
    expect(result.isMock).toBe(true)
    expect(result.error).toBeTruthy()
    DAYS.forEach(d => expect(result.data).toHaveProperty(d))
    vi.unstubAllGlobals()
  })

  it('parsea respuesta exitosa y mapea snow cm/mm', async () => {
    const monday = new Date('2026-04-20T00:00:00')
    const fakeResponse = {
      daily: {
        time: Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday)
          d.setDate(d.getDate() + i)
          return d.toISOString().split('T')[0]
        }),
        snowfall_sum: [0, 1, 2, 3, 4, 5, 6],
        precipitation_sum: [0, 0, 0, 0, 0, 0, 0],
        weathercode: [0, 1, 71, 73, 75, 77, 85],
        temperature_2m_max: [0, 1, 2, 3, 4, 5, 6],
        temperature_2m_min: [-5, -4, -3, -2, -1, 0, 1],
      },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fakeResponse) }))
    )
    const result = await fetchWeekForecast(39, -120, monday)
    expect(result.isMock).toBe(false)
    expect(result.error).toBeNull()
    expect(result.data.Mon.snowMm).toBe(result.data.Mon.snowCm * 10)
    vi.unstubAllGlobals()
  })
})
