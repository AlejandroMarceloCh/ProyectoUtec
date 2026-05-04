# MIGRATION_AUDIT — UTEC Gym redesign

Fecha: 2026-05-03
Plan referencia: `~/.claude/plans/ok-si-ya-esta-keen-eclipse.md`

---

## 1. Estado actual del frontend (móvil)

**Sorpresa crítica:** el código no usa NativeWind/Tailwind a pesar de que el setup está hecho.

- `tailwind.config.js`, `babel.config.js` con `nativewind/preset` y `nativewind/babel`: **OK, instalado**.
- Uso real en pantallas: **inline styles** (`StyleSheet.create`, `style={{...}}`).
  - 80 matches de `StyleSheet | style={{ | style={styles` en `frontend/app`.
  - 2 matches de `className` en todo `frontend/components` (ambos passthrough en `Card.tsx`).
- Tokens viejos referenciados vía `className`: **0**.
- Template literals dinámicos (`bg-${...}`): **0**.
- Imports de `@/components/ui/*` desde pantallas: **0** vía esa ruta exacta (la config no tiene alias `@/` configurado o las pantallas importan con path relativo).

**Implicancia:**
- Fase 7 cleanup (eliminar tokens viejos del config) es trivial — nadie los usa vía className.
- Pero la migración de cada pantalla NO es solo "cambiar className"; es **migrar de inline styles → NativeWind className** + aplicar tokens `ds-*` al mismo tiempo.
- Decisión confirmada con Alejandro: las Fases 2-6 absorben este costo (cada "reemplazar pantalla" siempre implicó reescribir JSX completo).

## 2. Inventario de componentes existentes

`frontend/components/ui/` (DS viejo):
- `Button.tsx`, `Card.tsx`, `Input.tsx`, `EmptyState.tsx`, `FacultyPicker.tsx`, `GlowView.tsx`, `GridBackground.tsx`, `Logo.tsx`, `PulseRing.tsx`, `Skeleton.tsx`

`frontend/components/` (top-level):
- `BiometricGate.tsx`, `BodyHeatmap.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`, `SplashAnimated.tsx`, `StyledText.tsx`, `Themed.tsx`, helpers (`useColorScheme`, `useClientOnlyValue`)

**Plan de coexistencia:**
- `frontend/components/ds/` (carpeta nueva) — primitivos nuevos NativeWind con tokens `ds-*`.
- `frontend/components/ui/` queda intacto durante Fases 1-6.
- Fase 7: borrar `ui/` viejos cuyos archivos ya no se importan; mover `ds/*` a `ui/` (la carpeta, no el prefijo de clases).
- `Logo.tsx`: conservar archivo, solo aplicar paleta nueva (decisión confirmada).

## 3. Pantallas a migrar (Fases 2-6)

| Fase | Pantalla | Path |
|---|---|---|
| 2 | Login | `frontend/app/(auth)/login.tsx` |
| 2 | Register | `frontend/app/(auth)/register.tsx` |
| 3 | Mi QR (home) | `frontend/app/(tabs)/index.tsx` |
| 3 | En Vivo | `frontend/app/(tabs)/live.tsx` |
| 4 | Rutina | `frontend/app/(tabs)/routine.tsx` |
| 5 | Ranking | `frontend/app/(tabs)/ranking.tsx` |
| 5 | Perfil | `frontend/app/(tabs)/profile.tsx` |
| 5 | Historial | `frontend/app/(tabs)/history.tsx` |
| 5 | Detalle sesión (NUEVA) | `frontend/app/session/[id].tsx` |

Layout: `frontend/app/(tabs)/_layout.tsx`.

## 4. Fuentes en `frontend/assets/fonts/`

Existentes:
- `SpaceGrotesk-Bold.otf`, `SpaceGrotesk-Medium.otf`, `SpaceGrotesk-Regular.otf` ✅ (display ds-*)
- `Inter-Bold.ttf`, `Inter-Medium.ttf`, `Inter-Regular.ttf`, `Inter-SemiBold.ttf` (familia vieja)
- `SpaceMono-Regular.ttf` (no usado por DS nuevo)

Faltan (a bajar + subsetear a Latin básico):
- `InterTight-Regular.ttf`, `InterTight-Medium.ttf`, `InterTight-SemiBold.ttf`, `InterTight-Bold.ttf`
- `JetBrainsMono-Medium.ttf`

Pendiente de Alejandro: bajarlos manualmente desde Google Fonts y pasarlos por Transfonter (target 40-60 KB c/u) o `glyphhanger`.

## 5. Smoke backend — PENDIENTE

`curl https://utec-gym.duckdns.org/api/health` → exit 28 (timeout). EC2 de AWS Academy probablemente apagado (lab vence cada 4h).

Endpoints a validar cuando vuelva el backend:
- `GET /api/sessions/{id}` → ¿devuelve `resumen_muscular`, ejercicios, duración, puntos?
- `GET /api/users/{id}` → ¿historial de ingresos, foto, facultad, estado?
- `POST /api/auth/machine` → ¿existe? Si responde 404 → ticket backend bloqueante de Fase 6.

**No bloquea Fase 0**. Sí bloquea inicio de Fase 5 (detalle sesión) y Fase 6 (scanner kiosk).

## 6. Pre-requisitos resueltos (Workstream C)

- **Recepción tema**: ✅ Dark (decisión 2026-05-03).
- **Glow Android**: ✅ Simplificar (borde 1px brand-cyan + tint sutil). Sin dep nueva.
- **Faculty colors**: 13 códigos del DS (`SI BIO ELE QUI BA CDIA AND MEC ENE AMB CIV MEC2 IND`). Validación contra lista oficial UTEC pendiente — no bloquea Fase 0, sí bloquea Fase 5 (Ranking).
- **Logo**: ✅ Conservar `Logo.tsx`, solo paleta nueva.
- **Heatmap fisio**: ✅ No bloquea (silhouette PNG default; anatomy futuro).
- **Scope web**: ✅ Workspace compartido, Tailwind en ambos.

## 7. Trabajo de auditoría que ya NO hace falta

El plan iter 7 reservaba ½ día para reescribir template literals dinámicos como ternarios. **0 matches** → 0 trabajo. Tiempo liberado se reinvierte en migrar inline styles → NativeWind durante Fases 2-6 (que es la sorpresa real).
