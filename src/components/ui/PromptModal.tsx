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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9300,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'ff-prompt-fade .15s ease-out',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) done(null) }}
    >
      <style>{`
        @keyframes ff-prompt-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ff-prompt-pop { from { transform: scale(.92) translateY(8px); opacity: 0 } to { transform: scale(1) translateY(0); opacity: 1 } }
        .ff-prompt-input:focus { border-color: var(--pink) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink) 20%, transparent) }
      `}</style>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        overflow: 'hidden',
        animation: 'ff-prompt-pop .2s ease-out',
      }}>
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 60%, #fff))', padding: '14px 20px', borderBottom: '1px solid var(--pl)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', lineHeight: 1.5 }}>
            {req.msg}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={req.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) done(value)
              if (e.key === 'Escape') done(null)
            }}
            className="ff-prompt-input"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #e8e8e8', borderRadius: 12,
              fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              marginBottom: 14, transition: 'border-color .15s, box-shadow .15s',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => done(null)}
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              취소
            </button>
            <button onClick={() => done(value)}
              style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px color-mix(in srgb, var(--pink) 40%, transparent)' }}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
