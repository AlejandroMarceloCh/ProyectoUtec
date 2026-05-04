import { useEffect, useCallback, useState } from 'react'
import { QRScannerCore } from './components/QRScannerCore'
import { HIDInput } from './components/HIDInput'
import { ScannerOverlay } from './components/ScannerOverlay'

const API = 'https://utec-gym.duckdns.org/api/v1'
const TOKEN_KEY = 'scanner_token'
const REFRESH_KEY = 'scanner_refresh'

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

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail ?? 'Credenciales inválidas')
  }
  const data = await res.json()
  return { access: data.access_token as string, refresh: data.refresh_token as string }
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccess(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (!refresh) return null
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token)
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token)
      return data.access_token ?? null
    } catch {
      return null
    } finally {
      setTimeout(() => { refreshPromise = null }, 0)
    }
  })()
  return refreshPromise
}

async function apiFetch(path: string, init: RequestInit, token: string): Promise<Response> {
  const headers = { ...(init.headers ?? {}), 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  let res = await fetch(`${API}${path}`, { ...init, headers })
  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshAccess()
    if (newToken) {
      res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, Authorization: `Bearer ${newToken}` } })
    }
  }
  return res
}

async function checkin(code: string, authToken: string): Promise<CheckinResult> {
  const res = await apiFetch('/sessions/checkin', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }, authToken)
  if (res.status === 401 || res.status === 403) throw new Error('Sesión expirada')
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail ?? 'Error al registrar ingreso')
  }
  const data = await res.json()
  return {
    full_name: data.usuario.full_name,
    faculty_name: data.usuario.faculty_name,
    points: data.usuario.points,
    photo_url: data.usuario.photo_url ?? null,
    ocupacion_actual: data.ocupacion_actual,
    capacidad: data.capacidad,
    alerta_aforo: data.alerta_aforo,
  }
}

// ── LoginScreen ───────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { access, refresh } = await apiLogin(form.email, form.password)
      localStorage.setItem(TOKEN_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
      onLogin(access)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ds-bg-base">
      <form
        onSubmit={submit}
        className="w-[360px] flex flex-col gap-4 bg-ds-bg-surface border border-ds-line rounded-ds-xl p-10"
      >
        <div className="text-center mb-2">
          <h1 className="font-ds-display text-[20px] text-ds-fg-hi tracking-[6px]">UTEC GYM</h1>
          <p className="font-ds-text text-sm text-ds-fg-mute mt-1">Scanner — Acceso del personal</p>
        </div>

        <input
          className="bg-ds-bg-raised border border-ds-line rounded-lg px-4 py-3 text-ds-fg-hi font-ds-text text-sm outline-none focus:border-ds-brand-cyan transition-colors"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />

        <div className="relative flex">
          <input
            className="flex-1 bg-ds-bg-raised border border-ds-line rounded-lg px-4 py-3 pr-11 text-ds-fg-hi font-ds-text text-sm outline-none focus:border-ds-brand-cyan transition-colors"
            type={show ? 'text' : 'password'}
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-fg-mute p-1 flex"
          >
            <EyeIcon open={show} />
          </button>
        </div>

        {error && <p className="font-ds-text text-sm text-ds-danger text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-ds-brand-cyan text-ds-fg-on-accent font-ds-text-sb text-sm py-3 rounded-lg cursor-pointer disabled:opacity-70 transition-opacity"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

// ── ScannerScreen ─────────────────────────────────────────────────────────────

function ScannerScreen({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [ocupacion, setOcupacion] = useState(0)
  const [capacidad, setCapacidad] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [netError, setNetError] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const processingRef = { current: false }
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null }

  const log = (msg: string) =>
    setLogs(l => [`${new Date().toLocaleTimeString()}: ${msg}`, ...l].slice(0, 8))

  const loadOcupacion = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions/occupancy`)
      if (res.ok) {
        const d = await res.json()
        setOcupacion(d.ocupacion_actual)
        setCapacidad(d.capacidad)
        setNetError(false)
      } else {
        setNetError(true)
      }
    } catch {
      setNetError(true)
    }
  }, [])

  useEffect(() => {
    loadOcupacion()
    const interval = setInterval(loadOcupacion, 10_000)
    return () => clearInterval(interval)
  }, [loadOcupacion])

  const handleDetected = useCallback(async (code: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setState('processing')
    setResult(null)
    setErrorMsg('')
    setCameraOpen(false)

    log(`QR: ${code.slice(0, 8)}...`)
    try { (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(60) } catch {}

    try {
      const data = await checkin(code, token)
      setResult(data)
      setOcupacion(data.ocupacion_actual)
      setCapacidad(data.capacidad)
      setState('success')
      log(`✓ ${data.full_name}`)
    } catch (err) {
      if (err instanceof Error && /expirada/i.test(err.message)) {
        log('Sesión expirada, redirigiendo...')
        setTimeout(onLogout, 800)
        return
      }
      const msg = err instanceof Error ? err.message : 'Error'
      setErrorMsg(msg)
      setState('error')
      log(`✗ ${msg}`)
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState('idle')
      setResult(null)
      setErrorMsg('')
      processingRef.current = false
    }, 2500)
  }, [token, onLogout])

  return (
    <div className="relative w-full h-screen bg-ds-bg-base overflow-hidden">
      {/* Cámara: solo se monta cuando el staff la activa manualmente */}
      {cameraOpen && <QRScannerCore onDetected={handleDetected} />}

      {/* HIDInput siempre activo — captura pistola USB-HID */}
      <HIDInput onCode={handleDetected} disabled={state !== 'idle'} />

      <ScannerOverlay
        state={state}
        result={result}
        errorMsg={errorMsg}
        ocupacion={ocupacion}
        capacidad={capacidad}
        netError={netError}
        logs={logs}
        cameraOpen={cameraOpen}
        onToggleCamera={() => setCameraOpen(v => !v)}
        onLogout={onLogout}
      />
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setToken(null)
  }

  return token
    ? <ScannerScreen token={token} onLogout={handleLogout} />
    : <LoginScreen onLogin={setToken} />
}
