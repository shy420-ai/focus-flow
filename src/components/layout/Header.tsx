import { useState, useEffect } from 'react'
import { useNow } from '../../hooks/useNow'
import { pad } from '../../lib/date'
import { useAppStore } from '../../store/AppStore'
import { dateLabel } from '../../lib/date'
import { SettingsPopup } from './SettingsPopup'
import { FriendsPanel } from '../friends/FriendsPanel'
import { useUnreadGuestbook, markGuestbookRead } from '../../lib/guestbookUnread'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return '방금'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(ts).toISOString().slice(5, 10)
}

export function Header() {
  const now = useNow()
  const curDate = useAppStore((s) => s.curDate)
  const [settingsOpen, setSettingsOpen] = useState(() => sessionStorage.getItem('ff_modal_settings') === '1')
  const [friendsOpen, setFriendsOpen] = useState(() => sessionStorage.getItem('ff_modal_friends') === '1')
  const [bellOpen, setBellOpen] = useState(false)
  const unreadList = useUnreadGuestbook()
  const setCurView = useAppStore((s) => s.setCurView)

  function openFromBell() {
    setBellOpen(false)
    setCurView('friends')
    markGuestbookRead()
  }


  useEffect(() => {
    if (settingsOpen) sessionStorage.setItem('ff_modal_settings', '1')
    else sessionStorage.removeItem('ff_modal_settings')
  }, [settingsOpen])

  useEffect(() => {
    if (friendsOpen) sessionStorage.setItem('ff_modal_friends', '1')
    else sessionStorage.removeItem('ff_modal_friends')
  }, [friendsOpen])

  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())

  return (
    <div className="header">
      <div>
        <h1>
          focus <span>flow</span>
        </h1>
        <div className="today-label">{dateLabel(curDate)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => location.reload()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff', opacity: .6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a6 6 0 1 0 5.29 3.15l1.42-.82A7.5 7.5 0 1 1 8 .5V2z"/>
            <path d="M7 0l2.5 2.5L7 5V0z"/>
          </svg>
        </button>
        <button
          onClick={() => setBellOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff', opacity: .8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          aria-label="알림"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {unreadList.length > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, background: '#E24B4A', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--pd)' }}>
              {unreadList.length > 9 ? '9+' : unreadList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSettingsOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff', opacity: .8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
          </svg>
        </button>
        <div className="clock">{hours}:{minutes}</div>
      </div>
      {bellOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setBellOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9100 }}
        >
          <div style={{ position: 'absolute', top: 56, right: 12, width: 280, maxWidth: '92vw', background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.18)', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>💌 새 방명록 {unreadList.length}개</span>
              {unreadList.length > 0 && (
                <button
                  onClick={markGuestbookRead}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                >모두 읽음</button>
              )}
            </div>
            {unreadList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#bbb', fontSize: 11 }}>
                새 방명록이 없어
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {unreadList.slice(0, 10).map((e, i) => (
                  <button
                    key={i}
                    onClick={openFromBell}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: '#fff', border: 'none', borderBottom: '1px solid #fafafa', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>{e.from}</span>
                      <span style={{ fontSize: 9, color: '#bbb' }}>{relativeTime(e.ts)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {e.text}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {unreadList.length > 0 && (
              <button
                onClick={openFromBell}
                style={{ display: 'block', width: '100%', padding: '10px', background: 'var(--pl)', border: 'none', color: 'var(--pd)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >👥 친구 탭 → 내 방명록 →</button>
            )}
          </div>
        </div>
      )}
      {settingsOpen && (
        <SettingsPopup
          onClose={() => setSettingsOpen(false)}
          onFriendsOpen={() => setFriendsOpen(true)}
        />
      )}
      {friendsOpen && <FriendsPanel onClose={() => setFriendsOpen(false)} />}
    </div>
  )
}
