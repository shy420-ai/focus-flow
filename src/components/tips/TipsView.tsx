// ADHD wiki tab. Categories + tip cards; tap a card to see the full
// body in a modal.
import { useState, useEffect } from 'react'
import { CATEGORY_META, getCategoryTips, ADHD_TIPS, isTipNew } from '../../data/adhdTips'
import { TipDetailModal } from './TipDetailModal'
import { ArchiveSection } from './ArchiveSection'
import { loadBookmarks, toggleBookmark } from '../../lib/tipBookmarks'
import { loadDeleted, deleteTip, restoreTip } from '../../lib/tipDeleted'
import { getTipCountsBatch, type TipCounts } from '../../lib/tipFeedback'
import { isDevMode } from '../../lib/devMode'
import { showConfirm } from '../../lib/showConfirm'
import { tipCategoryIcon } from './tipCategoryIcons'
import type { AdhdTip, TipCategory } from '../../types/adhdTip'

const CATS: TipCategory[] = ['bookmarks', 'start', 'study', 'work', 'mood', 'record', 'social', 'body', 'sleep', 'archive']
const ACTIVE_KEY = 'ff_tips_active_cat'

function loadActive(): TipCategory {
  const v = localStorage.getItem(ACTIVE_KEY)
  return CATS.includes(v as TipCategory) ? (v as TipCategory) : 'start'
}

