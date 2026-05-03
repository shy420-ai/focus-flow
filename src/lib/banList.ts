// Permanent app-wide ban list. Admin (araha) can ban any uid; banned
// users see a fullscreen lock screen instead of the app and can never
// post again.
//
// Firestore schema:
//   /admins/list      { uids: string[] }   — single doc, ~5 uids
//   /banned/{uid}     { reason, ts, by }
//
// Admin uids are loaded once at startup and cached. Ban check on app
// open is a single getDoc.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb } from './firestore'

let _adminUids: string[] | null = null
let _adminLoading: Promise<string[]> | null = null

async function loadAdmins(): Promise<string[]> {
  if (_adminUids) return _adminUids
  if (_adminLoading) return _adminLoading
  _adminLoading = (async () => {
    try {
      const db = getDb()
      const snap = await getDoc(doc(db, 'admins', 'list'))
      const uids = snap.exists() ? ((snap.data() as { uids?: string[] }).uids ?? []) : []
      _adminUids = uids
      return uids
    } catch (e) {
      console.error('loadAdmins failed', e)
      _adminUids = []
      return []
    } finally {
      _adminLoading = null
    }
  })()
  return _adminLoading
}

export async function isAdmin(uid: string | null): Promise<boolean> {
  if (!uid) return false
  const admins = await loadAdmins()
  return admins.includes(uid)
}

// Sync version for render — only true after loadAdmins() has resolved at
// least once. Use isAdmin() to await on first check.
export function isAdminCached(uid: string | null): boolean {
  if (!uid || !_adminUids) return false
  return _adminUids.includes(uid)
}

// Pre-load for instant sync checks later
export function primeAdminCache(): void {
  loadAdmins().catch(() => { /* ignore */ })
}

export interface BanRecord {
  reason: string
  ts: number
  by: string
}

export async function isBanned(uid: string | null): Promise<BanRecord | null> {
  if (!uid) return null
  try {
    const db = getDb()
    const snap = await getDoc(doc(db, 'banned', uid))
    if (snap.exists()) return snap.data() as BanRecord
    return null
  } catch (e) {
    console.error('isBanned check failed', e)
    return null
  }
}

export async function banUser(targetUid: string, reason: string, byUid: string): Promise<void> {
  const db = getDb()
  await setDoc(doc(db, 'banned', targetUid), {
    reason,
    ts: Date.now(),
    by: byUid,
  })
}
