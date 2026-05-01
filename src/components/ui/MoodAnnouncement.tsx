// One-time popup announcing the new 일기 tab. Shows on or after
// SHOW_FROM, dismissed forever once the user closes it.
import { useState } from 'react'
import { useAppStore } from '../../store/AppStore'

const SEEN_KEY = 'ff_mood_announce_v1_seen'
const SHOW_FROM = '2026-05-02'  // YYYY-MM-DD

function shouldShowInitially(): boolean {
  if (localStorage.getItem(SEEN_KEY) === '1') return false
  const today = new Date().toISOString().slice(0, 10)
  return today >= SHOW_FROM
}

export function MoodAnnouncement() {
  const [show, setShow] = useState<boolean>(shouldShowInitially)
  const setCurView = useAppStore((s) => s.setCurView)

  function dismiss() {
    localStorage.setItem(SEEN_KEY, '1')
    setShow(false)
  }

  function openTab() {
    localStorage.setItem(SEEN_KEY, '1')
    setShow(false)
    setCurView('mood')
  }

  if (!show) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)', zIndex: 9700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #fff 0%, color-mix(in srgb, var(--pl) 55%, #fff) 100%)',
        borderRadius: 22,
        padding: '32px 24px 24px',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 88, opacity: .12, transform: 'rotate(15deg)' }}>💝</div>
        <div style={{ fontSize: 44, marginBottom: 10 }}>💝</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--pd)', marginBottom: 8 }}>새 탭이 생겼어 — 일기</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 22 }}>
          그날 기분이 어땠는지 가볍게 적는 곳.<br />
          빈칸만 채우면 되니까 부담 없어.<br /><br />
          🎵 음악 틀어놓고 쓸 수 있어 (내 mp3도 OK)<br />
          📊 자주 느끼는 감정이랑 생각 패턴 자동 정리<br />
          ⏱ 5분이면 끝, 길게 쓰라고 안 함
        </div>
        <button
          onClick={openTab}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, boxShadow: '0 4px 14px color-mix(in srgb, var(--pink) 35%, transparent)' }}
        >지금 일기 써보기 →</button>
        <button
          onClick={dismiss}
          style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >나중에</button>
      </div>
    </div>
  )
}
