// Syncs lightweight profile bits (day mode + last activity timestamp) so
// friends can see how I'm doing without me explicitly sharing each piece.
import { queue, registerCollect, registerHydrate } from './syncManager'
import type { UserDoc } from './firestore'

const DAY_MODE_KEY = 'ff_day_mode'
const LAST_ACTIVE_KEY = 'ff_last_active'

function nowIso(): string {
  return new Date().toISOString()
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
