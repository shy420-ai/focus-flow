// Temporary debug helper. Open DevTools console and run:
//   await window.__ffDebugCode('EK581E')
// to see whether any user's stored shareCode or hash-derived code matches.
// Returns and console.tables the matches.
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { getFirebaseApp } from './firebase'

function codeFromUid(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) - h) + uid.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

interface DebugRow {
  uidPrefix: string
  hashCode: string
  storedShareCode: string
  nickname: string
  hasLastActive: boolean
}

declare global {
  interface Window {
    __ffDebugCode: (code: string) => Promise<DebugRow[]>
    __ffDebugAllCodes: () => Promise<DebugRow[]>
  }
}

export function installFriendCodeDebug(): void {
  const lookup = async (codeRaw?: string): Promise<DebugRow[]> => {
    const db = getFirestore(getFirebaseApp())
    const target = codeRaw ? codeRaw.toUpperCase() : null

    if (target) {
      // Direct query first — fast path.
      const q = query(collection(db, 'users'), where('shareCode', '==', target))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const rows: DebugRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            uidPrefix: d.id.slice(0, 8),
            hashCode: codeFromUid(d.id),
            storedShareCode: (data.shareCode as string) || '(none)',
            nickname: (data.nickname as string) || '(no nickname)',
            hasLastActive: !!data.lastActiveAt,
          }
        })
        console.table(rows)
        return rows
      }
    }

    // Full scan fallback. Useful when target's hashCode is right but no
    // stored shareCode (i.e. hasn't synced since the auto-publish fix).
    const all = await getDocs(collection(db, 'users'))
    const rows: DebugRow[] = all.docs.map((d) => {
      const data = d.data() as Record<string, unknown>
      return {
        uidPrefix: d.id.slice(0, 8),
        hashCode: codeFromUid(d.id),
        storedShareCode: (data.shareCode as string) || '(none)',
        nickname: (data.nickname as string) || '(no nickname)',
        hasLastActive: !!data.lastActiveAt,
      }
    })
    const filtered = target ? rows.filter((r) => r.hashCode === target || r.storedShareCode === target) : rows
    console.table(filtered.length ? filtered : rows)
    return filtered.length ? filtered : rows
  }

  window.__ffDebugCode = (code: string) => lookup(code)
  window.__ffDebugAllCodes = () => lookup()
}
