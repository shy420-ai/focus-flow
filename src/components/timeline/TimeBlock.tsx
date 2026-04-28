import { useRef, useEffect } from 'react'
import type { Block } from '../../types/block'
import { fmtH, nowH, todayStr } from '../../lib/date'
import { useAppStore } from '../../store/AppStore'
import { BlockMenu } from './BlockMenu'
import { getCategories } from '../../lib/categories'

function catColor(name: string): string {
  return getCategories().find((c) => c.name === name)?.color || '#aaa'
}

interface TimeBlockProps {
  block: Block
  curDate: string
  startHour: number
  px: number
  isMenuOpen: boolean
  onMenuToggle: (id: string | null) => void
  onMemo: (id: string) => void
  onEdit: (id: string) => void
  index: number
}

export function TimeBlock({
  block,
  curDate,
  startHour,
  px,
  isMenuOpen,
  onMenuToggle,
  onMemo,
  onEdit,
}: TimeBlockProps) {
  const toggleDone = useAppStore((s) => s.toggleDone)
  const updateBlock = useAppStore((s) => s.updateBlock)

  const elRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    type: 'move' | 'resize'
    sy: number
    origStart: number
    origDur: number
  } | null>(null)
  const holdReady = useRef(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didDrag = useRef(false)

  const nh = nowH()
  const isBuf = block.isBuf || block.type === 'buffer'
  const isPast = curDate === todayStr() && block.startHour + block.durHour < nh

  const top = (block.startHour - startHour) * px + 2
  const height = Math.max(block.durHour * px - 5, 28)

  let className = 'block '
  if (isBuf) {
    className += 'c-buf'
  } else {
    className += 'c-' + block.color
  }
  if (block.done) className += ' done-block'
  else if (isPast) className += ' past'
  if (isMenuOpen) className += ' menu-open'

  // Non-passive touchmove — cancels hold if user scrolls, prevents scroll if dragging
  useEffect(() => {
    const el = elRef.current
    if (!el) return

    function onTouchMove(e: TouchEvent) {
      if (!holdReady.current) {
        // User moved before hold fired → cancel hold, let scroll happen
        if (holdTimer.current) clearTimeout(holdTimer.current)
        return
      }
      if (!dragRef.current) return
      e.preventDefault()

      const dy = (e.touches[0].clientY - dragRef.current.sy) / px
      if (Math.abs(dy) > 0.3) didDrag.current = true
      if (!didDrag.current) return

      // el is guaranteed non-null here (checked at effect boundary)
      const target = el as HTMLDivElement
      if (dragRef.current.type === 'move') {
        const snapped = Math.max(startHour, Math.round((dragRef.current.origStart + dy) * 6) / 6)
        const newTop = (snapped - startHour) * px + 2
        target.style.top = newTop + 'px'
        const bt = target.querySelector('.b-time')
        if (bt) bt.textContent = fmtH(snapped) + ' – ' + fmtH(snapped + dragRef.current.origDur)
      } else {
        const snapped = Math.max(1 / 6, Math.round((dragRef.current.origDur + dy) * 6) / 6)
        target.style.height = Math.max(snapped * px - 5, 28) + 'px'
        const bt = target.querySelector('.b-time')
        if (bt) bt.textContent = fmtH(dragRef.current.origStart) + ' – ' + fmtH(dragRef.current.origStart + snapped)
      }
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [px, startHour])

  function onTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).classList.contains('rh')) return
    if ((e.target as HTMLElement).closest('.block-menu, .b-quick')) return
    didDrag.current = false
    holdReady.current = false
    const sy = e.touches[0].clientY
    holdTimer.current = setTimeout(() => {
      holdReady.current = true
      dragRef.current = { type: 'move', sy, origStart: block.startHour, origDur: block.durHour }
      document.body.style.overflow = 'hidden'
      if (navigator.vibrate) navigator.vibrate([50, 30, 50])
      elRef.current?.classList.add('dragging')
    }, 500)
  }

  function onTouchEnd() {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    const el = elRef.current
    if (dragRef.current && didDrag.current && el) {
      if (dragRef.current.type === 'move') {
        const newTop = parseFloat(el.style.top) || top
        const ns = Math.max(startHour, (newTop - 2) / px + startHour)
        updateBlock(block.id, { startHour: Math.round(ns * 6) / 6 })
      } else {
        const newH = parseFloat(el.style.height) || height
        const nd = Math.max(1 / 6, (newH + 5) / px)
        updateBlock(block.id, { durHour: Math.round(nd * 6) / 6 })
      }
    }
    el?.classList.remove('dragging')
    dragRef.current = null
    holdReady.current = false
    didDrag.current = false
    document.body.style.overflow = ''
  }

  function onResizeTouchStart(e: React.TouchEvent) {
    e.stopPropagation()
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdReady.current = true
    const sy = e.touches[0].clientY
    dragRef.current = { type: 'resize', sy, origStart: block.startHour, origDur: block.durHour }
    document.body.style.overflow = 'hidden'
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const touchedRef = useRef(false)

  function fireDone() {
    if (block.recurId && !block.done) {
      useAppStore.getState().completeRecurring(block.recurId, block.date)
      window.dispatchEvent(new CustomEvent('ff-block-done', { detail: block.id }))
      return
    }
    const wasDone = block.done
    toggleDone(block.id)
    if (!wasDone) window.dispatchEvent(new CustomEvent('ff-block-done', { detail: block.id }))
  }

  function handleToggleDoneTouchEnd(e: React.TouchEvent) {
    e.stopPropagation(); e.preventDefault()
    touchedRef.current = true
    fireDone()
    setTimeout(() => { touchedRef.current = false }, 500)
  }

  function handleToggleDoneClick(e: React.MouseEvent) {
    if (touchedRef.current) return
    e.stopPropagation(); e.preventDefault()
    fireDone()
  }

  function handleMenuToggle(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
    e.preventDefault()
    onMenuToggle(isMenuOpen ? null : block.id)
  }

  if (isBuf) {
    return (
      <div className={className} style={{ top: `${top}px`, height: `${height}px` }}>
        <div className="b-inner">
          <div className="b-name">☕ 여유</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={elRef}
      className={className}
      style={{ top: `${top}px`, height: `${height}px` }}
      data-id={block.id}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => e.stopPropagation()}
    >
      {isMenuOpen && (
        <BlockMenu
          block={block}
          onClose={() => onMenuToggle(null)}
          onMemo={onMemo}
          onEdit={onEdit}
        />
      )}
      <div className="b-inner">
        <div className="b-name">
          {block.category && (
            <span className="b-cat-tag" style={{ background: catColor(block.category) }}>
              {block.category}
            </span>
          )}
          {block.done ? '✓ ' : ''}
          {block.name}
          {block.isRecurring && <span className="recur-icon">🔁</span>}
          <span className="b-quick">
            <button
              className="b-qbtn"
              style={block.done ? { background: 'var(--pd)', color: '#fff', borderColor: 'var(--pd)' } : undefined}
              onTouchEnd={handleToggleDoneTouchEnd}
              onClick={handleToggleDoneClick}
            >
              ✓
            </button>
            <button
              className="b-qbtn"
              onTouchEnd={handleMenuToggle}
              onClick={handleMenuToggle}
            >
              ⋯
            </button>
          </span>
        </div>
        <div className="b-time">
          {fmtH(block.startHour)} – {fmtH(block.startHour + block.durHour)}
        </div>
        {block.memo && <div className="b-memo">{block.memo}</div>}
      </div>
      <div
        className="rh"
        data-id={block.id}
        onTouchStart={onResizeTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </div>
  )
}
