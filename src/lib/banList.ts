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

// 하드코딩 admin share code — Firebase Console에 들어가지 않고도 운영자
// 권한이 즉시 인식되도록. 6자리 share code 는 uid 의 단방향 해시이므로
// uid를 직접 노출하지 않으면서도 식별 가능.
const HARDCODED_ADMIN_SHARE_CODES = ['A9UPVW']

function uidToShareCode(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) { h = ((h << 5) - h) + uid.charCodeAt(i); h |= 0 }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

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
  if (HARDCODED_ADMIN_SHARE_CODES.includes(uidToShareCode(uid))) return true
  const admins = await loadAdmins()
  return admins.includes(uid)
}

// Sync version for render — true if (a) uid 의 share code 가 하드코딩
// admin 목록에 있거나 (b) admins/list 로드된 캐시에 포함될 때.
// (a) 는 Firebase Console 설정 없이도 즉시 동작.
export function isAdminCached(uid: string | null): boolean {
  if (!uid) return false
  if (HARDCODED_ADMIN_SHARE_CODES.includes(uidToShareCode(uid))) return true
  if (!_adminUids) return false
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
