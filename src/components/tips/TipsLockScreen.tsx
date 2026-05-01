import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { applyOverride, getTipsViewedToday } from '../../lib/tipsViewLimit'

interface Props {
  onUnlock: () => void
}

const WAIT_SEC = 30

export function TipsLockScreen({ onUnlock }: Props) {
  const setCurView = useAppStore((s) => s.setCurView)
  const [waiting, setWaiting] = useState(false)
  const [remaining, setRemaining] = useState(WAIT_SEC)

  useEffect(() => {
    if (!waiting || remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [waiting, remaining])

  function unlock() {
    applyOverride()
    onUnlock()
  }

  function startWait() {
    setWaiting(true)
    setRemaining(WAIT_SEC)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--pl) 70%, #fff) 0%, #fff 100%)',
      borderRadius: 18,
      padding: '32px 22px',
      textAlign: 'center',
      border: '1.5px solid var(--pink)',
    }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🌱</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--pd)', marginBottom: 8 }}>잠깐, 충분히 알았어</div>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 22 }}>
        오늘 {getTipsViewedToday()}개 팁 봤어.<br />
        지금은 1개라도 적용해볼 시간 ✨<br />
        <span style={{ fontSize: 10, color: '#aaa' }}>
          공부법 검색이 공부 자체가 되는 함정 — ADHD 흔한 패턴
        </span>
      </div>

      <button
        onClick={() => setCurView('tl')}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, boxShadow: '0 4px 14px color-mix(in srgb, var(--pink) 35%, transparent)' }}
      >→ 일간으로 가서 행동하기</button>

      {!waiting ? (
        <button
          onClick={startWait}
          style={{ width: '100%', padding: 10, background: 'none', border: '1px solid #eee', color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10 }}
        >그래도 더 볼래 (30초 대기)</button>
      ) : remaining > 0 ? (
        <button
          disabled
          style={{ width: '100%', padding: 10, background: '#fafafa', border: '1px solid #eee', color: '#aaa', fontSize: 11, fontFamily: 'inherit', borderRadius: 10, cursor: 'not-allowed' }}
        >⏱ {remaining}초만 기다려봐</button>
      ) : (
        <button
          onClick={unlock}
          style={{ width: '100%', padding: 10, background: '#fff', border: '1.5px solid var(--pink)', color: 'var(--pink)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10 }}
        >+3개 더 보기 (기다림 끝)</button>
      )}

      <div style={{ marginTop: 16, fontSize: 9, color: '#bbb', lineHeight: 1.6 }}>
        자정에 카운트 자동 리셋 · 한도는 설정에서 조정 가능
      </div>
    </div>
  )
}
