// Tracks which guestbook entries the user hasn't seen yet.
// We compare entry.ts (timestamp) against ff_last_read_guestbook in localStorage.
import { useEffect, useState } from 'react'
import { useAppStore } from '../store/AppStore'
import { listenUserDoc } from './firestore'

export interface UnreadGuestbookEntry {
  from: string        // nickname
  text: string
  ts: number
  fromUid?: string
}

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
  return useUnreadGuestbook().length
}

export function useUnreadGuestbook(): UnreadGuestbookEntry[] {
  const uid = useAppStore((s) => s.uid)
  const [unread, setUnread] = useState<UnreadGuestbookEntry[]>([])

  useEffect(() => {
    if (!uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnread([])
      return
    }

    function recompute(entries: Array<{ ts?: number; fromUid?: string; from?: string; text?: string }>) {
      const lastRead = getLastReadTs()
      const myUid = uid
      const list: UnreadGuestbookEntry[] = []
      for (const e of entries) {
        if (!e.ts) continue
        if (e.fromUid === myUid) continue
        if (e.ts > lastRead) {
          list.push({ from: e.from ?? '익명', text: e.text ?? '', ts: e.ts, fromUid: e.fromUid })
        }
      }
      // Newest first
      list.sort((a, b) => b.ts - a.ts)
      setUnread(list)
    }

    const unsub = listenUserDoc(uid, (d) => {
      const gb = (d.guestbook as Array<{ ts?: number; fromUid?: string; from?: string; text?: string }>) || []
      recompute(gb)
    })

    function onRead() { setUnread([]) }
    window.addEventListener(EVENT, onRead)

    return () => {
      unsub()
      window.removeEventListener(EVENT, onRead)
    }
  }, [uid])

  return unread
}
