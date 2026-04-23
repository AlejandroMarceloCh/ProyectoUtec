import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  DEFAULT_EMPLOYEES,
  DEFAULT_SETTINGS,
  getCurrentWeekMonday,
  sortEmployeesByScheduleGroup,
  normalizeScheduleGroup,
} from '../data/defaultData'
import {
  DAYS,
  analyzeCapacity,
  calculateScore,
  getDayLevel,
  optimizeSchedule,
} from '../utils/optimizer'
import { fetchWeekForecast } from '../utils/weatherApi'

const STORAGE_KEY = 'chammy_employees_v3'
const SETTINGS_STORAGE_KEY = 'chammy_settings_v1'

// ── Persistence helpers ──────────────────────────────────────────────────────

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const s = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      location: { ...DEFAULT_SETTINGS.location, ...(s.location ?? {}) },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettingsToStorage(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.warn('No se pudo persistir settings:', err.message)
  }
}

const KNOWN_CASHIER_KNOWLEDGE_IDS = new Set([
  // Managers que saben caja por seniority
  'ch_paislee',
  'ch_mason',
  'ch_sally',
  'ch_destiny',
])

function migrateEmployee(e) {
  let x = { ...e, scheduleGroup: normalizeScheduleGroup(e.scheduleGroup) }
  if (x.id === 'ch_sally' || x.id === 'ch_destiny') {
    x.isManager = true
    if (x.notes === 'Merch') x.notes = ''
  }
  if (x.isCashier !== true && x.isCashier !== false) {
    x.isCashier = ['ch_mikayla', 'ch_jordan', 'ch_mia'].includes(x.id)
  } else {
    x.isCashier = !!x.isCashier
  }

  // Back-fill cashierKnowledge (introducido después): todo cajero lo tiene,
  // más los managers conocidos que saben operar la caja.
  if (typeof x.cashierKnowledge !== 'boolean') {
    x.cashierKnowledge = x.isCashier || KNOWN_CASHIER_KNOWLEDGE_IDS.has(x.id)
  }
  // Invariante: un cajero siempre debe tener cashierKnowledge.
  if (x.isCashier) x.cashierKnowledge = true

  if (!x.employmentType) {
    x.employmentType = x.minDaysPerWeek >= 5 ? 'full-time' : 'part-time'
  }
  if (x.employmentType === 'full-time') x.minDaysPerWeek = 5
  if (x.employmentType === 'part-time') {
    x.minDaysPerWeek = Math.min(3, Math.max(1, x.minDaysPerWeek ?? 2))
  }
  return x
}

function loadEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES
    if (!Array.isArray(list)) return DEFAULT_EMPLOYEES.map(migrateEmployee)
    return list.map(migrateEmployee)
  } catch {
    return DEFAULT_EMPLOYEES.map(migrateEmployee)
  }
}

