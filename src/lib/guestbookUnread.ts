// Tracks which guestbook entries the user hasn't seen yet.
// We compare entry.ts (timestamp) against ff_last_read_guestbook in localStorage.
import { useEffect, useState } from 'react'
import { useAppStore } from '../store/AppStore'
import { listenUserDoc } from './firestore'

const KEY = 'ff_last_read_guestbook'
const EVENT = 'ff-guestbook-read'

export function getLastReadTs(): number {
  const v = parseInt(localStorage.getItem(KEY) || '0')
  return Number.isFinite(v) ? v : 0
}

export function markGuestbookRead(): void {
  localStorage.setItem(KEY, String(Date.now()))
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function useGuestbookUnreadCount(): number {
  const uid = useAppStore((s) => s.uid)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0)
      return
    }

    function recompute(entries: Array<{ ts?: number; fromUid?: string }>) {
      const lastRead = getLastReadTs()
      const myUid = uid
      let unread = 0
      for (const e of entries) {
        if (!e.ts) continue
        if (e.fromUid === myUid) continue  // don't count my own posts
        if (e.ts > lastRead) unread++
      }
      setCount(unread)
    }

    const unsub = listenUserDoc(uid, (d) => {
      const gb = (d.guestbook as Array<{ ts?: number; fromUid?: string }>) || []
      recompute(gb)
    })

    function onRead() { setCount(0) }
    window.addEventListener(EVENT, onRead)

    return () => {
      unsub()
      window.removeEventListener(EVENT, onRead)
    }
  }, [uid])

  return count
}
