// Maps backend muscle group keys to the canonical keys used by MuscleMap SVG paths.
// Backend may send synonyms or abbreviated names depending on the exercise DB.
const BACKEND_TO_CANONICAL: Record<string, string> = {
  // Pecho
  pecho: "pecho",
  pectoral: "pecho",
  // Hombros
  hombros: "hombros_anterior",
  hombros_anterior: "hombros_anterior",
  deltoides_anterior: "hombros_anterior",
  hombros_lateral: "hombros_lateral",
  deltoides_lateral: "hombros_lateral",
  hombros_posterior: "hombros_posterior",
  deltoides_posterior: "hombros_posterior",
  // Espalda
  espalda: "espalda_alta",
  dorsal: "espalda_alta",
  espalda_alta: "espalda_alta",
  trapecio: "trapecio",
  espalda_baja: "espalda_baja",
  lumbar: "espalda_baja",
  // Brazos
  biceps: "biceps",
  triceps: "triceps",
  triceps_largo: "triceps",
  triceps_corto: "triceps",
  antebrazo: "antebrazo",
  // Core
  abdomen: "abdomen",
  core: "abdomen",
  oblicuos: "oblicuos",
  // Pierna
  cuadriceps: "cuadriceps",
  quads: "cuadriceps",
  isquios: "isquios",
  isquiotibiales: "isquios",
  femorales: "isquios",
  gluteos: "gluteos",
  glúteos: "gluteos",
  aductores: "aductores",
  gemelos: "gemelos",
  pantorrillas: "gemelos",
};

export function adaptMuscleData(
  backendData: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(backendData)) {
    const canonical = BACKEND_TO_CANONICAL[key.toLowerCase()];
    if (!canonical) {
      if (__DEV__) console.warn(`[MuscleMap] key sin mapeo: "${key}"`);
      continue;
    }
    out[canonical] = Math.max(out[canonical] ?? 0, value);
  }
  return out;
}
