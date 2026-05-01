// Lets the user pick which of yesterday's blocks to copy into today.
import { useState } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import type { Block } from '../../types/block'
import { fmtH } from '../../lib/date'

interface Props {
  sourceBlocks: Block[]
  onCopy: (selected: Block[]) => void
  onClose: () => void
}

export function CopyDayModal({ sourceBlocks, onCopy, onClose }: Props) {
  // Default-checked all so the common "copy everything" path stays one tap.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(sourceBlocks.map((b) => b.id)))
  useBackClose(true, onClose)

  const sorted = [...sourceBlocks].sort((a, b) => a.startHour - b.startHour)
  const allChecked = checked.size === sorted.length
  const noneChecked = checked.size === 0

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(sorted.map((b) => b.id)))
  }
  function confirm() {
    if (noneChecked) return
    onCopy(sorted.filter((b) => checked.has(b.id)))
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
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
      }}>
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 60%, #fff))', padding: '14px 18px', borderBottom: '1px solid var(--pl)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>📋 복사할 일정 선택</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>체크된 것만 오늘로 복사돼</div>
          </div>
          <button onClick={toggleAll} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--pink)', background: '#fff', color: 'var(--pink)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {allChecked ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {sorted.map((b) => {
            const sel = checked.has(b.id)
            return (
              <button
                key={b.id}
                onClick={() => toggle(b.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', marginBottom: 6, borderRadius: 10,
                  border: '1.5px solid ' + (sel ? 'var(--pink)' : '#eee'),
                  background: sel ? 'var(--pl)' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: '2px solid ' + (sel ? 'var(--pink)' : '#ccc'),
                  background: sel ? 'var(--pink)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 800,
                }}>{sel ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{fmtH(b.startHour)} - {fmtH(b.startHour + b.durHour)}</div>
                  <div style={{ fontSize: 13, color: 'var(--pd)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ padding: 14, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button
            onClick={confirm}
            disabled={noneChecked}
            style={{ flex: 2, padding: 11, borderRadius: 12, border: 'none', background: noneChecked ? '#ddd' : 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: noneChecked ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >
            {noneChecked ? '하나는 골라줘' : `${checked.size}개 복사`}
          </button>
        </div>
      </div>
    </div>
  )
}
