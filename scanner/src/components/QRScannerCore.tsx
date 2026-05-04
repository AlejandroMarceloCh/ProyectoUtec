import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const ELEMENT_ID = 'qr-scanner-core'

interface Props {
  onDetected: (code: string) => void
}

// Camera wrapper — mounts once, never destroyed by UI re-renders.
// position: absolute, inset: 0 — must live inside a `position: relative` container.
export function QRScannerCore({ onDetected }: Props) {
  // Ref-based callback so useEffect deps stay [] (mounts once) but always calls latest handler
  const onDetectedRef = useRef(onDetected)
  useEffect(() => { onDetectedRef.current = onDetected })

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false } as never)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: isIOS ? 10 : 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      } as never,
      (code: string) => onDetectedRef.current(code),
      undefined,
    ).then(() => {
      const video = document.querySelector(`#${ELEMENT_ID} video`) as HTMLVideoElement | null
      if (video) {
        video.setAttribute('playsinline', 'true')
        video.setAttribute('muted', 'true')
        video.setAttribute('autoplay', 'true')
        video.style.width = '100%'
        video.style.height = '100%'
        video.style.objectFit = 'cover'
      }
    }).catch(() => {
      // Error surfaced via onDetected not being called — parent handles camera error state
    })

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {
        try { scanner.clear() } catch {}
      })
    }
  }, []) // intentional empty deps — camera mounts once

  return (
    <div
      id={ELEMENT_ID}
      style={{ position: 'absolute', inset: 0, background: '#0A0B0D' }}
    />
  )
}
