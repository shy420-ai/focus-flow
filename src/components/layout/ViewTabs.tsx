import { useState, useEffect, useRef } from 'react'
import { useAppStore, type CurView } from '../../store/AppStore'

const ALL_TABS: Array<{ id: CurView; label: string; icon?: React.ReactNode }> = [
  { id: 'tl', label: '일간', icon: (
    // cute sun/day icon
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".25" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) },
  { id: 'week', label: '주간', icon: (
    // 7 dots in a heart pattern (week)
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ flexShrink: 0 }}>
      <circle cx="3" cy="12" r="2" />
      <circle cx="8" cy="9" r="2" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="18" cy="9" r="2" />
      <circle cx="21" cy="14" r="2" />
      <circle cx="16" cy="17" r="2" />
      <circle cx="11" cy="20" r="2" fillOpacity=".4" />
    </svg>
  ) },
  { id: 'cal', label: '월간', icon: (
    // cute mini calendar
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <circle cx="8" cy="15" r="1.5" fill="currentColor" />
      <circle cx="13" cy="15" r="1.5" fill="currentColor" fillOpacity=".4" />
    </svg>
  ) },
  { id: 'habit', label: '습관' },
  { id: 'goal', label: '목표' },
  { id: 'drop', label: '드롭' },
  { id: 'stats', label: '메디' },
]

const ORDER_KEY = 'ff_tab_order'
const HIDDEN_KEY = 'ff_hidden_tabs'

function loadOrder(): CurView[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') } catch { return [] }
}

function loadHidden(): CurView[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]') } catch { return [] }
}

function getOrderedTabs(order: CurView[], hidden: CurView[]) {
  const visible = ALL_TABS.filter((t) => t.id === 'tl' || !hidden.includes(t.id))
  if (!order.length) return visible
  const ordered = order
    .map((id) => visible.find((t) => t.id === id))
    .filter(Boolean) as typeof visible
  const missing = visible.filter((t) => !order.includes(t.id))
  return [...ordered, ...missing]
}

export function ViewTabs() {
  const curView = useAppStore((s) => s.curView)
  const setCurView = useAppStore((s) => s.setCurView)
  const [hidden, setHidden] = useState<CurView[]>(loadHidden)
  const [order, setOrder] = useState<CurView[]>(loadOrder)
  const [dragOverId, setDragOverId] = useState<CurView | null>(null)
  const dragId = useRef<CurView | null>(null)

  useEffect(() => {
    function onTabsChanged() {
      setHidden(loadHidden())
      setOrder(loadOrder())
    }
    window.addEventListener('ff-tabs-changed', onTabsChanged)
    return () => window.removeEventListener('ff-tabs-changed', onTabsChanged)
  }, [])

  const tabs = getOrderedTabs(order, hidden)

  function handleDragStart(e: React.DragEvent, id: CurView) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, targetId: CurView) {
    e.preventDefault()
    if (!dragId.current || dragId.current === targetId) return
    setDragOverId(targetId)
    const from = tabs.findIndex((t) => t.id === dragId.current)
    const to = tabs.findIndex((t) => t.id === targetId)
    if (from === -1 || to === -1) return
    const newTabs = [...tabs]
    const [moved] = newTabs.splice(from, 1)
    newTabs.splice(to, 0, moved)
    const newOrder = newTabs.map((t) => t.id)
    localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder))
    setOrder(newOrder)
  }

  function handleDragEnd() {
    dragId.current = null
    setDragOverId(null)
  }

  return (
    <div className="view-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={
            'vtab' +
            (curView === tab.id ? ' active' : '') +
            (dragOverId === tab.id ? ' drag-over-tab' : '')
          }
          onClick={() => setCurView(tab.id)}
          draggable={tab.id !== 'tl'}
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={(e) => handleDragOver(e, tab.id)}
          onDragEnd={handleDragEnd}
          onDragLeave={() => setDragOverId(null)}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
