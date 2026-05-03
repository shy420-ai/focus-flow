import { useMemo, useState } from 'react'
import type React from 'react'
import { useDropStore } from '../../store/DropStore'
import { showConfirm } from '../../lib/showConfirm'
import { DropDetailModal } from './DropDetailModal'
import type { DropItem } from '../../types/drop'

const TEMPLATE_EMOJI: Record<string, string> = {
  '': '📝',
  idea: '💡',
  quote: '📚',
  link: '🔗',
  task: '✅',
  memo: '🧠',
}

export function DropsView() {
  const items = useDropStore((s) => s.items)
  const addItem = useDropStore((s) => s.addItem)
  const toggleDone = useDropStore((s) => s.toggleDone)
  const toggleStar = useDropStore((s) => s.toggleStar)
  const deleteItem = useDropStore((s) => s.deleteItem)
  const editItem = useDropStore((s) => s.editItem)
  const clearDone = useDropStore((s) => s.clearDone)
  const clearAll = useDropStore((s) => s.clearAll)
  const shuffle = useDropStore((s) => s.shuffle)
  const reorder = useDropStore((s) => s.reorder)

  // ☰ 드래그로 순서 바꾸기 — non-done 아이템 안에서만 동작.
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  function onDragHandleDown(e: React.PointerEvent, id: number) {
    setDragId(id)
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }
  function onDragHandleMove(e: React.PointerEvent) {
    if (dragId == null) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop-id]') as HTMLElement | null
    const id = el?.dataset.dropId
    if (id && Number(id) !== dragOverId) setDragOverId(Number(id))
  }
  function onDragHandleUp(e: React.PointerEvent) {
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    if (dragId != null && dragOverId != null && dragId !== dragOverId) {
      const todoOnly = items.filter((i) => !i.done)
      const fromIdx = todoOnly.findIndex((i) => i.id === dragId)
      const toIdx = todoOnly.findIndex((i) => i.id === dragOverId)
      if (fromIdx !== -1 && toIdx !== -1) reorder(fromIdx, toIdx)
    }
    setDragId(null)
    setDragOverId(null)
  }

  const [inputVal, setInputVal] = useState('')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  // Pull a tag chip set from all items (top 12 by frequency).
  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of items) {
      for (const t of it.tags || []) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)
  }, [items])

  // Filter pipeline: text search → tag filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (q) {
        const hay = (it.name + ' ' + (it.note || '') + ' ' + (it.tags || []).join(' ')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (activeTag && !(it.tags || []).includes(activeTag)) return false
      return true
    })
  }, [items, search, activeTag])

  const starred = filtered.filter((i) => i.starred && !i.done)
  const todo = filtered.filter((i) => !i.starred && !i.done)
  const done = filtered.filter((i) => i.done)

  function handleAdd() {
    if (!inputVal.trim()) return
    addItem(inputVal)
    setInputVal('')
  }

  function handleToggleDone(id: number) {
    const it = items.find((i) => i.id === id)
    toggleDone(id)
    if (it && !it.done) {
      window.dispatchEvent(new CustomEvent('ff-block-done', { detail: String(id) }))
    }
  }

  const editingItem = editId != null ? items.find((i) => i.id === editId) : null

  return (
    <div className="drop-wrap">
      <div style={{ fontSize: 13, color: 'var(--pd)', fontWeight: 700, marginBottom: 8 }}>
        🧠 뇌 비우기 — 일단 다 적어!
      </div>

      {/* Quick add row */}
      <div className="drop-input-row">
        <input
          className="drop-input"
          placeholder="머릿속에 있는 거 아무거나..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd() }}
        />
        <button className="drop-add-btn" onClick={handleAdd}>+</button>
      </div>

      {/* Search */}
      {items.length > 3 && (
        <div style={{ marginBottom: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 검색 (제목 / 본문 / 태그)"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #eee', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
          />
        </div>
      )}

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {activeTag && (
            <button onClick={() => setActiveTag(null)} style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid #ddd', background: '#fff', fontSize: 10, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>전체</button>
          )}
          {allTags.map((t) => {
            const on = activeTag === t
            return (
              <button
                key={t}
                onClick={() => setActiveTag(on ? null : t)}
                style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid ' + (on ? 'var(--pink)' : '#eee'), background: on ? 'var(--pink)' : '#fff', color: on ? '#fff' : 'var(--pd)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >#{t}</button>
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="drop-actions">
          {done.length > 0 && (
            <button className="drop-action-btn" onClick={clearDone}>🗑 완료 지우기</button>
          )}
          <button className="drop-action-btn" onClick={shuffle}>🎲 랜덤 섞기</button>
          <button className="drop-action-btn" onClick={async () => {
            if (await showConfirm('덤프 전체 초기화? 모든 항목이 사라져')) clearAll()
          }}>🔄 전체 초기화</button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>{todo.length + starred.length}개 남음</span>
        </div>
      )}

      {items.length === 0 && (
        <div className="drop-empty">
          머리가 복잡할 때<br />
          여기에 다 쏟아내면 돼<br /><br />
          ⭐ 별 누르면 보관함으로,<br />
          탭하면 긴 메모 + 사진까지 가능 🫧
        </div>
      )}

      {/* Starred section */}
      {starred.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)', margin: '12px 0 6px' }}>⭐ 보관 ({starred.length})</div>
          {starred.map((item) => (
            <DropRow key={item.id} item={item} onTap={() => setEditId(item.id)} onToggleDone={handleToggleDone} onToggleStar={toggleStar} onDelete={deleteItem} highlight
              draggable
              isDragging={dragId === item.id}
              isDragOver={dragOverId === item.id && dragId != null && dragId !== item.id}
              onDragDown={(e) => onDragHandleDown(e, item.id)}
              onDragMove={onDragHandleMove}
              onDragUp={onDragHandleUp}
            />
          ))}
        </>
      )}

      {/* Active section */}
      {todo.length > 0 && (
        <>
          {starred.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: '#888', margin: '14px 0 6px' }}>🌊 임시 ({todo.length})</div>}
          {todo.map((item) => (
            <DropRow key={item.id} item={item} onTap={() => setEditId(item.id)} onToggleDone={handleToggleDone} onToggleStar={toggleStar} onDelete={deleteItem}
              draggable
              isDragging={dragId === item.id}
              isDragOver={dragOverId === item.id && dragId != null && dragId !== item.id}
              onDragDown={(e) => onDragHandleDown(e, item.id)}
              onDragMove={onDragHandleMove}
              onDragUp={onDragHandleUp}
            />
          ))}
        </>
      )}

      {/* Done section */}
      {done.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#aaa', margin: '14px 0 6px', fontWeight: 600 }}>완료 {done.length}</div>
          {done.map((item) => (
            <DropRow key={item.id} item={item} onTap={() => setEditId(item.id)} onToggleDone={handleToggleDone} onToggleStar={toggleStar} onDelete={deleteItem} />
          ))}
        </>
      )}

      {editingItem && (
        <DropDetailModal
          item={editingItem}
          onSave={(patch) => editItem(editingItem.id, patch)}
          onDelete={() => deleteItem(editingItem.id)}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  )
}

