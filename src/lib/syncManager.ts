/**
 * Singleton Firestore sync manager.
 * Stores call queue() after persisting to localStorage.
 * Manager debounces and saves all stores' state to Firestore.
 * Remote snapshot updates are applied via hydrate callbacks.
 */
import { saveUserDoc, listenUserDoc, type UserDoc } from './firestore'
import { migrateBlocks } from './migration'
import type { Unsubscribe } from 'firebase/firestore'

let _uid: string | null = null
let _skipRemote = false
let _saveTimer: ReturnType<typeof setTimeout> | null = null
let _unsub: Unsubscribe | null = null

// Callbacks to hydrate stores from Firestore data
type HydrateCallback = (doc: UserDoc) => void
const _hydrateCallbacks: HydrateCallback[] = []

// Callbacks to collect store data for saving
type CollectCallback = () => Partial<UserDoc>
const _collectCallbacks: CollectCallback[] = []

export function registerHydrate(cb: HydrateCallback) {
  _hydrateCallbacks.push(cb)
}

export function registerCollect(cb: CollectCallback) {
  _collectCallbacks.push(cb)
}

export function queue() {
  if (!_uid || _skipRemote) return
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(doSave, 1500)
}

// Bypass the debounce and push everything now. Returns when the write resolves.
// Intentionally ignores _skipRemote — that flag exists to prevent queue() echo
// during hydrate, but flushSync is user-initiated (e.g. opening the leaderboard)
// and should always succeed in pushing local state.
export async function flushSync(): Promise<void> {
  if (!_uid) return
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null }
  await doSave()
}

async function doSave() {
  if (!_uid) return
  const data: UserDoc = {}
  for (const cb of _collectCallbacks) {
    Object.assign(data, cb())
  }
  try {
    await saveUserDoc(_uid, data)
  } catch (err) {
    // Surface to the console so we can debug stuck writes; the queue() path
    // doesn't have a UI affordance, so this stays a console-only signal.
    console.error('[sync] save failed', err)
  }
}

function migrateHabitLogs(raw: unknown): Record<string, Record<string, boolean>> {
  const logs = raw as Record<string, Record<string, boolean> | string[]>
  const migrated: Record<string, Record<string, boolean>> = {}
  Object.entries(logs).forEach(([date, val]) => {
    if (Array.isArray(val)) {
      migrated[date] = {}
      ;(val as string[]).forEach((id) => { migrated[date][String(id)] = true })
    } else {
      migrated[date] = val as Record<string, boolean>
    }
  })
  return migrated
}

function applyRemote(d: UserDoc) {
  _skipRemote = true

  // Migrate habitLogs BEFORE hydrate callbacks so stores get correct format
  const patchedD = { ...d }
  if (d.habitLogs) {
    patchedD.habitLogs = migrateHabitLogs(d.habitLogs)
  }

  for (const cb of _hydrateCallbacks) {
    cb(patchedD)
  }

  // Apply to localStorage
  if (d.tasks) {
    const migrated = migrateBlocks(d.tasks)
    try { localStorage.setItem('ff_v3', JSON.stringify(migrated)) } catch { /* ignore */ }
  }
  if (d.recurring) {
    try { localStorage.setItem('ff_recurring', JSON.stringify(d.recurring)) } catch { /* ignore */ }
  }
  if (d.drops) {
    try { localStorage.setItem('ff_drops', JSON.stringify(d.drops)) } catch { /* ignore */ }
  }
  if (d.goals) {
    try { localStorage.setItem('ff_goals', JSON.stringify(d.goals)) } catch { /* ignore */ }
  }
  if (d.roadmap) {
    try { localStorage.setItem('ff_roadmap', JSON.stringify(d.roadmap)) } catch { /* ignore */ }
  }
  if (d.habits) {
    try { localStorage.setItem('ff_habits', JSON.stringify(d.habits)) } catch { /* ignore */ }
  }
  if (patchedD.habitLogs) {
    try { localStorage.setItem('ff_habitLogs', JSON.stringify(patchedD.habitLogs)) } catch { /* ignore */ }
  }
  if (d.quickMemo !== undefined) {
    try { localStorage.setItem('ff_quickMemo', d.quickMemo as string) } catch { /* ignore */ }
  }
  if (Array.isArray(d.friends) && d.friends.length > 0) {
    try { localStorage.setItem('ff_friends', JSON.stringify(d.friends)) } catch { /* ignore */ }
  }
  if (d.medConfig !== undefined) {
    try { localStorage.setItem('ff_med_config', JSON.stringify(d.medConfig)) } catch { /* ignore */ }
  }
  if (d.medLogs) {
    try { localStorage.setItem('ff_med_logs', JSON.stringify(d.medLogs)) } catch { /* ignore */ }
  }
  if (d.mandala) {
    try { localStorage.setItem('ff_mandala', JSON.stringify(d.mandala)) } catch { /* ignore */ }
  }
  // metrics/metricLogs passthrough (features not implemented in React but preserve data)
  if (d.metrics) {
    try { localStorage.setItem('ff_metrics', JSON.stringify(d.metrics)) } catch { /* ignore */ }
  }
  if (d.metricLogs) {
    try { localStorage.setItem('ff_metricLogs', JSON.stringify(d.metricLogs)) } catch { /* ignore */ }
  }
  setTimeout(() => { _skipRemote = false }, 1000)
}

export function startSync(uid: string) {
  _uid = uid
  // Listen for remote changes
  if (_unsub) _unsub()
  _unsub = listenUserDoc(uid, (d) => {
    if (_skipRemote) return
    applyRemote(d)
    // Trigger a re-render notification so React stores re-read from localStorage
    window.dispatchEvent(new CustomEvent('ff-remote-sync', { detail: d }))
  })
}

export function stopSync() {
  if (_unsub) { _unsub(); _unsub = null }
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null }
  _uid = null
  _skipRemote = false
}
