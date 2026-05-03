// In-app silent camera. Uses getUserMedia + canvas frame capture so the
// OS camera shutter sound never fires (Korean/Japanese iPhones lock the
// shutter sound when going through the system camera, but a web canvas
// capture stays silent everywhere).
import { useEffect, useRef, useState } from 'react'
import { useBackClose } from '../../hooks/useBackClose'

interface Props {
  onCapture: (blob: Blob) => void
  onCancel: () => void
  onFallback?: () => void  // Open file picker if camera fails (desktop / no permission)
}

export function CameraCaptureModal({ onCapture, onCancel, onFallback }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [flashing, setFlashing] = useState(false)
  // 안드로이드/iOS 시스템 뒤로가기 제스처 = 카메라 닫기
  useBackClose(true, onCancel)

  useEffect(() => {
    let cancelled = false
    let local: MediaStream | null = null
    if (!navigator.mediaDevices?.getUserMedia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('이 브라우저는 카메라 접근을 지원하지 않아')
      return
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    }).then((s) => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return }
      local = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        setReady(true)
      }
    }).catch((e) => {
      if (cancelled) return
      const msg = (e as Error).message || '카메라 열기 실패'
      setError('카메라 권한이 필요해 — ' + msg)
    })
    return () => {
      cancelled = true
      if (local) local.getTracks().forEach(t => t.stop())
    }
  }, [facing])

  function capture() {
    const v = videoRef.current
    if (!v || !ready) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Front camera: mirror the captured frame to match the preview the user saw.
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0)
    setFlashing(true)
    setTimeout(() => setFlashing(false), 180)
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          flex: 1, width: '100%', objectFit: 'cover',
          // Mirror preview when using selfie cam — feels natural like a mirror.
          transform: facing === 'user' ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Capture flash */}
      {flashing && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.6, pointerEvents: 'none' }} />
      )}

      {/* Top bar — close */}
      <button
        onClick={onCancel}
        style={{
          position: 'absolute', top: 'env(safe-area-inset-top, 16px)', left: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none',
          cursor: 'pointer', fontSize: 18, fontWeight: 700, fontFamily: 'inherit',
          backdropFilter: 'blur(8px)',
        }}
      >✕</button>

      {/* Silent indicator (top center) */}
      <div style={{
        position: 'absolute', top: 'env(safe-area-inset-top, 16px)', left: '50%', transform: 'translateX(-50%)',
        padding: '6px 14px', borderRadius: 99,
        background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, fontWeight: 700,
        backdropFilter: 'blur(8px)', display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>🔇 무음 모드</div>

      {/* Error overlay with fallback option */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff',
          textAlign: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.9 }}>{error}</div>
          {onFallback && (
            <button
              onClick={onFallback}
              style={{
                padding: '10px 20px', borderRadius: 99, border: '1px solid #fff',
                background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >🖼 갤러리에서 선택</button>
          )}
        </div>
      )}

      {/* Bottom bar — capture + facing toggle */}
      {!error && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
          paddingTop: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)',
        }}>
          {onFallback ? (
            <button
              onClick={onFallback}
              title="갤러리에서 선택"
              style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.15)',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18,
                backdropFilter: 'blur(6px)', fontFamily: 'inherit',
              }}
            >🖼</button>
          ) : <div style={{ width: 44 }} />}

          <button
            onClick={capture}
            disabled={!ready}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#fff', border: 'none',
              boxShadow: '0 0 0 4px rgba(255,255,255,.18), 0 4px 16px rgba(0,0,0,.25)',
              cursor: ready ? 'pointer' : 'default', padding: 0,
              opacity: ready ? 1 : 0.5,
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .12s',
            }}
            onPointerDown={(e) => { if (ready) e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            aria-label="촬영"
          >
            <style>{`
              @keyframes pomo-heartbeat {
                0%, 100% { transform: scale(1) }
                14%      { transform: scale(1.12) }
                28%      { transform: scale(1) }
                42%      { transform: scale(1.08) }
                70%      { transform: scale(1) }
              }
            `}</style>
            <svg
              width="40" height="40" viewBox="0 0 24 24"
              fill="#FF7AA2" stroke="#E8557A" strokeWidth="1.2"
              strokeLinejoin="round"
              style={{ animation: ready ? 'pomo-heartbeat 1.6s ease-in-out infinite' : 'none', display: 'block' }}
              aria-hidden="true"
            >
              <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
            </svg>
          </button>

          <button
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            title="카메라 전환"
            style={{
              width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.15)',
              color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(6px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="카메라 전환"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15.5-6.5L21 8" />
              <path d="M21 4v4h-4" />
              <path d="M21 12a9 9 0 0 1-15.5 6.5L3 16" />
              <path d="M3 20v-4h4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
