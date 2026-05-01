import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Block } from '../types/block'
import type { RecurringTask } from '../types/recurring'
import { readJSON, writeJSON } from '../lib/localStorage'
import { migrateBlocks } from '../lib/migration'
import { todayStr } from '../lib/date'
import { freeSlot } from '../lib/recurring'
import { nid } from '../lib/id'
import { queue, registerCollect, registerHydrate } from '../lib/syncManager'
import type { UserDoc } from '../lib/firestore'

export type CurView = 'tl' | 'week' | 'habit' | 'goal' | 'drop' | 'cal' | 'stats' | 'friends' | 'mood' | 'tips'

interface AppState {
  blocks: Block[]
  uid: string | null
  displayName: string | null
  skipLogin: boolean
  curDate: string
  curView: CurView
  recurring: RecurringTask[]
  calY: number
  calM: number
}

interface AppActions {
  addBlock: (block: Block) => void
  updateBlock: (id: string, patch: Partial<Block>) => void
  deleteBlock: (id: string) => void
  toggleDone: (id: string) => void
  setUID: (uid: string | null, displayName?: string | null) => void
  setSkipLogin: (skip: boolean) => void
  setCurDate: (date: string) => void
  setCurView: (view: CurView) => void
  setBlocks: (blocks: Block[]) => void
  persistBlocks: () => void
  // Inbox actions
  setPriority: (id: string, priority: Block['priority']) => void
  moveToTimeline: (id: string) => void
  // Recurring actions
  addRecurring: (task: RecurringTask) => void
  deleteRecurring: (id: string) => void
  skipRecurring: (recurId: string, dateStr: string) => void
  completeRecurring: (recurId: string, dateStr: string) => void
  updateRecurringName: (recurId: string, name: string) => void
  persistRecurring: () => void
  // Calendar actions
  setCalYM: (y: number, m: number) => void
}

type AppStore = AppState & AppActions

function loadInitialBlocks(): Block[] {
  const raw = readJSON<Block[]>('ff_v3', [])
  return migrateBlocks(raw)
}

function loadInitialRecurring(): RecurringTask[] {
  return readJSON<RecurringTask[]>('ff_recurring', [])
}

const now = new Date()

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    // State
    blocks: loadInitialBlocks(),
    uid: localStorage.getItem('ff_uid'),
    displayName: null,
    skipLogin: !!localStorage.getItem('ff_skip_login'),
    curDate: todayStr(),
    curView: (['tl','week','habit','goal','drop','cal','stats','friends','mood','tips'].includes(localStorage.getItem('ff_cur_view') || '') ? localStorage.getItem('ff_cur_view') as CurView : 'tl'),
    recurring: loadInitialRecurring(),
    calY: now.getFullYear(),
    calM: now.getMonth(),

    // Actions
    addBlock: (block) => {
      set((state) => {
        state.blocks.push(block)
      })
      get().persistBlocks()
    },

    updateBlock: (id, patch) => {
      set((state) => {
        const idx = state.blocks.findIndex((b) => b.id === id)
        if (idx !== -1) {
          Object.assign(state.blocks[idx], patch)
        }
      })
      get().persistBlocks()
    },

    deleteBlock: (id) => {
      set((state) => {
        state.blocks = state.blocks.filter((b) => b.id !== id)
      })
      // Tombstone so a stale hydrate snapshot can't resurrect this block.
      try {
        const ts: string[] = JSON.parse(localStorage.getItem('ff_block_tombstones') || '[]')
        if (!ts.includes(id)) {
          ts.push(id)
          // Cap to last 500 entries so the set doesn't grow unbounded.
          const capped = ts.slice(-500)
          localStorage.setItem('ff_block_tombstones', JSON.stringify(capped))
        }
      } catch { /* ignore */ }
      get().persistBlocks()
    },

    toggleDone: (id) => {
      set((state) => {
        const block = state.blocks.find((b) => b.id === id)
        if (block) block.done = !block.done
      })
      get().persistBlocks()
    },

    setUID: (uid, displayName = null) => {
      set((state) => {
        state.uid = uid
        state.displayName = displayName
      })
      if (uid) {
        localStorage.setItem('ff_uid', uid)
        localStorage.removeItem('ff_skip_login')
      } else {
        localStorage.removeItem('ff_uid')
      }
    },

    setSkipLogin: (skip) => {
      set((state) => {
        state.skipLogin = skip
      })
      if (skip) {
        localStorage.setItem('ff_skip_login', '1')
      } else {
        localStorage.removeItem('ff_skip_login')
      }
    },

    setCurDate: (date) => {
      set((state) => {
        state.curDate = date
      })
    },

    setCurView: (view) => {
      set((state) => {
        state.curView = view
      })
      localStorage.setItem('ff_cur_view', view)
    },

    setBlocks: (blocks) => {
      set((state) => {
        state.blocks = migrateBlocks(blocks)
      })
      get().persistBlocks()
    },

    persistBlocks: () => {
      const { blocks } = get()
      writeJSON('ff_v3', blocks)
      queue()
    },

    // ── Inbox ────────────────────────────────────────────────────────────────

    setPriority: (id, priority) => {
      set((state) => {
        const block = state.blocks.find((b) => b.id === id)
        if (!block) return
        // 동일 우선순위 누르면 토글 해제
        block.priority = block.priority === priority ? null : priority
      })
      get().persistBlocks()
    },

    moveToTimeline: (id) => {
      const { blocks } = get()
      const block = blocks.find((b) => b.id === id)
      if (!block) return
      const targetDate = todayStr()
      const dur = block.durHour || 1
      const start = freeSlot(blocks, targetDate, dur, null)
      get().updateBlock(id, {
        type: 'timeline',
        date: targetDate,
        startHour: start,
        durHour: dur,
        color: block.color || 'pink',
        priority: null,
      })
      set((state) => {
        state.curDate = targetDate
        state.curView = 'tl'
      })
      localStorage.setItem('ff_cur_view', 'tl')
    },

    // ── Recurring ────────────────────────────────────────────────────────────

    addRecurring: (task) => {
      set((state) => {
        state.recurring.push(task)
      })
      get().persistRecurring()
    },

    deleteRecurring: (id) => {
      set((state) => {
        state.recurring = state.recurring.filter((r) => String(r.id) !== String(id))
      })
      get().persistRecurring()
    },

    skipRecurring: (recurId, dateStr) => {
      set((state) => {
        const r = state.recurring.find((r) => String(r.id) === String(recurId))
        if (r) {
          if (!r.exceptions) r.exceptions = []
          r.exceptions.push(dateStr)
        }
      })
      get().persistRecurring()
    },

    completeRecurring: (recurId, dateStr) => {
      const r = get().recurring.find((r) => String(r.id) === String(recurId))
      if (!r) return
      // Prevent duplicate done blocks for same recurring + date
      const alreadyDone = get().blocks.some(
        (b) => b.recurDoneId === String(r.id) && b.date === dateStr,
      )
      if (alreadyDone) return
      const doneBlock: Block = {
        id: nid(),
        recurDoneId: String(r.id),
        type: 'timeline',
        name: r.name,
        date: dateStr,
        startHour: r.startHour,
        durHour: r.durHour,
        color: (r.color as Block['color']) || 'pink',
        done: true,
        memo: r.memo || '',
        category: r.category || '',
        deadline: null,
        priority: null,
      }
      set((state) => { state.blocks.push(doneBlock) })
      get().persistBlocks()
    },

    updateRecurringName: (recurId, name) => {
      set((state) => {
        const r = state.recurring.find((r) => String(r.id) === String(recurId))
        if (r) r.name = name
      })
      get().persistRecurring()
    },

    persistRecurring: () => {
      const { recurring } = get()
      writeJSON('ff_recurring', recurring)
      queue()
    },

    // ── Calendar ─────────────────────────────────────────────────────────────

    setCalYM: (y, m) => {
      set((state) => {
        state.calY = y
        state.calM = m
      })
    },
  })),
)

