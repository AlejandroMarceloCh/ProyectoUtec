import { useAppState } from './hooks/useAppState'
import { formatWeekRange } from './utils/weatherApi'
import WeatherWidget from './components/WeatherWidget'
import ScheduleGrid from './components/ScheduleGrid'
import OptimizationPanel from './components/OptimizationPanel'
import EmployeeModal from './components/EmployeeModal'
import PrintView from './components/PrintView'
import CapacityPanel from './components/CapacityPanel'
import SettingsModal from './components/SettingsModal'
import EmployeeCardGrid from './components/EmployeeCardGrid'
import HeadcountSimulator from './components/HeadcountSimulator'
import HistoricalAudit from './components/HistoricalAudit'

export default function App() {
  const {
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
    schedule,
    optimizedSchedule,
    scoreData,
    isOptimized,
    isOptimizing,
    capacityData,
    employeeModal,
    showSettings,
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
  } = useAppState()

  const weekRange = formatWeekRange(weekMonday)
  const hasSchedule = !!schedule

  return (
    <>
      <div className="no-print min-h-screen bg-slate-50">
        <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-2xl">
                🏔️
              </span>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight leading-none">CHAMMY</h1>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  Sistema de Horarios · Ski Resort
                </p>
              </div>
            </div>

            <nav aria-label="Navegación de semana" className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeWeek(-1)}
                aria-label="Semana anterior"
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center text-sm transition-colors"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <div className="text-center min-w-[200px]" aria-live="polite">
                <p className="text-sm font-semibold">{weekRange}</p>
                {isFetchingWeather && (
                  <p className="text-[10px] text-slate-400 animate-pulse">Obteniendo clima…</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => changeWeek(1)}
                aria-label="Semana siguiente"
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center text-sm transition-colors"
              >
                <span aria-hidden="true">›</span>
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                aria-label="Abrir configuración"
                className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center transition-colors text-base"
                title="Configuración"
              >
                <span aria-hidden="true">⚙️</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!hasSchedule}
                aria-label="Imprimir horario"
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
              >
                <span aria-hidden="true">🖨️</span> Imprimir
              </button>
              <button
                type="button"
                onClick={() => setEmployeeModal('new')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                title="Agregar alguien nuevo al roster"
              >
                + Agregar empleado
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {weatherError && weatherIsMock && (
            <div
              role="alert"
              className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
            >
              ⚠️ No se pudo obtener el pronóstico real ({weatherError}). Mostrando datos de ejemplo.
            </div>
          )}

          <WeatherWidget
            weatherData={weatherData}
            dayLevels={dayLevels}
            isMock={weatherIsMock}
            locationLabel={settings.location.name}
          />

          <CapacityPanel capacityData={capacityData} />

          <HeadcountSimulator
            employees={employees}
            dayLevels={dayLevels}
            snowByDay={snowByDay}
          />

          <HistoricalAudit employees={employees} />

          <OptimizationPanel
            scoreData={scoreData}
            hasSchedule={hasSchedule}
            isOptimized={isOptimized}
            onOptimize={handleOptimize}
            isLoading={isOptimizing}
            schedule={schedule}
            employees={employees}
            dayLevels={dayLevels}
            snowByDay={snowByDay}
          />

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Horario — {employees.length} empleados
            </h2>
            <p className="text-xs text-slate-400 text-right max-w-lg">
              Celdas del calendario: activar o quitar turno.{' '}
              <span className="text-slate-500">
                Para <strong>agregar</strong>: botón verde arriba. Para{' '}
                <strong>editar o quitar</strong> a alguien: tarjetas del equipo abajo, o el nombre
                en la tabla cuando ya hay horario (abajo del formulario: «Eliminar del equipo»).
              </span>
            </p>
          </div>

          <ScheduleGrid
            employees={employeesOrdered}
            schedule={schedule}
            dayLevels={dayLevels}
            scoreData={scoreData}
            onToggle={handleToggle}
            onMoveShift={handleMoveShift}
            onSwapAssignment={handleSwapAssignment}
            optimizedSchedule={optimizedSchedule}
            onEditEmployee={emp => setEmployeeModal(emp)}
          />

          <section className="mt-4" aria-labelledby="team-section-heading">
            <h3
              id="team-section-heading"
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
            >
              Equipo · clic en una tarjeta para editar perfil o eliminar
            </h3>
            <EmployeeCardGrid
              employees={employeesOrdered}
              onEdit={emp => setEmployeeModal(emp)}
            />
          </section>
        </main>
      </div>

      <PrintView
        employees={employeesOrdered}
        schedule={schedule}
        dayLevels={dayLevels}
        weekMonday={weekMonday}
        scoreData={scoreData}
      />

      {employeeModal !== null && (
        <EmployeeModal
          employee={employeeModal === 'new' ? null : employeeModal}
          onSave={handleSaveEmployee}
          onDelete={handleDeleteEmployee}
          onClose={() => setEmployeeModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