interface RowProps {
  item: DropItem
  onTap: () => void
  onToggleDone: (id: number) => void
  onToggleStar: (id: number) => void
  onDelete: (id: number) => void
  highlight?: boolean
  // 드래그 핸들 — undefined 면 핸들 자체가 안 그려짐 (done 섹션 등).
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragDown?: (e: React.PointerEvent) => void
  onDragMove?: (e: React.PointerEvent) => void
  onDragUp?: (e: React.PointerEvent) => void
}

function DropRow({ item, onTap, onToggleDone, onToggleStar, onDelete, highlight,
  draggable, isDragging, isDragOver, onDragDown, onDragMove, onDragUp }: RowProps) {
  const hasNote = !!item.note
  const hasImage = !!item.imageUrl
  const tEmoji = item.template ? TEMPLATE_EMOJI[item.template] : null
  const isDone = !!item.done
  return (
    <div
      className="drop-item"
      data-drop-id={item.id}
      style={{
        ...(highlight ? { borderLeftColor: 'var(--pink)', background: '#FFF6F8' } : {}),
        ...(isDone ? { opacity: .6 } : {}),
        ...(isDragging ? { opacity: .35 } : {}),
        ...(isDragOver ? { background: 'var(--pl)' } : {}),
        cursor: 'pointer',
        transition: 'background .15s, opacity .15s',
      }}
    >
      {draggable && onDragDown && (
        <span
          onPointerDown={onDragDown}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          onPointerCancel={onDragUp}
          style={{
            cursor: 'grab', color: '#bbb', fontSize: 14,
            padding: '4px 4px', touchAction: 'none',
            userSelect: 'none', WebkitUserSelect: 'none',
            lineHeight: 1, flexShrink: 0, alignSelf: 'center',
          }}
          aria-label="순서 변경"
        >☰</span>
      )}
      <button
        className="drop-check"
        onClick={(e) => { e.stopPropagation(); onToggleDone(item.id) }}
        style={isDone ? { background: 'var(--pink)', color: '#fff' } : {}}
      >{isDone ? '✓' : ''}</button>

      <div onClick={onTap} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasImage && (
          <img
            src={item.imageUrl}
            alt=""
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, display: 'block' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {tEmoji && <span style={{ fontSize: 12 }}>{tEmoji}</span>}
            <div className="drop-name" style={{ flex: 1, minWidth: 0, textDecoration: isDone ? 'line-through' : 'none' }}>{item.name}</div>
          </div>
          {(hasNote || (item.tags && item.tags.length > 0)) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#999' }}>
              {hasNote && <span>📝</span>}
              {item.tags?.slice(0, 3).map((t) => (
                <span key={t} style={{ background: '#FFE4EC', color: 'var(--pink)', padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 600 }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(item.id) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: item.starred ? '#F5B91E' : '#ddd' }}
        aria-label="보관 토글"
      >{item.starred ? '★' : '☆'}</button>
      <button className="drop-del" onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}>✕</button>
    </div>
  )
}
