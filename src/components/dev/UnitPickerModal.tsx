import { useBackClose } from '../../hooks/useBackClose'

interface Props {
  current: string
  onPick: (unit: string) => void
  onClose: () => void
}

const UNITS: Array<{ value: string; label: string; hint?: string }> = [
  { value: '회', label: '회', hint: '횟수' },
  { value: '시간', label: 'h', hint: '시간' },
  { value: '분', label: 'm', hint: '분' },
  { value: '페이지', label: 'p', hint: '페이지' },
  { value: '개', label: '개', hint: '개수' },
  { value: '%', label: '%', hint: '퍼센트' },
  { value: '', label: '없음', hint: '단위 없음' },
]

export function UnitPickerModal({ current, onPick, onClose }: Props) {
  useBackClose(true, onClose)
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'ff-unit-fade .15s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes ff-unit-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ff-unit-pop { from { transform: scale(.92) translateY(8px); opacity: 0 } to { transform: scale(1) translateY(0); opacity: 1 } }
      `}</style>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        overflow: 'hidden',
        animation: 'ff-unit-pop .2s ease-out',
      }}>
        <div style={{ background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 60%, #fff))', padding: '14px 20px', borderBottom: '1px solid var(--pl)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>📏 단위 선택</div>
        </div>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {UNITS.map((u) => {
            const active = u.value === current
            return (
              <button
                key={u.value || 'none'}
                onClick={() => { onPick(u.value); onClose() }}
                style={{
                  padding: '14px 8px',
                  borderRadius: 12,
                  border: '2px solid ' + (active ? 'var(--pink)' : '#eee'),
                  background: active ? 'var(--pl)' : '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: active ? 'var(--pink)' : 'var(--pd)' }}>{u.label}</span>
                {u.hint && <span style={{ fontSize: 10, color: '#888' }}>{u.hint}</span>}
              </button>
            )
          })}
        </div>
        <div style={{ padding: '0 16px 14px' }}>
          <button onClick={onClose} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
