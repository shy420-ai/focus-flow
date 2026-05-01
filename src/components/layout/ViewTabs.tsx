import { useState, useEffect, useRef } from 'react'
import { useAppStore, type CurView } from '../../store/AppStore'
import { flushSync, registerCollect, registerHydrate } from '../../lib/syncManager'
import { isDevMode } from '../../lib/devMode'
import type { UserDoc } from '../../lib/firestore'

const ALL_TABS: Array<{ id: CurView; label: string; icon?: React.ReactNode }> = [
  { id: 'tl', label: '일간', icon: (
    // cute sun/day icon
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".25" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) },
  { id: 'week', label: '주간', icon: (
    // single highlighted week strip — 7 squares in a row inside a rounded card
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <line x1="6.4" y1="10" x2="6.4" y2="14" />
      <line x1="9.3" y1="10" x2="9.3" y2="14" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="14.7" y1="10" x2="14.7" y2="14" />
      <line x1="17.6" y1="10" x2="17.6" y2="14" />
      <rect x="9.5" y="9" width="5" height="6" rx="1" fill="currentColor" fillOpacity=".25" stroke="none" />
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
  { id: 'habit', label: '습관', icon: (
    // sprout / plant — habit growing
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22V12" />
      <path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z" fill="currentColor" fillOpacity=".3" />
      <path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z" fill="currentColor" fillOpacity=".3" />
      <path d="M9 22h6" />
    </svg>
  ) },
  { id: 'goal', label: '목표', icon: (
    // target / bullseye
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ) },
  { id: 'drop', label: '덤프', icon: (
    // 3D box (brain dump container)
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" fill="currentColor" fillOpacity=".25" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  ) },
  { id: 'stats', label: '메디', icon: (
    // capsule / pill
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
      <path d="M9.5 6.5l8 8" opacity=".7" />
    </svg>
  ) },
  { id: 'friends', label: '친구', icon: (
    // two heads — friend pair
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="8" r="3.2" fill="currentColor" fillOpacity=".25" />
      <circle cx="16" cy="9" r="2.5" fill="currentColor" fillOpacity=".25" />
      <path d="M3.5 19c.5-3 3-5 5.5-5s5 2 5.5 5" />
      <path d="M14 19c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5" />
    </svg>
  ) },
  { id: 'mood', label: '일기', icon: (
    // heart with sparkle — emotion journal
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" fill="currentColor" fillOpacity=".25" />
    </svg>
  ) },
  { id: 'tips', label: '정보', icon: (
    // open book — wiki/tips
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2z" fill="currentColor" fillOpacity=".2" />
      <path d="M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z" fill="currentColor" fillOpacity=".2" />
    </svg>
  ) },
]

const ORDER_KEY = 'ff_tab_order'
const HIDDEN_KEY = 'ff_hidden_tabs'
const ORDER_TS_KEY = 'ff_tab_order_ts'  // legacy — still written for forward compat

function loadOrder(): CurView[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') } catch { return [] }
}

function loadHidden(): CurView[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]') } catch { return [] }
}

// Tabs that only appear when dev mode is enabled. Keeps unfinished
// experiments out of regular users' navigation. (currently empty —
// 정보 graduated with the soft lock guard.)
const DEV_ONLY: CurView[] = []

function getOrderedTabs(order: CurView[], hidden: CurView[]) {
  const dev = isDevMode()
  const visible = ALL_TABS
    .filter((t) => dev || !DEV_ONLY.includes(t.id))
    .filter((t) => !hidden.includes(t.id))
  if (!order.length) return visible
  const ordered = order
    .map((id) => visible.find((t) => t.id === id))
    .filter(Boolean) as typeof visible
  const missing = visible.filter((t) => !order.includes(t.id))
  return [...ordered, ...missing]
}

// Sync tab order + hidden list across devices via Firestore.
// Push when the localStorage key exists — including when it's empty —
// so "I unhid every tab" is a syncable state. A device that has never
// touched settings has no key and stays out of the sync.
registerCollect(() => {
  const out: Partial<UserDoc> = {}
  const orderRaw = localStorage.getItem(ORDER_KEY)
  const hiddenRaw = localStorage.getItem(HIDDEN_KEY)
  if (orderRaw !== null) {
    try { out.tabOrder = JSON.parse(orderRaw) } catch { /* ignore */ }
  }
  if (hiddenRaw !== null) {
    try { out.tabHidden = JSON.parse(hiddenRaw) } catch { /* ignore */ }
  }
  return out
})

registerHydrate((d: UserDoc) => {
  // Adopt remote ONLY when local has never been set — i.e., first install
  // on a new device. After that, local always wins so flushSync race
  // conditions can't roll back the user's edits. Cross-device "sync" of
  // tab settings then happens only on first install (good enough for a
  // pure UI preference).
  let changed = false
  if (Array.isArray(d.tabOrder) && localStorage.getItem(ORDER_KEY) === null) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(d.tabOrder))
    changed = true
  }
  if (Array.isArray(d.tabHidden) && localStorage.getItem(HIDDEN_KEY) === null) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(d.tabHidden))
    changed = true
  }
  if (changed) window.dispatchEvent(new CustomEvent('ff-tabs-changed'))
})

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
    // Also re-render when dev mode flips so dev-only tabs appear/disappear.
    window.addEventListener('ff-dev-mode-changed', onTabsChanged)
    return () => {
      window.removeEventListener('ff-tabs-changed', onTabsChanged)
      window.removeEventListener('ff-dev-mode-changed', onTabsChanged)
    }
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
    // eslint-disable-next-line react-hooks/purity
    localStorage.setItem(ORDER_TS_KEY, String(Date.now()))
    setOrder(newOrder)
    // Push immediately so a refresh between drag-end and the debounce
    // window can't roll us back to the old order.
    flushSync().catch(() => { /* offline ok */ })
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
          draggable
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
