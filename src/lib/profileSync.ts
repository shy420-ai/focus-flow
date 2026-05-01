// Syncs lightweight profile bits (day mode + last activity timestamp) so
// friends can see how I'm doing without me explicitly sharing each piece.
import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

const DAY_MODE_KEY = 'ff_day_mode'
const LAST_ACTIVE_KEY = 'ff_last_active'

function nowIso(): string {
  return new Date().toISOString()
}

// Deterministic 6-char share code derived from uid. Same as the one in
// FriendsPanel — kept here so we can include it in collect at app start
// without waiting for the user to open the friends tab.
function shareCodeFromUid(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) - h) + uid.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

let _myUid: string | null = null
export function setMyUid(uid: string | null): void {
  _myUid = uid
}

export function bumpLastActive(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, nowIso())
  queue()
}

registerCollect(() => {
  const out: Partial<UserDoc> = {}
  const dayMode = localStorage.getItem(DAY_MODE_KEY)
  if (dayMode === 'low' || dayMode === 'normal' || dayMode === 'good') {
    out.dayMode = dayMode
  }
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY)
  if (lastActive) out.lastActiveAt = lastActive
  // Always publish my shareCode so friends can find me by it. Without
  // this, users who never open the friends tab are unfindable — a
  // common hangup when one half of the pair is testing.
  if (_myUid) out.shareCode = shareCodeFromUid(_myUid)
  return out
})

registerHydrate((d: UserDoc) => {
  if (d.dayMode === 'low' || d.dayMode === 'normal' || d.dayMode === 'good') {
    const cur = localStorage.getItem(DAY_MODE_KEY)
    if (cur !== d.dayMode) localStorage.setItem(DAY_MODE_KEY, d.dayMode)
  }
  // lastActiveAt is per-device; never overwrite ours from remote — would make
  // the indicator say I'm active when actually the other device is.
})
