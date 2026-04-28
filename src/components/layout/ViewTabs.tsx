import { useState, useEffect, useRef } from 'react'
import { useAppStore, type CurView } from '../../store/AppStore'

const ALL_TABS: Array<{ id: CurView; label: string }> = [
  { id: 'tl', label: '일간' },
  { id: 'week', label: '주간' },
  { id: 'cal', label: '월간' },
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
          {tab.label}
        </button>
      ))}
    </div>
  )
}
