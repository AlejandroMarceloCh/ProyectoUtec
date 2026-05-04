import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from './api'

interface RecentItem {
  session_id: string
  full_name: string
  email: string
  faculty_code: string | null
  points: number
  hora_entrada: string
  esta_activa: boolean
}

interface CheckinResult {
  full_name: string
  faculty_name: string | null
  points: number
  ocupacion_actual: number
  capacidad: number
  alerta_aforo: boolean
}

interface Props { onLogout: () => void }

export default function Scanner({ onLogout }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [error, setError] = useState('')
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [ocupacion, setOcupacion] = useState(0)
  const [capacidad, setCapacidad] = useState(0)

  const loadRecent = useCallback(async () => {
    try {
      const data = await api.recent(8)
      setRecent(data.items)
      setOcupacion(data.ocupacion_actual)
      setCapacidad(data.capacidad)
    } catch {}
  }, [])

  useEffect(() => {
    loadRecent()
    const interval = setInterval(loadRecent, 10_000)
    return () => clearInterval(interval)
  }, [loadRecent])

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (text) => {
        if (processingRef.current) return
        processingRef.current = true
        setScanning(true)
        setError('')
        setResult(null)
        try {
          const data = await api.checkin(text)
          setResult({
            full_name: data.usuario.full_name,
            faculty_name: data.usuario.faculty_name,
            points: data.usuario.points,
            ocupacion_actual: data.ocupacion_actual,
            capacidad: data.capacidad,
            alerta_aforo: data.alerta_aforo,
          })
          loadRecent()
          setTimeout(() => {
            setResult(null)
            processingRef.current = false
          }, 4000)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Error al procesar QR')
          setTimeout(() => {
            setError('')
            processingRef.current = false
          }, 3000)
        } finally {
          setScanning(false)
        }
      },
      () => {}
    ).catch(() => setError('No se pudo acceder a la cámara'))

    return () => {
      qr.stop().then(() => qr.clear()).catch(() => {
        try { qr.clear() } catch {}
      })
    }
  }, [loadRecent])

  const pct = capacidad > 0 ? Math.round((ocupacion / capacidad) * 100) : 0
  const barColor = pct >= 80 ? '#FF6464' : pct >= 60 ? '#FFB454' : '#22D3EE'

  return (
    <div className="flex min-h-screen bg-ds-bg-base">

      {/* Sidebar */}
      <aside className="w-[300px] flex flex-col bg-ds-bg-surface border-r border-ds-line p-5 gap-3 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-ds-display text-sm tracking-[4px] text-ds-brand-cyan">UTEC GYM</span>
          <button
            onClick={onLogout}
            className="font-ds-text text-xs text-ds-fg-mute border border-ds-line px-2.5 py-1 rounded-md hover:border-ds-fg-dim transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Occupancy */}
        <div className="bg-ds-bg-raised rounded-ds-lg p-4">
          <p className="font-ds-text text-[11px] text-ds-fg-mute mb-1">Ocupación actual</p>
          <p className="font-ds-display text-[32px] text-ds-fg-hi leading-none">
            {ocupacion}{' '}
            <span className="font-ds-text text-lg text-ds-fg-mute">/ {capacidad}</span>
          </p>
          <div className="h-1.5 bg-ds-bg-base rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <p className="font-ds-mono text-xs mt-1.5" style={{ color: barColor }}>{pct}% de aforo</p>
        </div>

        {/* Recent */}
        <p className="font-ds-text text-[11px] text-ds-fg-mute mt-1">Últimos ingresos</p>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {recent.length === 0 && (
            <p className="font-ds-text text-sm text-ds-fg-dim text-center mt-5">Sin registros aún</p>
          )}
          {recent.map(r => (
            <div
              key={r.session_id}
              className="flex items-center gap-2.5 bg-ds-bg-raised rounded-lg px-3 py-2.5"
              style={{ opacity: r.esta_activa ? 1 : 0.5 }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: r.esta_activa ? '#22D3EE' : '#6B7280' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-ds-text-sb text-[13px] text-ds-fg-hi truncate">{r.full_name}</p>
                <p className="font-ds-text text-[11px] text-ds-fg-mute">
                  {r.faculty_code ?? '—'} ·{' '}
                  {new Date(r.hora_entrada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="font-ds-mono text-[11px] text-ds-brand-cyan whitespace-nowrap">{r.points} pts</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main — camera */}
      <main className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className="relative" style={{ width: 340, height: 340 }}>
          <div
            id="qr-reader"
            className="rounded-ds-xl overflow-hidden bg-ds-bg-raised"
            style={{ width: 340, height: 340 }}
          />
          {(result || error || scanning) && (
            <div
              className="absolute inset-0 rounded-ds-xl flex flex-col items-center justify-center text-center p-6"
              style={{
                background: result
                  ? 'rgba(34,211,238,0.92)'
                  : error
                  ? 'rgba(255,100,100,0.92)'
                  : 'rgba(10,11,13,0.75)',
                color: error ? '#fff' : '#0A0B0D',
              }}
            >
              {scanning && !result && !error && (
                <p className="font-ds-display text-xl">Procesando...</p>
              )}
              {result && (
                <>
                  <p className="text-[56px] font-bold leading-none mb-2">✓</p>
                  <p className="font-ds-display text-[20px]">{result.full_name}</p>
                  {result.faculty_name && (
                    <p className="font-ds-text text-sm mt-1 opacity-75">{result.faculty_name}</p>
                  )}
                  <p className="font-ds-text text-sm mt-1 opacity-70">{result.points} puntos</p>
                  {result.alerta_aforo && (
                    <p className="font-ds-text-sb text-sm mt-3" style={{ color: '#7a0000' }}>
                      ⚠ Aforo al {Math.round(result.ocupacion_actual / result.capacidad * 100)}%
                    </p>
                  )}
                </>
              )}
              {error && (
                <>
                  <p className="text-[56px] font-bold leading-none mb-2">✗</p>
                  <p className="font-ds-display text-lg">{error}</p>
                </>
              )}
            </div>
          )}
        </div>
        <p className="font-ds-text text-sm text-ds-fg-dim">Apunta el scanner al QR del alumno</p>
      </main>
    </div>
  )
}
