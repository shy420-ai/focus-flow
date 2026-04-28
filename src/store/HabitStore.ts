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
      set((state) => {
        if (!state.habitLogs[dateStr]) state.habitLogs[dateStr] = {}
        const key = String(habitId)
        state.habitLogs[dateStr][key] = !state.habitLogs[dateStr][key]
      })
      const s = get()
      persist(s.habits, s.habitLogs)
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
  if (d.habits) patch.habits = d.habits
  if (d.habitLogs) patch.habitLogs = d.habitLogs as HabitLogs
  if (d.quickMemo !== undefined) patch.quickMemo = d.quickMemo
  if (Object.keys(patch).length) useHabitStore.setState(patch)
})
