/** Colores distintos por nombre (estilo horario a mano). */
export const EMPLOYEE_COLORS = [
  '#2563EB', '#EA580C', '#16A34A', '#DC2626', '#9333EA',
  '#0891B2', '#CA8A04', '#DB2777', '#4F46E5', '#0D9488',
  '#B45309', '#7C3AED', '#BE185D', '#059669', '#C026D3',
  '#1D4ED8', '#D97706', '#047857', '#B91C1C', '#7E22CE',
  '#0369A1', '#A16207', '#BE123C',
]

/** Orden en impresión (mismo bloque que el horario físico). */
export const SCHEDULE_GROUP_ORDER = ['kitchen', 'support', 'additional']

export const SCHEDULE_GROUP_LABELS = {
  kitchen: 'Cocina',
  support: 'Apoyo',
  additional: 'Adicionales',
}

/** Grupos antiguos guardados en localStorage → equivalencia actual. */
export function normalizeScheduleGroup(g) {
  if (g === 'merch') return 'support'
  return g ?? 'kitchen'
}

/**
 * employment type → días mínimos y máximos contratados por semana.
 * 'full-time': 5 días  (≈ 35–40 h)
 * 'part-time': 1–3 días (lo que manager decida dentro del rango)
 */
export const EMPLOYMENT_TYPES = {
  'full-time': { label: 'Full-time', minDays: 5, maxDays: 5, badgeClass: 'bg-indigo-100 text-indigo-700' },
  'part-time': { label: 'Part-time', minDays: 1, maxDays: 3, badgeClass: 'bg-slate-100 text-slate-600' },
}

function allDays() {
  return { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true }
}

function ft(fields) {
  return { employmentType: 'full-time', minDaysPerWeek: 5, ...fields }
}
function pt(minDays, fields) {
  return { employmentType: 'part-time', minDaysPerWeek: minDays, ...fields }
}

/**
 * Roster Le Chamois / Chammy.
 * Full-time (FT) = 5 días/semana · Part-time (PT) = 1–3 días/semana.
 *
 * Cocina core (FT): 10 personas — sustentan la operación diaria.
 * Apoyo (PT 2 días): apoyo según demanda, no garantizan 5 días.
 * Adicionales/cajeras (PT 2 días): turno de caja según necesidad.
 */
export const DEFAULT_EMPLOYEES = [
  // ── Cocina — full-time ────────────────────────────────────────────────────
  { id: 'ch_paislee',   name: 'Paislee',   scheduleGroup: 'kitchen', isManager: true,  isCashier: false, cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[0],  notes: 'Puede cubrir caja', ...ft({}) },
  { id: 'ch_heem',     name: 'Heem',      scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[1],  notes: '', ...ft({}) },
  { id: 'ch_leo',      name: 'Leo',       scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[2],  notes: '', ...ft({}) },
  { id: 'ch_mason',    name: 'Mason',     scheduleGroup: 'kitchen', isManager: true,  isCashier: false, cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[3],  notes: 'Puede cubrir caja', ...ft({}) },
  { id: 'ch_gloria',   name: 'Gloria',    scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[4],  notes: '', ...ft({}) },
  { id: 'ch_alejandro',name: 'Alejandro', scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[5],  notes: '', ...ft({}) },
  { id: 'ch_paz',      name: 'Paz',       scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[6],  notes: '', ...ft({}) },
  { id: 'ch_liam',     name: 'Liam',      scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[7],  notes: '', ...ft({}) },
  { id: 'ch_soren',    name: 'Soren',     scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[8],  notes: '', ...ft({}) },
  { id: 'ch_val',      name: 'Val',       scheduleGroup: 'kitchen', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[9],  notes: '', ...ft({}) },

  // ── Apoyo — part-time ─────────────────────────────────────────────────────
  { id: 'ch_kelli',    name: 'Kelli',     scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[10], notes: '', ...pt(2, {}) },
  { id: 'ch_priscilla',name: 'Priscilla', scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[11], notes: '', ...pt(2, {}) },
  { id: 'ch_sam',      name: 'Sam',       scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: true,  hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[12], notes: 'Dishwasher', ...pt(2, {}) },
  { id: 'ch_cesar',    name: 'Cesar',     scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[13], notes: '', ...pt(2, {}) },
  { id: 'ch_lilli',    name: 'Lilli',     scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[14], notes: '', ...pt(2, {}) },
  { id: 'ch_borto',    name: 'Bor To',    scheduleGroup: 'support', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[15], notes: '', ...pt(2, {}) },
  { id: 'ch_sally',    name: 'Sally',     scheduleGroup: 'support', isManager: true,  isCashier: false, cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[20], notes: 'Puede cubrir caja', ...pt(2, {}) },
  { id: 'ch_destiny',  name: 'Destiny',   scheduleGroup: 'support', isManager: true,  isCashier: false, cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[21], notes: 'Puede cubrir caja', ...pt(2, {}) },

  // ── Adicionales / cajeras — part-time ─────────────────────────────────────
  { id: 'ch_mikayla',  name: 'Mikayla',   scheduleGroup: 'additional', isManager: false, isCashier: true,  cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[16], notes: '', ...pt(2, {}) },
  { id: 'ch_jordan',   name: 'Jordan',    scheduleGroup: 'additional', isManager: false, isCashier: true,  cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[17], notes: '', ...pt(2, {}) },
  { id: 'ch_mia',      name: 'Mia',       scheduleGroup: 'additional', isManager: false, isCashier: true,  cashierKnowledge: true,  isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[18], notes: '', ...pt(2, {}) },
  { id: 'ch_natalie',  name: 'Natalie',   scheduleGroup: 'additional', isManager: false, isCashier: false, cashierKnowledge: false, isDishwasher: false, hasSecondJob: false, availability: allDays(), color: EMPLOYEE_COLORS[19], notes: '', ...pt(2, {}) },
]

export function sortEmployeesByScheduleGroup(employees) {
  const order = (g) => {
    const i = SCHEDULE_GROUP_ORDER.indexOf(normalizeScheduleGroup(g))
    return i === -1 ? 99 : i
  }
  return [...employees].sort((a, b) => order(a.scheduleGroup) - order(b.scheduleGroup))
}

export const DEFAULT_SETTINGS = {
  restaurantName: 'Chammy',
  location: {
    /** Palisades Tahoe — Olympic Valley, CA (pronóstico de nieve resort) */
    lat: 39.1972,
    lon: -120.2354,
    name: 'Palisades Tahoe · Olympic Valley, CA',
  },
  closingTimes: {
    slow: '18:00',
    medium: '18:00',
    busy: '19:00',
    'very-busy': '19:00',
  },
  shiftHours: {
    slow: 7,
    medium: 7,
    busy: 8,
    'very-busy': 8,
  },
}

export function getNextMonday(from = new Date()) {
  const d = new Date(from)
  const day = d.getDay()
  const diff = day === 0 ? 1 : (8 - day) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getCurrentWeekMonday(from = new Date()) {
  const d = new Date(from)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
