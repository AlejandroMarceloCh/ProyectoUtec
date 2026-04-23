# Chammy Scheduler

Sistema de optimización de horarios para el restaurante **Le Chamois** (Palisades Tahoe Ski Resort).
Genera automáticamente el calendario semanal del equipo considerando la demanda estimada por el
pronóstico de nieve, la disponibilidad de cada empleado y las reglas del negocio (supervisor
obligatorio por día, mínimo de cajeras según clima, tipo de contrato full-/part-time).

## Stack

- **React 18** + **Vite 6** (ESM, JSX nativo)
- **Tailwind CSS 3** (utility-first)
- **date-fns** para manejo de fechas
- **Open-Meteo API** (free tier, sin API key) para el pronóstico de nieve
- Persistencia local en `localStorage`

## Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Entorno de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview

# Lint y formato
npm run lint
npm run format

# Tests
npm test
```

### Configuración opcional

Copiar `.env.example` a `.env.local` y ajustar las coordenadas si quieres otro resort por defecto.
La ubicación también puede cambiarse en tiempo de ejecución desde el modal **⚙️ Configuración**.

## Arquitectura

```
src/
├── main.jsx                    # Entry point React.StrictMode
├── App.jsx                     # Shell principal y composición de paneles
├── components/
│   ├── ScheduleGrid.jsx        # Tabla editable de turnos
│   ├── EmployeeModal.jsx       # Alta / edición / baja de empleados
│   ├── OptimizationPanel.jsx   # Score, gráfico diario, warnings
│   ├── CapacityPanel.jsx       # Análisis de planilla vs. demanda semanal
│   ├── WeatherWidget.jsx       # Pronóstico nieve + nivel de afluencia
│   ├── PrintView.jsx           # Layout para impresión (A4)
│   └── SettingsModal.jsx       # Nombre del local + coordenadas
├── hooks/
│   └── useAppState.js          # Hook central con estado, handlers y persistencia
├── utils/
│   ├── optimizer.js            # Algoritmo greedy multipass + scoring
│   ├── weatherApi.js           # Cliente Open-Meteo + fallback mock
│   └── constants.js            # Constantes de negocio (umbrales de nieve, etc.)
├── data/
│   └── defaultData.js          # Roster y settings por defecto
└── index.css                   # Estilos Tailwind + estilos de impresión
```

### Algoritmo de optimización

`optimizeSchedule()` usa un *greedy multipass* con balance de carga:

1. **Pase 1** — garantiza ≥1 supervisor por día (prioriza días más ocupados).
2. **Pase 1b** — cubre el mínimo de cajeras por día (varía con clima y día de semana).
3. **Pase 2** — rellena hasta el número óptimo de staff por día.
4. **Pase 3** — completa los días mínimos contratados de cada empleado.

El `calculateScore()` evalúa la calidad (0-100) penalizando desviaciones del óptimo,
faltas de supervisor/cajera y empleados por debajo de su mínimo contratado.

### Reglas del negocio

- **Full-time**: 5 días fijos por semana.
- **Part-time**: 1–3 días según contrato.
- **Supervisor**: al menos 1 por día (Paislee, Mason, Sally, Destiny).
- **Cajera**: siempre ≥1 por día. Los sábados suben a 2 (salvo día tranquilo con poca nieve).
  Los viernes también suben a 2 si el día es ocupado o hay nieve fresca (≥ 8 cm).
- **Nieve**: afecta la demanda estimada del día (más nieve → más gente → más staff).

## Testing

Los tests viven junto al código en archivos `*.test.js` y corren con **Vitest**.

```bash
npm test               # Correr tests una vez
npm run test:watch     # Modo watch
npm run test:coverage  # Con cobertura
```
