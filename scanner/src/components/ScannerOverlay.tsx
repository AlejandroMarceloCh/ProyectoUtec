type ScanState = 'idle' | 'processing' | 'success' | 'error'

interface CheckinResult {
  full_name: string
  faculty_name: string | null
  points: number
  photo_url: string | null
  ocupacion_actual: number
  capacidad: number
  alerta_aforo: boolean
}

interface Props {
  state: ScanState
  result: CheckinResult | null
  errorMsg: string
  ocupacion: number
  capacidad: number
  netError: boolean
  logs: string[]
  cameraOpen: boolean
  onToggleCamera: () => void
  onLogout: () => void
}

function OccupancyBadge({ ocupacion, capacidad, netError }: { ocupacion: number; capacidad: number; netError: boolean }) {
  const pct = capacidad > 0 ? Math.round((ocupacion / capacidad) * 100) : 0
  const color = pct >= 80 ? '#FF6464' : pct >= 60 ? '#FFB454' : '#22D3EE'
  if (netError) return <span className="text-ds-danger text-sm font-ds-mono">● sin conexión</span>
  if (capacidad === 0) return <span className="text-ds-fg-dim text-sm font-ds-mono">cargando...</span>
  return (
    <span className="text-sm font-ds-mono" style={{ color }}>
      {ocupacion}/{capacidad} · {pct}%
    </span>
  )
}

const STEPS = [
  { n: '1', label: 'Alumno abre la app UTEC GYM en su celular' },
  { n: '2', label: 'Va a la pestaña Inicio y muestra el código QR' },
  { n: '3', label: 'Apunta la pistola al QR y aprieta el gatillo' },
  { n: '4', label: 'El sistema registra el ingreso automáticamente' },
]

function IdleView({ cameraOpen, onToggleCamera }: { cameraOpen: boolean; onToggleCamera: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-8">

      {/* Indicador de estado */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.08)', border: '1.5px solid rgba(34,211,238,0.3)' }}
        >
          {/* pistola icon */}
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h13l1 5H3z" />
            <path d="M16 13l2 5H9l-1-5" />
            <circle cx="8" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
            <path d="M19 8V5h2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-ds-display text-ds-fg-hi text-lg tracking-wide">Listo para escanear</p>
          <p className="font-ds-text text-ds-fg-dim text-sm mt-1">Pistola USB activa · esperando QR</p>
        </div>
      </div>

      {/* Pasos */}
      <div
        className="w-full max-w-sm rounded-ds-xl border border-ds-line divide-y divide-ds-line"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {STEPS.map(s => (
          <div key={s.n} className="flex items-center gap-4 px-5 py-4">
            <span
              className="font-ds-display text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,211,238,0.12)', color: '#22D3EE' }}
            >
              {s.n}
            </span>
            <span className="font-ds-text text-sm text-ds-fg-base">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Botón cámara de emergencia */}
      <button
        onClick={onToggleCamera}
        className="flex items-center gap-2 font-ds-text text-xs text-ds-fg-dim border border-ds-line px-4 py-2 rounded-lg hover:border-ds-fg-mute transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {cameraOpen ? 'Ocultar cámara' : 'Activar cámara (emergencia)'}
      </button>

    </div>
  )
}

export function ScannerOverlay({ state, result, errorMsg, ocupacion, capacidad, netError, logs, cameraOpen, onToggleCamera, onLogout }: Props) {
  const showStateOverlay = state !== 'idle'
  const overlayBg =
    state === 'success' ? 'rgba(34,211,238,0.95)' :
    state === 'error'   ? 'rgba(255,100,100,0.95)' :
    'rgba(10,11,13,0.75)'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b border-ds-line"
        style={{ background: 'rgba(10,11,13,0.92)', backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}
      >
        <span className="font-ds-display text-sm tracking-[4px] text-ds-brand-cyan">
          UTEC GYM · SCANNER
        </span>
        <div className="flex items-center gap-5">
          <OccupancyBadge ocupacion={ocupacion} capacidad={capacidad} netError={netError} />
          <button
            onClick={onLogout}
            className="font-ds-text text-xs text-ds-fg-mute border border-ds-line px-3 py-1 rounded-md hover:border-ds-fg-dim transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Vista idle — pasos + instrucciones */}
      {!showStateOverlay && (
        <div className="absolute inset-0 pt-16 pb-12" style={{ pointerEvents: 'auto' }}>
          {/* Si la cámara está abierta, el overlay de instrucciones se pone arriba derecha compacto */}
          {cameraOpen ? (
            <div
              className="absolute top-20 right-5 z-20 rounded-ds-xl border border-ds-line p-4 w-64"
              style={{ background: 'rgba(10,11,13,0.92)', backdropFilter: 'blur(8px)' }}
            >
              <p className="font-ds-text-sb text-xs text-ds-brand-cyan mb-3 tracking-widest uppercase">Pasos</p>
              {STEPS.map(s => (
                <div key={s.n} className="flex items-start gap-2 mb-2">
                  <span className="font-ds-display text-[10px] w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(34,211,238,0.12)', color: '#22D3EE' }}>
                    {s.n}
                  </span>
                  <span className="font-ds-text text-[11px] text-ds-fg-base leading-snug">{s.label}</span>
                </div>
              ))}
              <button
                onClick={onToggleCamera}
                className="mt-3 w-full font-ds-text text-[11px] text-ds-fg-dim border border-ds-line px-3 py-1.5 rounded-md hover:border-ds-fg-mute transition-colors"
              >
                Ocultar cámara
              </button>
            </div>
          ) : (
            <IdleView cameraOpen={cameraOpen} onToggleCamera={onToggleCamera} />
          )}
        </div>
      )}

      {/* State overlay — processing / success / error */}
      {showStateOverlay && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: overlayBg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: 32,
            color: state === 'error' ? '#fff' : '#0A0B0D',
            pointerEvents: 'none',
          }}
        >
          {state === 'processing' && (
            <p className="text-xl font-ds-display tracking-wide">Procesando...</p>
          )}

          {state === 'success' && result && (
            <>
              {result.photo_url ? (
                <img
                  src={result.photo_url}
                  alt={result.full_name}
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid #0A0B0D', marginBottom: 16 }}
                />
              ) : (
                <div
                  style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(10,11,13,0.15)', border: '4px solid #0A0B0D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 52, fontWeight: 800 }}
                >
                  {result.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{result.full_name}</p>
              {result.faculty_name && (
                <p style={{ fontSize: 15, marginTop: 6, opacity: 0.7 }}>{result.faculty_name}</p>
              )}
              <p style={{ fontSize: 13, marginTop: 4, opacity: 0.6 }}>{result.points} pts</p>
              {result.alerta_aforo && (
                <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 16px' }}>
                  <p style={{ color: '#7a0000', fontWeight: 700, fontSize: 13 }}>
                    ⚠ Aforo al {Math.round((result.ocupacion_actual / result.capacidad) * 100)}%
                  </p>
                </div>
              )}
            </>
          )}

          {state === 'error' && (
            <>
              <p style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>✗</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{errorMsg}</p>
            </>
          )}
        </div>
      )}

      {/* Log bar — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 py-2.5 border-t border-ds-line font-ds-mono text-[11px]"
        style={{ background: 'rgba(10,11,13,0.92)', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}
      >
        {logs.length === 0
          ? <span className="text-ds-fg-dim">esperando actividad...</span>
          : logs.map((l, i) => (
            <span key={i} style={{ color: i === 0 ? '#22D3EE' : '#6B7280', display: 'block' }}>{l}</span>
          ))
        }
      </div>
    </div>
  )
}