// ── Firestore sync registration ──────────────────────────────────────────────

registerCollect(() => {
  // Only include friends when this device actually has some, so a fresh
  // device with an empty list can't push '[]' and erase the other
  // device's saved friends.
  const friendsRaw = localStorage.getItem('ff_friends')
  let friendsParsed: Array<{ uid: string; code: string; name: string }>
  try { friendsParsed = friendsRaw ? JSON.parse(friendsRaw) : [] } catch { friendsParsed = [] }
  const friendsOk = Array.isArray(friendsParsed) && friendsParsed.length > 0
  const metrics = localStorage.getItem('ff_metrics')
  const metricLogs = localStorage.getItem('ff_metricLogs')
  const mandala = localStorage.getItem('ff_mandala')
  return {
    tasks: useAppStore.getState().blocks,
    recurring: useAppStore.getState().recurring,
    ...(friendsOk ? { friends: friendsParsed } : {}),
    ...(metrics ? { metrics: JSON.parse(metrics) } : {}),
    ...(metricLogs ? { metricLogs: JSON.parse(metricLogs) } : {}),
    ...(mandala ? { mandala: JSON.parse(mandala) } : {}),
  }
})

registerHydrate((d: UserDoc) => {
  // Append-only merge for tasks/recurring: keep every local entry, add
  // remote ids we don't already have, and skip any tombstoned id. This
  // stops stale Firestore snapshots from wiping a brand-new local block
  // that hasn't flushed yet.
  if (d.tasks) {
    const local = useAppStore.getState().blocks
    const localById = new Map(local.map((b) => [b.id, b]))
    const tombstones: Set<string> = (() => {
      try { return new Set(JSON.parse(localStorage.getItem('ff_block_tombstones') || '[]')) }
      catch { return new Set<string>() }
    })()
    const merged: Block[] = [...local]
    for (const r of d.tasks) {
      if (localById.has(r.id)) continue
      if (tombstones.has(r.id)) continue
      merged.push(r)
    }
    if (merged.length !== local.length) {
      useAppStore.setState({ blocks: migrateBlocks(merged) })
      writeJSON('ff_v3', merged)
    }
  }
  if (d.recurring) {
    const local = useAppStore.getState().recurring
    const localIds = new Set(local.map((r) => String(r.id)))
    const merged = [...local]
    for (const r of d.recurring) {
      if (!localIds.has(String(r.id))) merged.push(r)
    }
    if (merged.length !== local.length) {
      useAppStore.setState({ recurring: merged })
    }
  }
})

// 인박스에서 타임라인으로 이동할 때 쓰는 nid re-export
export { nid }
