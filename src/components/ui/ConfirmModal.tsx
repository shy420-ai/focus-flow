import { useState, useEffect } from 'react'
import { confirmResolve } from '../../lib/showConfirm'

export function ConfirmModal() {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    function handler(e: Event) {
      setMsg((e as CustomEvent<string>).detail)
    }
    window.addEventListener('ff-confirm', handler)
    return () => window.removeEventListener('ff-confirm', handler)
  }, [])

  if (!msg) return null

  function respond(result: boolean) {
    setMsg(null)
    confirmResolve(result)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => respond(false)}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 280, textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 14, color: '#333', marginBottom: 20, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{msg}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => respond(false)}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--pl)', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#aaa' }}
          >취소</button>
          <button
            onClick={() => respond(true)}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >확인</button>
        </div>
      </div>
    </div>
  )
}
