/**
 * Constantes de negocio compartidas (umbrales climáticos, límites de validación, etc.).
 * Centralizadas aquí para evitar "magic numbers" dispersos en el código.
 */

// ── Nieve (mm/día) → impacto en la demanda del resort ─────────────────────────
export const SNOW_MM_HEAVY_PACK = 200 // > 20 cm → resort "packed" (boost +2)
export const SNOW_MM_POWDER = 80 // > 8 cm → powder day (boost +1)
export const SNOW_MM_DRY = 5 // < 5 mm → día seco / poco tráfico (boost -1)

// ── Reglas de cajeras (mínimos por día) ───────────────────────────────────────
export const CASHIER_SATURDAY_LOW_SNOW_CM = 40 // sáb. se queda en 1 si hay menos de esto

// ── Horas de turno por nivel de demanda ───────────────────────────────────────
export const SHIFT_HOURS_BY_LEVEL = {
  slow: 7,
  medium: 7,
  busy: 8,
  'very-busy': 8,
}

// ── Scoring ───────────────────────────────────────────────────────────────────
export const SCORE_MAX_PENALTY = 72 // techo de deducciones antes de normalizar a 0

export const PENALTY = {
  OVERSTAFFED_PER_PERSON: 1,
  UNDERSTAFFED_PER_PERSON: 2,
  MISSING_MANAGER_PER_DAY: 5,
  MISSING_CASHIER_PER_PERSON: 4,
  EMPLOYEE_BELOW_MIN_DAYS: 1,
}

// ── Capacidad ─────────────────────────────────────────────────────────────────
export const CAPACITY_RATIO_SEVERELY_OVER = 1.35
export const CAPACITY_RATIO_OVER = 1.1
export const CAPACITY_RATIO_UNDER = 0.9

// ── Límites de validación en formularios ──────────────────────────────────────
export const LIMITS = {
  NAME_MAX_LENGTH: 60,
  NOTES_MAX_LENGTH: 200,
  LAT_MIN: -90,
  LAT_MAX: 90,
  LON_MIN: -180,
  LON_MAX: 180,
  RESTAURANT_NAME_MAX: 60,
  LOCATION_NAME_MAX: 80,
}

// ── UI ────────────────────────────────────────────────────────────────────────
export const OPTIMIZATION_MIN_LOADING_MS = 120 // delay mínimo para que el spinner sea visible
