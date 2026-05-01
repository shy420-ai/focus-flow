// Long-press to drag a fixed-position button. Tap-through still triggers
// the original click handler, drag mode persists position to localStorage
// per storage key.
import { useEffect, useRef, useState } from 'react'

interface Pos { x: number; y: number }

interface Result {
  bind: React.RefCallback<HTMLElement>
  fabStyle: React.CSSProperties
  isDragging: boolean
}

const HOLD_MS = 500
const MOVE_THRESHOLD = 6  // px before tap becomes a maybe-drag

export function useDraggableFab(storageKey: string, defaultPos: Pos): Result {
  const [pos, setPos] = useState<Pos>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Pos
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed
      }
    } catch { /* ignore */ }
    return defaultPos
  })
  const [isDragging, setIsDragging] = useState(false)
  const elRef = useRef<HTMLElement | null>(null)

  // Hold timer + move tracking
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)

  useEffect(() => {
    return () => {
      if (holdRef.current) clearTimeout(holdRef.current)
    }
  }, [])

  function clearHold() {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null }
  }

  function clamp(x: number, y: number): Pos {
    const margin = 8
    const w = window.innerWidth
    const h = window.innerHeight
    const elSize = 56
    return {
      x: Math.max(margin, Math.min(w - elSize - margin, x)),
      y: Math.max(margin, Math.min(h - elSize - margin, y)),
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (!elRef.current) return
    startRef.current = { x: e.clientX, y: e.clientY, startX: pos.x, startY: pos.y }
    holdRef.current = setTimeout(() => {
      setIsDragging(true)
      try { (navigator as Navigator & { vibrate?: (n: number) => void }).vibrate?.(20) } catch { /* ignore */ }
    }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent) {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!isDragging) {
      // Cancel the long-press if user moves before timer fires (intent: scroll).
      if (Math.hypot(dx, dy) > MOVE_THRESHOLD) clearHold()
      return
    }
    e.preventDefault()
    const next = clamp(startRef.current.startX + dx, startRef.current.startY + dy)
    setPos(next)
  }

  function onPointerUp() {
    clearHold()
    if (isDragging) {
      try { localStorage.setItem(storageKey, JSON.stringify(pos)) } catch { /* ignore */ }
      // Brief delay before clearing so the click handler sees isDragging
      // and short-circuits in the consumer if desired.
      setTimeout(() => setIsDragging(false), 50)
    }
    startRef.current = null
  }

  function bind(node: HTMLElement | null) {
    if (elRef.current) {
      elRef.current.removeEventListener('pointerdown', onPointerDown)
      elRef.current.removeEventListener('pointermove', onPointerMove)
      elRef.current.removeEventListener('pointerup', onPointerUp)
      elRef.current.removeEventListener('pointercancel', onPointerUp)
    }
    elRef.current = node
    if (node) {
      node.addEventListener('pointerdown', onPointerDown)
      node.addEventListener('pointermove', onPointerMove)
      node.addEventListener('pointerup', onPointerUp)
      node.addEventListener('pointercancel', onPointerUp)
    }
  }

  // Re-clamp on resize so the button doesn't end up off-screen.
  useEffect(() => {
    function onResize() {
      setPos((prev) => clamp(prev.x, prev.y))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const fabStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    right: 'auto',
    bottom: 'auto',
    transform: isDragging ? 'scale(1.15)' : undefined,
    transition: 'transform .15s',
    touchAction: 'none',
    zIndex: 200,
    boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,.3)' : undefined,
  }

  return { bind, fabStyle, isDragging }
}
