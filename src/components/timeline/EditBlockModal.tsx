import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { getCategories } from '../../lib/categories'
import type { Block } from '../../types/block'
import type { Category } from '../../constants/categories'

interface Props {
  block: Block
  onClose: () => void
}

export function EditBlockModal({ block, onClose }: Props) {
  const updateBlock = useAppStore((s) => s.updateBlock)

  const startH = Math.floor(block.startHour)
  const startM = Math.round((block.startHour % 1) * 60)
  const durH = Math.floor(block.durHour)
  const durM = Math.round((block.durHour % 1) * 60)

  const [name, setName] = useState(block.name)
  const [category, setCategory] = useState(block.category || '')
  const [startHour, setStartHour] = useState(startH)
  const [startMin, setStartMin] = useState(startM)
  const [durationH, setDurationH] = useState(durH)
  const [durationM, setDurationM] = useState(durM)
  const [categories, setCategories] = useState<Category[]>(getCategories)

  useEffect(() => {
    function onCatsChanged() { setCategories(getCategories()) }
    window.addEventListener('ff-cats-changed', onCatsChanged)
    return () => window.removeEventListener('ff-cats-changed', onCatsChanged)
  }, [])

  function handleSave() {
    const newStart = startHour + startMin / 60
    const newDur = durationH + durationM / 60
    updateBlock(block.id, {
      name: name.trim() || block.name,
      category,
      startHour: newStart,
      durHour: newDur > 0 ? newDur : 0.5,
    })
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 9010, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 300 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)', marginBottom: 14, textAlign: 'center' }}>블록 수정</div>

        {/* Name */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>이름</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: 10, border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>카테고리</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={'cat-pill' + (!category ? ' active' : '')}
              style={!category ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : {}}
              onClick={() => setCategory('')}
            >없음</button>
            {categories.map((c) => (
              <button
                key={c.name}
                className={'cat-pill' + (category === c.name ? ' active' : '')}
                style={category === c.name
                  ? { background: c.color, color: '#fff', borderColor: c.color }
                  : { color: c.color, borderColor: c.color }}
                onClick={() => setCategory(c.name)}
              >{c.name}</button>
            ))}
          </div>
        </div>

        {/* Time + Duration */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>⏰ 시작</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                style={{ flex: 1, padding: '8px 4px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: '#aaa' }}>:</span>
              <select
                value={startMin}
                onChange={(e) => setStartMin(parseInt(e.target.value))}
                style={{ flex: 1, padding: '8px 4px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>⏱ 소요</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <select
                value={durationH}
                onChange={(e) => setDurationH(parseInt(e.target.value))}
                style={{ flex: 1, padding: '8px 4px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i} value={i}>{i}h</option>
                ))}
              </select>
              <select
                value={durationM}
                onChange={(e) => setDurationM(parseInt(e.target.value))}
                style={{ flex: 1, padding: '8px 4px', border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                {[0, 10, 15, 20, 30, 40, 45, 50].map((m) => (
                  <option key={m} value={m}>{m}m</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >저장</button>
      </div>
    </div>
  )
}
