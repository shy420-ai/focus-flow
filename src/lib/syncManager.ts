/**
 * Singleton Firestore sync manager.
 * Stores call queue() after persisting to localStorage.
 * Manager debounces and saves all stores' state to Firestore.
 * Remote snapshot updates are applied via hydrate callbacks.
 */
import { saveUserDoc, listenUserDoc, type UserDoc } from './firestore'
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

  // tasks/recurring localStorage write is handled by AppStore's
  // registerHydrate so the append-only merge with tombstones runs
  // consistently. Direct overwrite here would ignore deletes/adds done
  // locally before the hydrate landed.
  // drops localStorage write is handled by DropStore's registerHydrate so
  // tombstones are honored. Mirroring d.drops blindly here would resurrect
  // deleted ids on refresh.
  if (d.goals) {
    try { localStorage.setItem('ff_goals', JSON.stringify(d.goals)) } catch { /* ignore */ }
  }
  if (d.roadmap) {
    try { localStorage.setItem('ff_roadmap', JSON.stringify(d.roadmap)) } catch { /* ignore */ }
  }
  // habits localStorage write is handled by HabitStore's registerHydrate
  // so tombstones are honored. Mirroring d.habits blindly here would
  // resurrect deleted ids on the next refresh.
  if (patchedD.habitLogs) {
    try { localStorage.setItem('ff_habitLogs', JSON.stringify(patchedD.habitLogs)) } catch { /* ignore */ }
  }
  if (d.quickMemo !== undefined) {
    try { localStorage.setItem('ff_quickMemo', d.quickMemo as string) } catch { /* ignore */ }
  }
  // Friends: append-only on hydrate but tombstone-aware so removals stick.
  // Without tombstones, the first hydrate after a remove resurrected the
  // friend because the snapshot still contained them.
  if (Array.isArray(d.friends) && d.friends.length > 0) {
    try {
      const localRaw = localStorage.getItem('ff_friends')
      const localList: Array<{ uid: string; code?: string; name?: string }> = (() => {
        try { return localRaw ? JSON.parse(localRaw) : [] } catch { return [] }
      })()
      const tombstones: Set<string> = (() => {
        try { return new Set(JSON.parse(localStorage.getItem('ff_friend_tombstones') || '[]')) }
        catch { return new Set<string>() }
      })()
      const seen = new Set(localList.map((f) => f.uid))
      const merged = [...localList]
      for (const f of d.friends) {
        if (!f || typeof f !== 'object' || !('uid' in f)) continue
        const uid = (f as { uid: string }).uid
        if (seen.has(uid)) continue
        if (tombstones.has(uid)) continue
        merged.push(f)
        seen.add(uid)
      }
      localStorage.setItem('ff_friends', JSON.stringify(merged))
    } catch { /* ignore */ }
  }
  // med config / logs are now handled inside MedStore's registerHydrate
  // with merge logic that respects local state (especially important on
  // iOS Safari where backgrounding can drop pending writes).
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
