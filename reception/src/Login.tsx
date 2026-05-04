import { useState, FormEvent } from 'react'
import { Button, Input } from '@utec-gym/ui-web'
import { api } from './api'

interface Props { onLogin: (token: string) => void }

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(email, password)
      onLogin(data.access_token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ds-bg-base">
      <form
        onSubmit={submit}
        className="w-[380px] flex flex-col gap-ds-4 bg-ds-bg-surface border border-ds-line rounded-ds-xl p-10"
      >
        {/* Logo barbell — idéntico al móvil, viewBox 0 0 100 100 */}
        <div className="flex justify-center mb-ds-2">
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            <rect x="5" y="18" width="14" height="46" rx="4" fill="#22D3EE"/>
            <rect x="81" y="18" width="14" height="46" rx="4" fill="#22D3EE"/>
            <rect x="19" y="43" width="16" height="8" rx="4" fill="#22D3EE"/>
            <rect x="65" y="43" width="16" height="8" rx="4" fill="#22D3EE"/>
            <path
              d="M 35 47 L 35 62 Q 35 78 50 78 Q 65 78 65 62 L 65 47"
              stroke="#22D3EE" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
          </svg>
        </div>

        <div className="text-center -mt-ds-2">
          <h1 className="font-ds-display text-ds-h4 text-ds-fg-hi tracking-widest">UTEC GYM</h1>
          <p className="font-ds-text text-ds-small text-ds-fg-mute mt-ds-1">
            Recepción — Acceso del personal
          </p>
        </div>

        <Input
          type="email"
          label="Correo"
          placeholder="recepcion@utec.edu.pe"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error ? (
          <p className="font-ds-text text-ds-small text-ds-danger text-center">{error}</p>
        ) : null}

        <Button type="submit" variant="brand" size="lg" fullWidth loading={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
