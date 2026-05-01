import { useBackClose } from '../../hooks/useBackClose'
import { CATEGORY_META } from '../../data/adhdTips'
import type { AdhdTip } from '../../types/adhdTip'

interface Props {
  tip: AdhdTip
  onClose: () => void
}

export function TipDetailModal({ tip, onClose }: Props) {
  useBackClose(true, onClose)
  const meta = CATEGORY_META[tip.category]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>{meta.emoji}</span>
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pd)', marginBottom: 6 }}>{tip.title}</div>
          <div style={{ fontSize: 12, color: meta.color, fontWeight: 600, marginBottom: 14 }}>{tip.summary}</div>

          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {tip.body}
          </div>

          {tip.tags && tip.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {tip.tags.map((t) => (
                <span key={t} style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>#{t}</span>
              ))}
            </div>
          )}

          {tip.source && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#fafafa', borderRadius: 10, fontSize: 10, color: '#888', borderLeft: '3px solid #eee' }}>
              <div style={{ fontWeight: 700, color: '#666', marginBottom: 2 }}>참고</div>
              {tip.source}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 9, color: '#bbb', lineHeight: 1.6, textAlign: 'center' }}>
            ※ 정보·교육 목적. 의료적 조언 아님 — 진단·치료는 전문의와.
          </div>
        </div>
      </div>
    </div>
  )
}
