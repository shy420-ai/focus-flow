import { useState, useEffect } from 'react'

export function MiniToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function handler(e: Event) {
      clearTimeout(timer)
      setMsg((e as CustomEvent<string>).detail)
      setVisible(true)
      timer = setTimeout(() => setVisible(false), 2200)
    }
    window.addEventListener('ff-mini-toast', handler)
    return () => {
      window.removeEventListener('ff-mini-toast', handler)
      clearTimeout(timer)
    }
  }, [])

  if (!msg) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      opacity: visible ? 1 : 0,
      transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
      background: '#fff',
      border: '2px solid var(--pink)',
      borderRadius: 12,
      padding: '8px 18px',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--pd)',
      zIndex: 9999,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 16px rgba(0,0,0,.12)',
      fontFamily: 'inherit',
    }}>
      {msg}
    </div>
  )
}
