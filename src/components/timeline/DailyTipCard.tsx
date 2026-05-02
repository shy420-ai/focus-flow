// 일간 탭 상단의 "오늘의 팁" 카드. 시간대(아침/낮/저녁/밤)에 따라
// 자동으로 바뀌고, 같은 날·같은 시간대에선 같은 팁을 보여줘서 새로고침
// 해도 안정적. 카드 누르면 정보 탭의 상세 모달로 직행.
import { useState, useEffect } from 'react'
import { pickDailyTip, pickNextDailyTip, currentPeriod, type DailyPrompt, type DailyPeriod } from '../../lib/dailyTip'
import { getTip } from '../../data/adhdTips'
import { TipDetailModal } from '../tips/TipDetailModal'

const PERIOD_META: Record<DailyPeriod, { emoji: string; label: string; gradient: string; accent: string }> = {
  morning: { emoji: '🌅', label: '아침', gradient: 'linear-gradient(135deg, #FFE9D9 0%, #FFF6EE 100%)', accent: '#E8A87C' },
  day:     { emoji: '🌞', label: '낮',  gradient: 'linear-gradient(135deg, #FFF6D8 0%, #FFFCEB 100%)', accent: '#E8B547' },
  evening: { emoji: '🌙', label: '저녁', gradient: 'linear-gradient(135deg, #FCE4EC 0%, #FFF5F7 100%)', accent: 'var(--pink)' },
  night:   { emoji: '🌚', label: '밤',  gradient: 'linear-gradient(135deg, #E0DFFF 0%, #F4F3FF 100%)', accent: '#9B7BB5' },
}

export function DailyTipCard() {
  const [prompt, setPrompt] = useState<DailyPrompt | null>(() => pickDailyTip())
  const [openTipId, setOpenTipId] = useState<string | null>(null)

  // Re-pick on day-roll or period change so people who keep the tab
  // open through 9:59 → 10:00 see the next contextual tip.
  useEffect(() => {
    const id = setInterval(() => {
      const next = pickDailyTip()
      setPrompt((cur) => (cur?.tipId === next?.tipId ? cur : next))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!prompt) return null
  const tip = getTip(prompt.tipId)
  const period = currentPeriod()
  const meta = PERIOD_META[period]

  return (
    <>
      <div
        style={{
          margin: '0 0 16px',
          background: meta.gradient,
          border: '1.5px solid ' + meta.accent,
          borderRadius: 16,
          fontFamily: 'inherit',
          overflow: 'hidden',
          boxShadow: '0 2px 12px color-mix(in srgb, ' + meta.accent + ' 18%, transparent)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,.04)' }}>
          <span style={{ fontSize: 18 }}>{meta.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: meta.accent, letterSpacing: 0.3 }}>
            {meta.label} · 오늘의 팁
          </span>
          <button
            onClick={() => setPrompt(pickNextDailyTip(prompt.tipId))}
            aria-label="다른 팁 보기"
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.5)', border: '1px solid rgba(0,0,0,.06)', color: '#666', borderRadius: 99, width: 26, height: 26, cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >↻</button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pd)', marginBottom: 10, lineHeight: 1.4 }}>
            {prompt.prompt}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: tip ? 10 : 0 }}>
            {prompt.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                <span style={{ color: meta.accent, fontWeight: 800, flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{b}</span>
              </div>
            ))}
          </div>
          {tip && (
            <button
              onClick={() => setOpenTipId(prompt.tipId)}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                background: meta.accent,
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: 0.3,
              }}
            >
              💡 더 자세히 보기
            </button>
          )}
        </div>
      </div>
      {openTipId && tip && (
        <TipDetailModal tip={tip} onClose={() => setOpenTipId(null)} />
      )}
    </>
  )
}