function saveEmployees(employees) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  } catch (err) {
    console.warn('No se pudo persistir empleados:', err.message)
  }
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAppState() {
  const [employees, setEmployees] = useState(loadEmployees)
  const [settings, setSettings] = useState(loadSettings)
  const [weekMonday, setWeekMonday] = useState(getCurrentWeekMonday)
  const [weatherData, setWeatherData] = useState(null)
  const [weatherError, setWeatherError] = useState(null)
  const [weatherIsMock, setWeatherIsMock] = useState(false)
  const [isFetchingWeather, setIsFetchingWeather] = useState(false)

  const [dayLevels, setDayLevels] = useState(() => {
    const levels = {}
    DAYS.forEach(d => (levels[d] = getDayLevel(d, 0)))
    return levels
  })

  const [schedule, setSchedule] = useState(null)
  const [optimizedSchedule, setOptimizedSchedule] = useState(null)
  const [scoreData, setScoreData] = useState(null)
  const [isOptimized, setIsOptimized] = useState(false)
  const [isOptimizing, startOptimizing] = useTransition()

  const [employeeModal, setEmployeeModal] = useState(null) // null | 'new' | employee
  const [showSettings, setShowSettings] = useState(false)

  // ── Derived values ─────────────────────────────────────────────────────────
  const employeesOrdered = useMemo(
    () => sortEmployeesByScheduleGroup(employees),
    [employees]
  )

  const snowByDay = useMemo(() => {
    const o = {}
    DAYS.forEach(d => {
      o[d] = weatherData?.[d]?.snowMm ?? 0
    })
    return o
  }, [weatherData])

  const capacityData = useMemo(
    () => analyzeCapacity(employees, dayLevels),
    [employees, dayLevels]
  )

  // ── Fetch weather when week or location changes ────────────────────────────
  useEffect(() => {
    let cancelled = false
    setIsFetchingWeather(true)
    setWeatherError(null)

    fetchWeekForecast(settings.location.lat, settings.location.lon, weekMonday)
      .then(({ data, isMock, error }) => {
        if (cancelled) return
        setWeatherData(data)
        const levels = {}
        DAYS.forEach(d => {
          levels[d] = data[d]?.busynessLevel ?? getDayLevel(d, 0)
        })
        setDayLevels(levels)
        setWeatherIsMock(isMock)
        setWeatherError(error ?? null)
      })
      .finally(() => {
        if (!cancelled) setIsFetchingWeather(false)
      })

    return () => {
      cancelled = true
    }
  }, [weekMonday, settings.location])

  // ── Re-calculate score when schedule/context changes ───────────────────────
  useEffect(() => {
    if (schedule) {
      setScoreData(calculateScore(schedule, employees, dayLevels, snowByDay))
    }
  }, [schedule, employees, dayLevels, snowByDay])

  // ── Persist state ──────────────────────────────────────────────────────────
  useEffect(() => {
    saveEmployees(employees)
  }, [employees])

  useEffect(() => {
    saveSettingsToStorage(settings)
  }, [settings])

  // ── Actions ────────────────────────────────────────────────────────────────
  const resetSchedule = useCallback(() => {
    setSchedule(null)
    setOptimizedSchedule(null)
    setScoreData(null)
    setIsOptimized(false)
  }, [])

  const handleOptimize = useCallback(() => {
    startOptimizing(() => {
      const result = optimizeSchedule(employees, dayLevels, snowByDay)
      setSchedule(result.schedule)
      setOptimizedSchedule(result.schedule)
      setScoreData(result.score)
      setIsOptimized(true)
    })
  }, [employees, dayLevels, snowByDay])

  const handleToggle = useCallback((empId, day) => {
    setSchedule(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [day]: !prev[empId][day] },
    }))
    setIsOptimized(false)
  }, [])

  /**
   * Mueve un turno de `fromDay` a `toDay` para un empleado.
   * Respeta disponibilidad: si el empleado no está disponible en toDay, no hace nada.
   * Si toDay ya está activo, no duplica (solo vacía fromDay).
   */
  const handleMoveShift = useCallback(
    (empId, fromDay, toDay) => {
      if (fromDay === toDay) return
      const emp = employees.find(e => e.id === empId)
      if (!emp?.availability?.[toDay]) return
      setSchedule(prev => {
        const empSched = prev[empId] ?? {}
        if (!empSched[fromDay]) return prev
        return {
          ...prev,
          [empId]: {
            ...empSched,
            [fromDay]: false,
            [toDay]: true,
          },
        }
      })
      setIsOptimized(false)
    },
    [employees]
  )

  /**
   * Intercambia turno entre dos empleados en el mismo día (swap).
   * Útil cuando el usuario arrastra el turno de X al lugar de Y.
   */
  const handleSwapAssignment = useCallback(
    (fromEmpId, toEmpId, day) => {
      if (fromEmpId === toEmpId) return
      const from = employees.find(e => e.id === fromEmpId)
      const to = employees.find(e => e.id === toEmpId)
      if (!from || !to) return
      if (!to.availability?.[day]) return
      setSchedule(prev => {
        const fromSched = prev[fromEmpId] ?? {}
        const toSched = prev[toEmpId] ?? {}
        return {
          ...prev,
          [fromEmpId]: { ...fromSched, [day]: false },
          [toEmpId]: { ...toSched, [day]: true },
        }
      })
      setIsOptimized(false)
    },
    [employees]
  )

  const handleSaveEmployee = useCallback(
    emp => {
      setEmployees(prev => {
        const exists = prev.find(e => e.id === emp.id)
        return exists ? prev.map(e => (e.id === emp.id ? emp : e)) : [...prev, emp]
      })
      setEmployeeModal(null)
      resetSchedule()
    },
    [resetSchedule]
  )

  const handleDeleteEmployee = useCallback(
    empId => {
      const emp = employees.find(e => e.id === empId)
      const label = emp?.name ?? 'esta persona'
      if (!window.confirm(`¿Eliminar a ${label} del equipo? Esta acción no se puede deshacer.`))
        return
      setEmployees(prev => prev.filter(e => e.id !== empId))
      setEmployeeModal(null)
      resetSchedule()
    },
    [employees, resetSchedule]
  )

  const changeWeek = useCallback(
    direction => {
      setWeekMonday(prev => addDays(prev, direction * 7))
      resetSchedule()
    },
    [resetSchedule]
  )

  const handleSaveSettings = useCallback(s => {
    setSettings(s)
    setShowSettings(false)
  }, [])

  return {
    // state
    employees,
    employeesOrdered,
    settings,
    weekMonday,
    weatherData,
    weatherIsMock,
    weatherError,
    isFetchingWeather,
    dayLevels,
    snowByDay,
    capacityData,
    schedule,
    optimizedSchedule,
    scoreData,
    isOptimized,
    isOptimizing,
    employeeModal,
    showSettings,
    // actions
    setEmployeeModal,
    setShowSettings,
    handleOptimize,
    handleToggle,
    handleMoveShift,
    handleSwapAssignment,
    handleSaveEmployee,
    handleDeleteEmployee,
    handleSaveSettings,
    changeWeek,
  }
}

// Expose id set for tests / debugging if needed
export const __STORAGE_KEYS = { STORAGE_KEY, SETTINGS_STORAGE_KEY }
