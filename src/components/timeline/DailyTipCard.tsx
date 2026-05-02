// 일간 탭 상단의 "오늘의 팁" 카드. 시간대(아침/낮/저녁/밤)에 따라
// 자동으로 바뀌고, 같은 날·같은 시간대에선 같은 팁을 보여줘서 새로고침
// 해도 안정적. 카드 누르면 정보 탭의 상세 모달로 직행.
import { useState, useEffect } from 'react'
import { pickDailyTip, pickNextDailyTip, type DailyPrompt } from '../../lib/dailyTip'
import { getTip } from '../../data/adhdTips'
import { TipDetailModal } from '../tips/TipDetailModal'

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

  return (
    <>
      <div
        onClick={() => { if (tip) setOpenTipId(prompt.tipId) }}
        style={{
          margin: '0 0 16px',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)',
          border: '1.5px solid color-mix(in srgb, var(--pink) 35%, transparent)',
          borderRadius: 12,
          cursor: tip ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', flex: 1, lineHeight: 1.4 }}>{prompt.prompt}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setPrompt(pickNextDailyTip(prompt.tipId)) }}
            aria-label="다른 팁 보기"
            style={{ background: 'transparent', border: 'none', color: '#bbb', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 13, flexShrink: 0, padding: 0 }}
          >↻</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--pd)', fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>
          → {prompt.oneLiner}
        </div>
        {tip && (
          <div style={{ fontSize: 10, color: 'var(--pink)', fontWeight: 700, marginTop: 4, textAlign: 'right' }}>
            더 자세히 →
          </div>
        )}
      </div>
      {openTipId && tip && (
        <TipDetailModal tip={tip} onClose={() => setOpenTipId(null)} />
      )}
    </>
  )
}
