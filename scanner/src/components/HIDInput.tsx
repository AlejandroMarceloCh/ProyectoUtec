import { useEffect, useRef } from 'react'

const NANOID_RE = /^[A-Za-z0-9_-]{21}$/

interface Props {
  onCode: (code: string) => void
  disabled?: boolean
}

/**
 * Input invisible que captura tipeo de pistolas USB-HID (Netum, Eyoyo, etc).
 * La pistola "tipea" el contenido del QR + Enter como si fuera un teclado.
 *
 * - autoFocus + onBlur re-focus → siempre listo para recibir el siguiente scan.
 * - Enter delimita el code; resto del buffer se descarta.
 * - Validación regex contra el formato NanoID (21 chars) antes de invocar onCode.
 *   Defiende contra basura tipeada por humanos o lecturas truncadas por glitch HID.
 */
export function HIDInput({ onCode, disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  return (
    <input
      ref={ref}
      autoFocus
      disabled={disabled}
      autoComplete="off"
      style={{
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
        width: 1,
        height: 1,
        top: 0,
        left: 0,
      }}
      onBlur={() => {
        // Re-focus en el siguiente tick — si otro input toma foco legítimamente,
        // este re-focus pierde la carrera y eso está OK.
        setTimeout(() => {
          if (!disabled && document.activeElement?.tagName !== 'INPUT') {
            ref.current?.focus()
          }
        }, 0)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          const v = (e.target as HTMLInputElement).value.trim()
          ;(e.target as HTMLInputElement).value = ''
          if (NANOID_RE.test(v)) onCode(v)
        }
      }}
    />
  )
}
