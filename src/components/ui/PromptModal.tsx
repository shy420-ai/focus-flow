import { useEffect, useState, useRef } from 'react'
import { promptResolve, type PromptRequest } from '../../lib/showPrompt'
import { useBackClose } from '../../hooks/useBackClose'

export function PromptModal() {
  const [req, setReq] = useState<PromptRequest | null>(null)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<PromptRequest>).detail
      setReq(detail)
      setValue(detail.defaultValue || '')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    window.addEventListener('ff-prompt', handler)
    return () => window.removeEventListener('ff-prompt', handler)
  }, [])

  useBackClose(req !== null, () => {
    promptResolve(null)
    setReq(null)
  })

  if (!req) return null

  function done(result: string | null) {
    promptResolve(result)
    setReq(null)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) done(null) }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pd)', marginBottom: 12, lineHeight: 1.4 }}>
          {req.msg}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={req.placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) done(value)
            if (e.key === 'Escape') done(null)
          }}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => done(null)}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            취소
          </button>
          <button onClick={() => done(value)}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
