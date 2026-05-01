// Lets the user edit the template palette used by DropDetailModal.
import { useState } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import { loadTemplates, saveTemplates, DEFAULT_TEMPLATES, type DropTemplate } from './dropTemplates'

interface Props {
  onClose: () => void
}

export function TemplateEditModal({ onClose }: Props) {
  const [list, setList] = useState<DropTemplate[]>(() => loadTemplates())
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  useBackClose(true, () => { saveTemplates(list); onClose() })

  function update(idx: number, patch: Partial<DropTemplate>) {
    setList((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }
  function remove(idx: number) {
    if (list[idx].id === '') return  // keep the "없음" sentinel
    setList((prev) => prev.filter((_, i) => i !== idx))
  }
  function add() {
    const emoji = newEmoji.trim() || '📌'
    const label = newLabel.trim()
    if (!label) return
    // Generate a stable id from the label so it persists and shows up on
    // existing items that picked the same template.
    const id = label.toLowerCase().replace(/\s+/g, '-')
    if (list.find((t) => t.id === id)) return
    setList((prev) => [...prev, { id, emoji, label }])
    setNewEmoji('')
    setNewLabel('')
  }
  function reset() {
    setList(DEFAULT_TEMPLATES)
  }
  function done() {
    saveTemplates(list)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) done() }}
    >
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 60%, #fff))', padding: '14px 18px', borderBottom: '1px solid var(--pl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>📋 템플릿 편집</div>
          <button onClick={reset} style={{ background: 'none', border: '1px solid #ddd', color: '#888', borderRadius: 8, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>기본값</button>
        </div>

        <div style={{ padding: 14 }}>
          {list.map((t, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <input
                value={t.emoji}
                onChange={(e) => update(idx, { emoji: e.target.value.slice(0, 4) })}
                disabled={t.id === ''}
                style={{ width: 44, padding: '8px 4px', border: '1.5px solid #eee', borderRadius: 8, fontSize: 16, textAlign: 'center', fontFamily: 'inherit', outline: 'none', background: t.id === '' ? '#f5f5f5' : '#fff' }}
              />
              <input
                value={t.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                disabled={t.id === ''}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #eee', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: t.id === '' ? '#f5f5f5' : '#fff' }}
              />
              <button
                onClick={() => remove(idx)}
                disabled={t.id === ''}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: t.id === '' ? '#f5f5f5' : '#FFF0F0', color: t.id === '' ? '#ccc' : '#E24B4A', cursor: t.id === '' ? 'default' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}
              >✕</button>
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '10px', border: '1.5px dashed #ddd', borderRadius: 10 }}>
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value.slice(0, 4))}
              placeholder="🌱"
              style={{ width: 44, padding: '8px 4px', border: '1.5px solid #eee', borderRadius: 8, fontSize: 16, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }}
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="새 템플릿 이름"
              onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #eee', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={add}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >추가</button>
          </div>

          <button onClick={done} style={{ width: '100%', marginTop: 12, padding: 11, borderRadius: 10, border: 'none', background: 'var(--pd)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>완료</button>
        </div>
      </div>
    </div>
  )
}
