import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Habit, HabitLogs } from '../types/habit'
import { readJSON, writeJSON } from '../lib/localStorage'
import { todayStr, addDays } from '../lib/date'
import { queue, registerCollect, registerHydrate } from '../lib/syncManager'
import type { UserDoc } from '../lib/firestore'

interface HabitState {
  habits: Habit[]
  habitLogs: HabitLogs
  quickMemo: string
}

interface HabitActions {
  addHabit: (name: string, days: number[] | null) => void
  deleteHabit: (id: number) => void
  updateHabitName: (id: number, name: string) => void
  toggleLog: (habitId: number, dateStr: string) => void
  setQuickMemo: (memo: string) => void
}

type HabitStore = HabitState & HabitActions

const TOMBSTONE_KEY = 'ff_habit_tombstones'

function loadTombstones(): Set<number> {
  try {
    const arr = JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]') as number[]
    return new Set(arr)
  } catch { return new Set() }
}

function saveTombstones(set: Set<number>) {
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set)))
}

function persist(habits: Habit[], habitLogs: HabitLogs) {
  writeJSON('ff_habits', habits)
  writeJSON('ff_habitLogs', habitLogs)
  queue()
}

export const useHabitStore = create<HabitStore>()(
  immer((set, get) => ({
    habits: readJSON<Habit[]>('ff_habits', []),
    habitLogs: readJSON<HabitLogs>('ff_habitLogs', {}),
    quickMemo: localStorage.getItem('ff_quickMemo') || '',

    addHabit: (name, days) => {
      set((state) => {
        state.habits.push({ id: Date.now(), name, createdAt: todayStr(), days })
      })
      const s = get()
      persist(s.habits, s.habitLogs)
    },

    deleteHabit: (id) => {
      set((state) => {
        state.habits = state.habits.filter((h) => h.id !== id)
      })
      // Tombstone the id so a stale Firestore snapshot can't resurrect
      // the habit before our deletion has been flushed.
      const tomb = loadTombstones()
      tomb.add(id)
      saveTombstones(tomb)
      const s = get()
      persist(s.habits, s.habitLogs)
    },

    updateHabitName: (id, name) => {
      set((state) => {
        const h = state.habits.find((h) => h.id === id)
        if (h) h.name = name
      })
      const s = get()
      persist(s.habits, s.habitLogs)
    },

    toggleLog: (habitId, dateStr) => {
      let nowDone = false
      set((state) => {
        if (!state.habitLogs[dateStr]) state.habitLogs[dateStr] = {}
        const key = String(habitId)
        state.habitLogs[dateStr][key] = !state.habitLogs[dateStr][key]
        nowDone = !!state.habitLogs[dateStr][key]
      })
      const s = get()
      persist(s.habits, s.habitLogs)
      // ADHD reward loop: every habit check is +5 XP. Unchecking refunds it.
      // Done as a dynamic import to avoid a circular dep through xp.ts.
      import('../lib/xp').then(({ addXp }) => {
        addXp(nowDone ? 5 : -5)
      })
    },

    setQuickMemo: (memo) => {
      set((state) => { state.quickMemo = memo })
      localStorage.setItem('ff_quickMemo', memo)
      queue()
    },
  })),
)

// Utility functions
export function getHabitStreak(habitLogs: HabitLogs, habitId: number): number {
  let streak = 0
  let d = todayStr()
  for (let i = 0; i < 365; i++) {
    if (habitLogs[d]?.[String(habitId)]) { streak++; d = addDays(d, -1) }
    else break
  }
  return streak
}

export function getHabitTotalDays(habitLogs: HabitLogs, habitId: number): number {
  let total = 0
  Object.values(habitLogs).forEach((day) => {
    if (day?.[String(habitId)]) total++
  })
  return total
}

export function isHabitDay(habit: Habit, dateStr: string): boolean {
  if (!habit.days) return true
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  const monIdx = dow === 0 ? 6 : dow - 1
  return habit.days.includes(monIdx)
}

export function getWeekDates(): string[] {
  const today = new Date(todayStr() + 'T12:00:00')
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    dates.push(
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0'),
    )
  }
  return dates
}

// ── Firestore sync registration ──────────────────────────────────────────────

registerCollect(() => ({
  habits: useHabitStore.getState().habits,
  habitLogs: useHabitStore.getState().habitLogs as UserDoc['habitLogs'],
  quickMemo: useHabitStore.getState().quickMemo,
}))

registerHydrate((d: UserDoc) => {
  const patch: Partial<{ habits: Habit[]; habitLogs: HabitLogs; quickMemo: string }> = {}
  if (Array.isArray(d.habits)) {
    // Append-only merge with tombstones. Local edits/deletes always win;
    // we only adopt remote habits whose id is new AND not tombstoned.
    const local = useHabitStore.getState().habits
    const tomb = loadTombstones()
    const seen = new Set(local.map((h) => h.id))
    const merged = [...local]
    for (const r of d.habits) {
      if (!r || typeof r !== 'object') continue
      if (seen.has(r.id)) continue
      if (tomb.has(r.id)) continue
      merged.push(r)
      seen.add(r.id)
    }
    if (merged.length !== local.length) {
      patch.habits = merged
      writeJSON('ff_habits', merged)
    }
  }
  if (d.habitLogs) patch.habitLogs = d.habitLogs as HabitLogs
  if (d.quickMemo !== undefined) patch.quickMemo = d.quickMemo
  if (Object.keys(patch).length) useHabitStore.setState(patch)
})
