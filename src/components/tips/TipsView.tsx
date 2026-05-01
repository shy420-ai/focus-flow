// ADHD wiki tab — dev-mode only for now. Category shell built first;
// tip content + detail modal land in a follow-up.
import { useState } from 'react'
import { CATEGORY_META, getCategoryTips } from '../../data/adhdTips'
import type { TipCategory } from '../../types/adhdTip'

const CATS: TipCategory[] = ['start', 'study', 'mood', 'record', 'social', 'body']

export function TipsView() {
  const [active, setActive] = useState<TipCategory>('start')
  const tips = getCategoryTips(active)
  const meta = CATEGORY_META[active]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)',
        borderRadius: 18,
        padding: '14px 18px',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>📚 ADHD 노하우</div>
        <div style={{ fontSize: 11, color: '#888' }}>카테고리별로 정리된 팁 모음</div>
      </div>

      {/* Category chips — horizontal scroll */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {CATS.map((c) => {
          const m = CATEGORY_META[c]
          const on = active === c
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: 99,
                border: '1.5px solid ' + (on ? m.color : '#eee'),
                background: on ? `color-mix(in srgb, ${m.color} 18%, #fff)` : '#fff',
                color: on ? 'var(--pd)' : '#666',
                fontSize: 12,
                fontWeight: on ? 700 : 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 4 }}>{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Active category header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 2px' }}>
        <span style={{ fontSize: 13 }}>{meta.emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>{meta.label}</span>
        <span style={{ background: `color-mix(in srgb, ${meta.color} 25%, #fff)`, color: 'var(--pd)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
          {tips.length}개
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, color-mix(in srgb, var(--pl) 80%, #fff), transparent)' }} />
      </div>

      {/* Tip cards (empty placeholder for now) */}
      {tips.length === 0 ? (
        <div style={{ background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
          아직 이 카테고리엔 팁이 없어<br />
          <span style={{ fontSize: 10, color: '#bbb' }}>
            (저작권 이슈 정리 후 시드 콘텐츠 추가 예정)
          </span>
        </div>
      ) : (
        tips.map((t) => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 6, border: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{t.summary}</div>
          </div>
        ))
      )}
    </div>
  )
}
