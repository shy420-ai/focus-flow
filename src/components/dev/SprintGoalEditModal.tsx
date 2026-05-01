// Inline edit dialog for a sprint goal: current value + per-tap step.
import { useState } from 'react'
import { useBackClose } from '../../hooks/useBackClose'

interface Props {
  current: number
  step: number
  target: number
  unit: string
  onSave: (current: number, step: number) => void
  onClose: () => void
}

export function SprintGoalEditModal({ current, step, target, unit, onSave, onClose }: Props) {
  // Lazy-init from props once; the parent unmounts/remounts this modal per
  // edit session so we don't need to react to prop changes.
  const [cur, setCur] = useState(() => String(current))
  const [stepStr, setStepStr] = useState(() => String(step))
  useBackClose(true, onClose)

  function save() {
    const c = Math.max(0, parseInt(cur.trim()) || 0)
    const s = Math.max(1, parseInt(stepStr.trim()) || 1)
    onSave(c, s)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(2px)', zIndex: 9300,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden',
      }}>
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 60%, #fff))', padding: '14px 20px', borderBottom: '1px solid var(--pl)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>✏️ 목표 수정</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>목표 {target}{unit}</div>
        </div>
        <div style={{ padding: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6 }}>현재 값</label>
          <input
            type="number"
            min={0}
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
          />

          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6 }}>한 번 누를 때 단위</label>
          <input
            type="number"
            min={1}
            value={stepStr}
            onChange={(e) => setStepStr(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 4 }}
          />
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 14 }}>
            "내가 해냄 +N" 누르면 한 번에 N만큼 올라가
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              취소
            </button>
            <button onClick={save}
              style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px color-mix(in srgb, var(--pink) 40%, transparent)' }}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
