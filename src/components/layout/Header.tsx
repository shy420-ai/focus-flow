import { useState, useEffect } from 'react'
import { useNow } from '../../hooks/useNow'
import { pad } from '../../lib/date'
import { useAppStore } from '../../store/AppStore'
import { dateLabel } from '../../lib/date'
import { SettingsPopup } from './SettingsPopup'
import { FriendsPanel } from '../friends/FriendsPanel'
import { useGuestbookUnreadCount } from '../../lib/guestbookUnread'

export function Header() {
  const now = useNow()
  const curDate = useAppStore((s) => s.curDate)
  const [settingsOpen, setSettingsOpen] = useState(() => sessionStorage.getItem('ff_modal_settings') === '1')
  const [friendsOpen, setFriendsOpen] = useState(() => sessionStorage.getItem('ff_modal_friends') === '1')
  const unreadGuestbook = useGuestbookUnreadCount()

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
          onClick={() => setSettingsOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff', opacity: .8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
          </svg>
          {unreadGuestbook > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, background: '#E24B4A', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--pd)' }}>
              {unreadGuestbook > 9 ? '9+' : unreadGuestbook}
            </span>
          )}
        </button>
        <div className="clock">{hours}:{minutes}</div>
      </div>
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
