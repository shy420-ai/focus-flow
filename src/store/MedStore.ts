import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MedConfig, MedLog, MedItem } from '../types/med'
import { readJSON, writeJSON } from '../lib/localStorage'
import { todayStr } from '../lib/date'
import { flushSync, registerCollect, registerHydrate } from '../lib/syncManager'
import type { UserDoc } from '../lib/firestore'

interface MedState {
  config: MedConfig | null
  logs: MedLog[]
}

interface MedActions {
  setConfig: (cfg: MedConfig) => void
  addMed: (med: MedItem) => void
  removeMed: (name: string, timing: '아침' | '점심' | '저녁' | '수시') => void
  logTake: (timing: '아침' | '점심' | '저녁') => void
  clearTake: (timing: '아침' | '점심' | '저녁') => void
  logStatus: (level: number) => void
  logWake: (level: number) => void
  logSleepTime: (level: number) => void
  logBedtime: (hour: number) => void
  clearAll: () => void
}

type MedStore = MedState & MedActions

function persist(config: MedConfig | null, logs: MedLog[]) {
  writeJSON('ff_med_config', config)
  writeJSON('ff_med_logs', logs)
  // Immediate push instead of debounced queue. iOS Safari aggressively
  // kills pending timers when the tab backgrounds, which left users
  // (especially on iPhone) thinking the med tab "didn't save".
  flushSync().catch(() => { /* offline ok */ })
}

export const useMedStore = create<MedStore>()(
  immer((set, get) => ({
    config: readJSON<MedConfig | null>('ff_med_config', null),
    logs: readJSON<MedLog[]>('ff_med_logs', []),

    setConfig: (cfg) => {
      set((state) => { state.config = cfg })
      persist(cfg, get().logs)
    },

    addMed: (med) => {
      set((state) => {
        if (!state.config) state.config = { meds: [] }
        if (!state.config.meds.find((m) => m.name === med.name && m.timing === med.timing)) {
          state.config.meds.push(med)
        }
      })
      persist(get().config, get().logs)
    },

    removeMed: (name, timing) => {
      set((state) => {
        if (state.config) {
          state.config.meds = state.config.meds.filter((m) => !(m.name === name && m.timing === timing))
        }
      })
      persist(get().config, get().logs)
    },

    logTake: (timing) => {
      const now = new Date()
      const timeVal = now.getHours() + now.getMinutes() / 60
      const today = todayStr()
      set((state) => {
        // Remove existing take for same timing today
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'take' && l.timing === timing))
        state.logs.push({ id: String(Date.now()), date: today, type: 'take', timing, time: timeVal })
      })
      persist(get().config, get().logs)
    },

    clearTake: (timing) => {
      const today = todayStr()
      set((state) => {
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'take' && l.timing === timing))
      })
      persist(get().config, get().logs)
    },

    logStatus: (level) => {
      const today = todayStr()
      const hour = new Date().getHours()
      set((state) => {
        // Replace same-hour status
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'status' && l.hour === hour))
        state.logs.push({ id: String(Date.now()), date: today, type: 'status', level, hour })
      })
      persist(get().config, get().logs)
    },

    logWake: (level) => {
      const today = todayStr()
      set((state) => {
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'wake'))
        state.logs.push({ id: String(Date.now()), date: today, type: 'wake', level })
      })
      persist(get().config, get().logs)
    },

    logSleepTime: (level) => {
      const today = todayStr()
      set((state) => {
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'sleeptime'))
        state.logs.push({ id: String(Date.now()), date: today, type: 'sleeptime', level })
      })
      persist(get().config, get().logs)
    },

    logBedtime: (hour) => {
      const today = todayStr()
      set((state) => {
        state.logs = state.logs.filter((l) => !(l.date === today && l.type === 'bed'))
        state.logs.push({ id: String(Date.now()), date: today, type: 'bed', time: hour })
      })
      persist(get().config, get().logs)
    },

    clearAll: () => {
      const today = todayStr()
      set((state) => {
        state.logs = state.logs.filter((l) => l.date !== today)
      })
      persist(get().config, get().logs)
    },
  })),
)

// ── Firestore sync registration ──────────────────────────────────────────────

registerCollect(() => {
  const result: Record<string, unknown> = {
    medConfig: useMedStore.getState().config,
    medLogs: useMedStore.getState().logs,
  }
  const birthday = localStorage.getItem('ff_birthday')
  const birthyear = localStorage.getItem('ff_birthyear')
  const nickname = localStorage.getItem('ff_nickname')
  if (birthday) result.birthday = birthday
  if (birthyear) result.birthyear = birthyear
  if (nickname) result.nickname = nickname
  return result
})

registerHydrate((d: UserDoc) => {
  const local = useMedStore.getState()
  // medConfig: only adopt remote when local has nothing yet, so a stale
  // hydrate can't blow away the user's saved meds.
  if ((local.config == null || (local.config.meds?.length ?? 0) === 0) && d.medConfig !== undefined) {
    useMedStore.setState({ config: d.medConfig as MedConfig | null })
    writeJSON('ff_med_config', d.medConfig as MedConfig | null)
  }
  // medLogs: append-only merge by id — never lose a take/skip the user
  // logged before the snapshot caught up.
  if (Array.isArray(d.medLogs) && d.medLogs.length > 0) {
    const localById = new Map(local.logs.map((l) => [l.id, l]))
    const merged: MedLog[] = [...local.logs]
    for (const r of d.medLogs) {
      if (!localById.has(r.id)) merged.push(r)
    }
    if (merged.length !== local.logs.length) {
      useMedStore.setState({ logs: merged })
      writeJSON('ff_med_logs', merged)
    }
  }
  if (d.birthday) localStorage.setItem('ff_birthday', d.birthday as string)
  if (d.birthyear) localStorage.setItem('ff_birthyear', String(d.birthyear))
  if (d.nickname && !localStorage.getItem('ff_nickname')) {
    localStorage.setItem('ff_nickname', d.nickname as string)
  }
})