export function TipsView() {
  const [active, setActiveState] = useState<TipCategory>(loadActive)
  const setActive = (c: TipCategory) => {
    setActiveState(c)
    localStorage.setItem(ACTIVE_KEY, c)
  }
  const [selected, setSelected] = useState<AdhdTip | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks)
  const [deleted, setDeleted] = useState<string[]>(loadDeleted)
  const [counts, setCounts] = useState<Record<string, TipCounts>>({})
  const dev = isDevMode()
  // Dev mode sees deleted tips (greyed out) so they can restore. Regular
  // users get them filtered out.
  const showDeleted = dev
  const baseTips = active === 'bookmarks'
    ? ADHD_TIPS.filter((t) => bookmarks.includes(t.id))
    : getCategoryTips(active)
  const tips = showDeleted ? baseTips : baseTips.filter((t) => !deleted.includes(t.id))
  const meta = CATEGORY_META[active]

  useEffect(() => {
    function refreshBookmarks() { setBookmarks(loadBookmarks()) }
    function refreshDeleted() { setDeleted(loadDeleted()) }
    window.addEventListener('ff-tip-bookmarks-changed', refreshBookmarks)
    window.addEventListener('ff-tip-deleted-changed', refreshDeleted)
    return () => {
      window.removeEventListener('ff-tip-bookmarks-changed', refreshBookmarks)
      window.removeEventListener('ff-tip-deleted-changed', refreshDeleted)
    }
  }, [])

  // Fetch global counts (likes / comments / bookmarks) for the visible
  // tip cards whenever the visible set changes. One-shot read — refreshes
  // when category changes or when the user comes back to the modal.
  useEffect(() => {
    if (active === 'archive' || tips.length === 0) return
    let cancel = false
    const ids = tips.map((t) => t.id)
    getTipCountsBatch(ids).then((res) => { if (!cancel) setCounts((c) => ({ ...c, ...res })) }).catch(() => { /* offline ok */ })
    return () => { cancel = true }

  }, [active, tips.length])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)',
        borderRadius: 18,
        padding: '14px 18px',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>📚 ADHD 정보</div>
        <div style={{ fontSize: 11, color: '#888' }}>카테고리별로 정리된 팁 모음</div>
      </div>


      {/* 북마크 — 가로 풀너비 강조 바 */}
      {(() => {
        const bm = CATEGORY_META.bookmarks
        const on = active === 'bookmarks'
        return (
          <button
            onClick={() => setActive('bookmarks')}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1.5px solid ' + (on ? bm.color : '#eee'),
              background: on ? `color-mix(in srgb, ${bm.color} 16%, #fff)` : '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}
          >
            <span style={{ display: 'inline-flex', color: on ? bm.color : '#bbb' }}>
              {tipCategoryIcon('bookmarks')}
            </span>
            <span style={{ fontSize: 13, fontWeight: on ? 800 : 700, color: on ? 'var(--pd)' : '#666' }}>{bm.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 18, color: on ? bm.color : '#ccc', fontWeight: 700 }}>›</span>
          </button>
        )
      })()}

      {/* 카테고리 — 3 x 3 그리드 (북마크·archive 제외) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, marginBottom: 12,
      }}>
        {CATS.filter((c) => c !== 'bookmarks' && c !== 'archive').map((c) => {
          const m = CATEGORY_META[c]
          const on = active === c
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              style={{
                padding: '10px 6px', borderRadius: 12,
                border: '1.5px solid ' + (on ? m.color : '#eee'),
                background: on ? `color-mix(in srgb, ${m.color} 18%, #fff)` : '#fff',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ display: 'inline-flex', color: on ? m.color : '#bbb' }}>
                {tipCategoryIcon(c)}
              </span>
              <span style={{ fontSize: 11, fontWeight: on ? 800 : 600, color: on ? 'var(--pd)' : '#666' }}>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* 보관함 (archive) — 별도 작은 버튼 */}
      {(() => {
        const ar = CATEGORY_META.archive
        const on = active === 'archive'
        return (
          <button
            onClick={() => setActive('archive')}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10,
              border: '1.5px dashed ' + (on ? ar.color : '#ddd'),
              background: on ? `color-mix(in srgb, ${ar.color} 14%, #fff)` : '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12,
              fontSize: 11, fontWeight: 700, color: on ? ar.color : '#999',
            }}
          >
            <span>{tipCategoryIcon('archive')}</span>
            <span>{ar.label}</span>
          </button>
        )
      })()}

      {/* Active category header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
        <span style={{ display: 'inline-flex', color: meta.color }}>{tipCategoryIcon(active)}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>{meta.label}</span>
        {active !== 'archive' && (
          <span style={{ background: `color-mix(in srgb, ${meta.color} 25%, #fff)`, color: 'var(--pd)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
            {tips.length}개
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, color-mix(in srgb, var(--pl) 80%, #fff), transparent)' }} />
      </div>

      {/* Archive is user-content; tips are hardcoded curation. */}
      {active === 'archive' ? (
        <ArchiveSection />
      ) : tips.length === 0 ? (
        <div style={{ background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
          {active === 'bookmarks' ? (
            <>
              저장한 팁이 없어<br />
              <span style={{ fontSize: 10, color: '#bbb' }}>
                팁 카드 우측 ⭐ 눌러 북마크하기
              </span>
            </>
          ) : (
            <>
              아직 이 카테고리엔 팁이 없어<br />
              <span style={{ fontSize: 10, color: '#bbb' }}>
                (저작권 이슈 정리 후 시드 콘텐츠 추가 예정)
              </span>
            </>
          )}
        </div>
      ) : (
        tips.map((t) => {
          const cardMeta = CATEGORY_META[t.category]
          const bookmarked = bookmarks.includes(t.id)
          const isDel = deleted.includes(t.id)
          return (
            <div
              key={t.id}
              onClick={() => { if (!isDel) setSelected(t) }}
              style={{ position: 'relative', background: '#fff', borderRadius: 12, padding: '12px 38px 12px 14px', marginBottom: 6, border: '1px solid #f5f5f5', cursor: isDel ? 'default' : 'pointer', fontFamily: 'inherit', borderLeft: `3px solid ${cardMeta.color}`, transition: 'transform .15s, box-shadow .15s', opacity: isDel ? 0.45 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                {isDel && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#bbb', padding: '2px 6px', borderRadius: 99, letterSpacing: 0.3 }}>삭제됨</span>
                )}
                {!isDel && isTipNew(t) && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'var(--pink)', padding: '2px 6px', borderRadius: 99, letterSpacing: 0.3 }}>NEW</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)', textDecoration: isDel ? 'line-through' : 'none' }}>{t.title}</span>
              </div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{t.summary}</div>
              {(() => {
                const c = counts[t.id]
                if (!c || (c.bookmarks === 0 && c.comments === 0)) return null
                return (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: '#aaa', fontWeight: 600 }}>
                    {c.bookmarks > 0 && <span>🔖 {c.bookmarks}</span>}
                    {c.comments > 0 && <span>💬 {c.comments}</span>}
                  </div>
                )
              })()}
              <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0 }}>
                {dev && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (isDel) {
                        restoreTip(t.id)
                        return
                      }
                      const ok = await showConfirm(`이 팁을 삭제할까?\n\n${t.title}`)
                      if (ok) deleteTip(t.id)
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, lineHeight: 1, color: isDel ? '#56C6A0' : '#E24B4A' }}
                    aria-label={isDel ? '복구' : '삭제'}
                  >{isDel ? '↺' : '🗑'}</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(t.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1, color: bookmarked ? '#F5B91E' : '#ddd' }}
                  aria-label={bookmarked ? '북마크 해제' : '북마크'}
                >{bookmarked ? '★' : '☆'}</button>
              </div>
            </div>
          )
        })
      )}

      {selected && <TipDetailModal tip={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
