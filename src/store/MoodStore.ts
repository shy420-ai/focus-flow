import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { readJSON, writeJSON } from '../lib/localStorage'
import type { DailyMood, MoodEntry } from '../types/mood'

interface State {
  daily: Record<string, DailyMood>
  entries: MoodEntry[]
}

interface Actions {
  setDailySlider: (date: string, patch: Partial<DailyMood>) => void
  addEntry: (e: Omit<MoodEntry, 'id' | 'ts'>) => number
  editEntry: (id: number, patch: Partial<MoodEntry>) => void
  deleteEntry: (id: number) => void
}

type Store = State & Actions

function persistDaily(d: Record<string, DailyMood>) {
  writeJSON('ff_mood_daily', d)
}
function persistEntries(e: MoodEntry[]) {
  writeJSON('ff_mood_entries', e)
}

export const useMoodStore = create<Store>()(
  immer((set, get) => ({
    daily: readJSON<Record<string, DailyMood>>('ff_mood_daily', {}),
    entries: readJSON<MoodEntry[]>('ff_mood_entries', []),

    setDailySlider: (date, patch) => {
      set((s) => {
        const cur = s.daily[date] ?? { date }
        s.daily[date] = { ...cur, ...patch, updatedAt: Date.now() }
      })
      persistDaily(get().daily)
    },

    addEntry: (e) => {
      const id = Date.now()
      set((s) => {
        s.entries.unshift({ ...e, id, ts: id })
      })
      persistEntries(get().entries)
      return id
    },

    editEntry: (id, patch) => {
      set((s) => {
        const it = s.entries.find((x) => x.id === id)
        if (it) Object.assign(it, patch)
      })
      persistEntries(get().entries)
    },

    deleteEntry: (id) => {
      set((s) => { s.entries = s.entries.filter((x) => x.id !== id) })
      persistEntries(get().entries)
    },
  })),
)
