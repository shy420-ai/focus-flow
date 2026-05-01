import { useState, useRef } from 'react'
import { useDropStore } from '../../store/DropStore'
import { showConfirm } from '../../lib/showConfirm'
import type { DropItem } from '../../types/drop'

interface DropRowProps {
  item: DropItem
  isFirst: boolean
  idx: number
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onEdit: (id: number, name: string) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDrop: (e: React.DragEvent, toIdx: number) => void
  dragOverIdx: number | null
}

function DropRow({ item, isFirst, idx, onToggle, onDelete, onEdit, onDragStart, onDragOver, onDrop, dragOverIdx }: DropRowProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(item.name)

  if (item.done) {
    return (
      <div className="drop-item done">
        <button className="drop-check" onClick={() => onToggle(item.id)}>✓</button>
        <div className="drop-name">{item.name}</div>
        <button className="drop-del" onClick={() => onDelete(item.id)}>✕</button>
      </div>
    )
  }

  return (
    <div
      className={'drop-item' + (dragOverIdx === idx ? ' drag-over' : '')}
      draggable
      style={isFirst ? { borderLeftColor: 'var(--pd)', background: 'var(--pl)' } : {}}
      onDragStart={() => onDragStart(idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
    >
      <button className="drop-check" onClick={() => onToggle(item.id)} />
      {editing ? (
        <input
          className="drop-input"
          style={{ flex: 1, height: 32, padding: '4px 8px', fontSize: 14 }}
          value={editVal}
          autoFocus
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={() => {
            if (editVal.trim()) onEdit(item.id, editVal.trim())
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editVal.trim()) onEdit(item.id, editVal.trim())
              setEditing(false)
            }
            if (e.key === 'Escape') { setEditVal(item.name); setEditing(false) }
          }}
        />
      ) : (
        <div className="drop-name" style={{ cursor: 'pointer' }} onClick={() => setEditing(true)}>
          {item.name}
        </div>
      )}
      <button className="drop-del" onClick={() => onDelete(item.id)}>✕</button>
    </div>
  )
}

export function DropsView() {
  const items = useDropStore((s) => s.items)
  const addItem = useDropStore((s) => s.addItem)
  const toggleDone = useDropStore((s) => s.toggleDone)
  const deleteItem = useDropStore((s) => s.deleteItem)
  const editItem = useDropStore((s) => s.editItem)
  const reorder = useDropStore((s) => s.reorder)
  const clearDone = useDropStore((s) => s.clearDone)
  const clearAll = useDropStore((s) => s.clearAll)
  const shuffle = useDropStore((s) => s.shuffle)

  const [inputVal, setInputVal] = useState('')
  const dragFromIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const todo = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  function handleToggle(id: number) {
    const item = items.find((i) => i.id === id)
    toggleDone(id)
    if (item && !item.done) {
      window.dispatchEvent(new CustomEvent('ff-block-done', { detail: String(id) }))
    }
  }

  function handleAdd() {
    addItem(inputVal)
    setInputVal('')
  }

  function handleDragStart(idx: number) {
    dragFromIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault()
    if (dragFromIdx.current !== null && dragFromIdx.current !== toIdx) {
      reorder(dragFromIdx.current, toIdx)
    }
    dragFromIdx.current = null
    setDragOverIdx(null)
  }

  return (
    <div className="drop-wrap">
      <div style={{ fontSize: 13, color: 'var(--pd)', fontWeight: 700, marginBottom: 12 }}>
        🧠 뇌 비우기 — 일단 다 적어!
      </div>
      <div className="drop-input-row">
        <input
          className="drop-input"
          placeholder="머릿속에 있는 거 아무거나..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd()
          }}
        />
        <button className="drop-add-btn" onClick={handleAdd}>+</button>
      </div>

      {items.length > 0 && (
        <div className="drop-actions">
          <button className="drop-action-btn" onClick={shuffle}>🎲 랜덤 셔플</button>
          {done.length > 0 && (
            <button className="drop-action-btn" onClick={clearDone}>🗑 완료 지우기</button>
          )}
          <button className="drop-action-btn" onClick={async () => {
            if (await showConfirm('덤프 전체 초기화? 모든 항목이 사라져')) clearAll()
          }}>🔄 전체 초기화</button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>{todo.length}개 남음</span>
        </div>
      )}

      {todo.length === 0 && done.length === 0 && (
        <div className="drop-empty">
          머리가 복잡할 때<br />
          여기에 다 쏟아내면 돼<br /><br />
          적는 것만으로도 뇌 용량 확보 됨 🫧
        </div>
      )}

      {todo.map((item, i) => (
        <DropRow
          key={item.id}
          item={item}
          isFirst={i === 0}
          idx={i}
          onToggle={handleToggle}
          onDelete={deleteItem}
          onEdit={editItem}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dragOverIdx={dragOverIdx}
        />
      ))}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#aaa', margin: '12px 0 6px', fontWeight: 600 }}>완료 {done.length}개</div>
          {done.map((item) => (
            <DropRow
              key={item.id}
              item={item}
              isFirst={false}
              idx={-1}
              onToggle={handleToggle}
              onDelete={deleteItem}
              onEdit={editItem}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDrop={() => {}}
              dragOverIdx={null}
            />
          ))}
        </>
      )}
    </div>
  )
}
