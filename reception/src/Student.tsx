import { useEffect, useState } from 'react'
import { api } from './api'

interface Props {
  userId: string
  onClose: () => void
}

interface StudentDetail {
  full_name: string
  email: string
  faculty_name: string | null
  faculty_code: string | null
  points: number
  is_blocked: boolean
  total_sessions?: number
  recent_entries?: { hora_entrada: string; hora_salida: string | null; esta_activa: boolean }[]
}

export default function Student({ userId, onClose }: Props) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.req('GET', `/users/${userId}`)
      .then((data) => setStudent(data?.user ?? data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [userId])

  const initials = student?.full_name
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? '?'

  return (
    <div className="flex flex-col h-full bg-ds-bg-surface border-l border-ds-line w-[280px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ds-line">
        <span className="font-ds-text-sb text-sm text-ds-fg-hi">Detalle alumno</span>
        <button
          onClick={onClose}
          className="font-ds-text text-ds-fg-mute text-xl leading-none hover:text-ds-fg-base transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {[64, 14, 11, 120].map((h, i) => (
              <div key={i} style={{ height: h, backgroundColor: '#181A20', borderRadius: 8 }} />
            ))}
          </div>
        )}

        {error && (
          <p className="font-ds-text text-sm text-ds-fg-mute text-center mt-6">
            Disponible próximamente — detalle de alumno en desarrollo.
          </p>
        )}

        {student && (
          <>
            {/* Avatar */}
            <div className="flex flex-col items-center py-5 border-b border-ds-line-muted mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-ds-brand-cyan font-ds-display text-[24px] text-ds-brand-cyan"
                style={{ backgroundColor: 'rgba(34,211,238,0.10)' }}
              >
                {initials}
              </div>
              <p className="font-ds-text-sb text-[15px] text-ds-fg-hi text-center">{student.full_name}</p>
              <p className="font-ds-text text-[12px] text-ds-fg-mute mt-0.5 text-center">{student.email}</p>
              {student.is_blocked && (
                <div className="mt-2 px-3 py-1 rounded-full bg-ds-danger-bg">
                  <span className="font-ds-text-sb text-[11px] text-ds-danger">BLOQUEADO</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-ds-bg-raised rounded-lg p-3 text-center">
                <p className="font-ds-display text-[20px] text-ds-brand-cyan">{student.points}</p>
                <p className="font-ds-text text-[10px] text-ds-fg-mute mt-0.5">Puntos</p>
              </div>
              <div className="flex-1 bg-ds-bg-raised rounded-lg p-3 text-center">
                <p className="font-ds-display text-[20px] text-ds-fg-hi">{student.total_sessions ?? '—'}</p>
                <p className="font-ds-text text-[10px] text-ds-fg-mute mt-0.5">Sesiones</p>
              </div>
            </div>

            {/* Faculty */}
            <div className="bg-ds-bg-raised rounded-lg p-3 mb-4">
              <p className="font-ds-text text-[11px] text-ds-fg-mute mb-0.5">Facultad</p>
              <p className="font-ds-text-sb text-[13px] text-ds-fg-hi">{student.faculty_name ?? '—'}</p>
              {student.faculty_code && (
                <p className="font-ds-mono text-[11px] text-ds-fg-dim mt-0.5">{student.faculty_code}</p>
              )}
            </div>

            {/* Recent entries */}
            {student.recent_entries && student.recent_entries.length > 0 ? (
              <>
                <p className="font-ds-text text-[11px] text-ds-fg-mute mb-2">Ingresos recientes</p>
                <div className="flex flex-col gap-1.5">
                  {student.recent_entries.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 bg-ds-bg-raised rounded-lg px-3 py-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: e.esta_activa ? '#22D3EE' : '#6B7280' }}
                      />
                      <p className="font-ds-text text-[12px] text-ds-fg-base">
                        {new Date(e.hora_entrada).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(e.hora_entrada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="font-ds-text text-sm text-ds-fg-dim text-center mt-2">
                Disponible próximamente — historial en desarrollo.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
