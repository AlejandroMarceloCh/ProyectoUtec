import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal accesible reutilizable.
 * - role="dialog" + aria-modal
 * - Cierra con Escape
 * - Bloquea scroll del body mientras está abierto
 * - Focus trap básico (tab cycle dentro del modal)
 * - Restaura foco al elemento que lo abrió al cerrar
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  labelledById,
  initialFocusRef,
  maxWidthClass = 'max-w-md',
}) {
  const contentRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = labelledById ?? 'modal-title'

  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const target = initialFocusRef?.current ?? contentRef.current?.querySelector(focusableSelector)
    target?.focus?.()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') trapFocus(e, contentRef.current)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen, onClose, initialFocusRef])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 id={titleId} className="font-bold text-slate-800 text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function trapFocus(e, container) {
  if (!container) return
  const focusables = Array.from(container.querySelectorAll(focusableSelector)).filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
