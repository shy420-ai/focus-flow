import { useState } from 'react'
import type { Category } from '../../constants/categories'
import { getCategories, addCategory, removeCategory, updateCategoryColor, CAT_COLORS } from '../../lib/categories'
import { showMiniToast } from '../../lib/miniToast'

interface CatEditModalProps {
  onClose: () => void
  onChange?: () => void
}

export function CatEditModal({ onClose, onChange }: CatEditModalProps) {
  const [cats, setCats] = useState<Category[]>(getCategories)
  const [newName, setNewName] = useState('')
  const [editingColor, setEditingColor] = useState<string | null>(null)

  function refresh() {
    setCats(getCategories())
    onChange?.()
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (cats.find((c) => c.name === trimmed)) { showMiniToast('이미 있는 카테고리야'); return }
    addCategory(trimmed)
    setNewName('')
    refresh()
  }

  function handleRemove(name: string) {
    removeCategory(name)
    refresh()
  }

  function handleColorChange(name: string, color: string) {
    updateCategoryColor(name, color)
    setEditingColor(null)
    refresh()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)', marginBottom: 14, textAlign: 'center' }}>🏷️ 카테고리 편집</div>

        {cats.map((cat) => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              onClick={() => setEditingColor(editingColor === cat.name ? null : cat.name)}
              style={{ width: 22, height: 22, borderRadius: '50%', background: cat.color, cursor: 'pointer', flexShrink: 0, border: '2px solid rgba(0,0,0,.1)' }}
            />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#333' }}>{cat.name}</span>
            <button
              onClick={() => handleRemove(cat.name)}
              style={{ background: '#FFF0F0', border: 'none', color: '#E24B4A', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 13 }}
            >✕</button>
            {editingColor === cat.name && (
              <div style={{ position: 'absolute', left: 20, right: 20, background: '#FAFAFA', border: '1px solid #EEE', borderRadius: 16, padding: 18, zIndex: 9200, marginTop: 4, boxShadow: '0 6px 24px rgba(0,0,0,.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, justifyItems: 'center' }}>
                  {CAT_COLORS.map((c) => {
                    const selected = c === cat.color
                    return (
                      <div
                        key={c}
                        onClick={() => handleColorChange(cat.name, c)}
                        style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: c }} />
                        {selected && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${c}`, pointerEvents: 'none' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 카테고리 이름"
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAdd()}
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >추가</button>
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: 14, padding: 12, borderRadius: 10, border: 'none', background: 'var(--pl)', color: 'var(--pd)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >완료</button>
      </div>
    </div>
  )
}
