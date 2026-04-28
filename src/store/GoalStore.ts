import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Roadmap, YearGoal, Quarter, GoalEntries, GoalEntry } from '../types/goal'
import { readJSON, writeJSON } from '../lib/localStorage'
import { queue, registerCollect, registerHydrate } from '../lib/syncManager'
import { showMiniToast } from '../lib/miniToast'
import type { UserDoc } from '../lib/firestore'

export const Q_LABELS = ['Q1 (1~3월)', 'Q2 (4~6월)', 'Q3 (7~9월)', 'Q4 (10~12월)']
export const Q_EMOJI = ['🌸', '☀️', '🍂', '⛄']
export const Q_COLORS = ['#FF9AA2', '#FFE156', '#56C6A0', '#8DC8E8']

function makeQuarters(): Quarter[] {
  return [0, 1, 2, 3].map(() => ({ title: '', tasks: [] }))
}

function initRoadmap(): Roadmap {
  return { goals: [] }
}

function migrateRoadmap(r: Roadmap): Roadmap {
  r.goals.forEach((g) => {
    if (!g.quarters || g.quarters.length !== 4) {
      g.quarters = makeQuarters()
    }
    g.quarters.forEach((q) => {
      if (!q.tasks) q.tasks = []
      if (q.title === undefined) q.title = ''
    })
  })
  return r
}

export function getCurrentQ(): number {
  return Math.floor(new Date().getMonth() / 3)
}

export function getQProgress() {
  const now = new Date()
  const q = getCurrentQ()
  const qStart = new Date(now.getFullYear(), q * 3, 1)
  const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0)
  const totalDays = Math.round((qEnd.getTime() - qStart.getTime()) / 86400000) + 1
  const daysPassed = Math.round((now.getTime() - qStart.getTime()) / 86400000) + 1
  const pct = Math.round(Math.min(daysPassed / totalDays, 1) * 100)
  const totalWeeks = Math.ceil(totalDays / 7)
  const week = Math.ceil(daysPassed / 7)
  const remain = totalDays - daysPassed
  return { pct, week, totalWeeks, remain }
}

export function goalKey(type: string): string {
  const d = new Date()
  if (type === 'month') {
    return 'm' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
  }
  if (type.startsWith('month_')) {
    const mo = parseInt(type.split('_')[1])
    return 'm' + d.getFullYear() + '-' + String(mo).padStart(2, '0')
  }
  // week
  const dow = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - (dow - 1))
  return (
    'w' +
    mon.getFullYear() +
    '-' +
    String(mon.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(mon.getDate()).padStart(2, '0')
  )
}

interface GoalState {
  roadmap: Roadmap
  goals: GoalEntries
  openTree: Record<string, Record<number, boolean>>
}

interface GoalActions {
  addYearGoal: (text: string) => void
  deleteYearGoal: (goalId: string) => void
  editYearGoalText: (goalId: string, text: string) => void
  editQTitle: (goalId: string, qi: number, title: string) => void
  addQTask: (goalId: string, qi: number, text: string) => void
  toggleQTask: (goalId: string, qi: number, taskId: string) => void
  deleteQTask: (goalId: string, qi: number, taskId: string) => void
  addGoalEntry: (type: string, text: string) => void
  toggleGoalEntry: (type: string, entryId: string) => void
  deleteGoalEntry: (type: string, entryId: string) => void
  toggleTreeQ: (goalId: string, qi: number) => void
}

type GoalStore = GoalState & GoalActions

function persistRoadmap(roadmap: Roadmap) {
  writeJSON('ff_roadmap', roadmap)
  queue()
}

function persistGoals(goals: GoalEntries) {
  writeJSON('ff_goals', goals)
  queue()
}

export const useGoalStore = create<GoalStore>()(
  immer((set, get) => {
    const rawRoadmap = readJSON<Roadmap | null>('ff_roadmap', null)
    const roadmap = migrateRoadmap(rawRoadmap ?? initRoadmap())
    // default: open current quarter for each goal
    const curQ = getCurrentQ()
    const openTree: Record<string, Record<number, boolean>> = {}
    roadmap.goals.forEach((g) => {
      openTree[g.id] = { [curQ]: true }
    })

    return {
      roadmap,
      goals: readJSON<GoalEntries>('ff_goals', {}),
      openTree,

      addYearGoal: (text) => {
        if (!text.trim()) return
        const r = get().roadmap
        if (r.goals.length >= 3) { showMiniToast('연간 목표는 3개까지! 🎯'); return }
        const newGoal: YearGoal = {
          id: String(Date.now()),
          text: text.trim(),
          quarters: makeQuarters(),
        }
        set((state) => {
          state.roadmap.goals.push(newGoal)
          state.openTree[newGoal.id] = { [getCurrentQ()]: true }
        })
        persistRoadmap(get().roadmap)
      },

      deleteYearGoal: (goalId) => {
        set((state) => {
          state.roadmap.goals = state.roadmap.goals.filter((g) => g.id !== goalId)
          delete state.openTree[goalId]
        })
        persistRoadmap(get().roadmap)
      },

      editYearGoalText: (goalId, text) => {
        set((state) => {
          const g = state.roadmap.goals.find((g) => g.id === goalId)
          if (g) g.text = text
        })
        persistRoadmap(get().roadmap)
      },

      editQTitle: (goalId, qi, title) => {
        set((state) => {
          const g = state.roadmap.goals.find((g) => g.id === goalId)
          if (g) g.quarters[qi].title = title
        })
        persistRoadmap(get().roadmap)
      },

      addQTask: (goalId, qi, text) => {
        if (!text.trim()) return
        set((state) => {
          const g = state.roadmap.goals.find((g) => g.id === goalId)
          if (!g) return
          if (g.quarters[qi].tasks.length >= 5) { showMiniToast('분기 할 일은 5개까지!'); return }
          g.quarters[qi].tasks.push({ id: String(Date.now()), text: text.trim(), done: false })
        })
        persistRoadmap(get().roadmap)
      },

      toggleQTask: (goalId, qi, taskId) => {
        set((state) => {
          const g = state.roadmap.goals.find((g) => g.id === goalId)
          if (!g) return
          const t = g.quarters[qi].tasks.find((t) => t.id === taskId)
          if (t) t.done = !t.done
        })
        persistRoadmap(get().roadmap)
      },

      deleteQTask: (goalId, qi, taskId) => {
        set((state) => {
          const g = state.roadmap.goals.find((g) => g.id === goalId)
          if (!g) return
          g.quarters[qi].tasks = g.quarters[qi].tasks.filter((t) => t.id !== taskId)
        })
        persistRoadmap(get().roadmap)
      },

      addGoalEntry: (type, text) => {
        if (!text.trim()) return
        const key = goalKey(type)
        const current = get().goals[key] || []
        const limit = type === 'week' ? 3 : type === 'month' || type.startsWith('month_') ? 5 : 10
        if (current.length >= limit) { showMiniToast('목표 개수 초과! (최대 ' + limit + '개)'); return }
        const entry: GoalEntry = { id: String(Date.now()), text: text.trim(), done: false }
        set((state) => {
          if (!state.goals[key]) state.goals[key] = []
          state.goals[key].push(entry)
        })
        persistGoals(get().goals)
      },

      toggleGoalEntry: (type, entryId) => {
        const key = goalKey(type)
        set((state) => {
          const list = state.goals[key]
          if (!list) return
          const e = list.find((e) => e.id === entryId)
          if (e) e.done = !e.done
        })
        persistGoals(get().goals)
      },

      deleteGoalEntry: (type, entryId) => {
        const key = goalKey(type)
        set((state) => {
          if (state.goals[key]) {
            state.goals[key] = state.goals[key].filter((e) => e.id !== entryId)
          }
        })
        persistGoals(get().goals)
      },

      toggleTreeQ: (goalId, qi) => {
        set((state) => {
          if (!state.openTree[goalId]) state.openTree[goalId] = {}
          state.openTree[goalId][qi] = !state.openTree[goalId][qi]
        })
      },
    }
  }),
)

// ── Firestore sync registration ──────────────────────────────────────────────

registerCollect(() => ({
  roadmap: useGoalStore.getState().roadmap,
  goals: useGoalStore.getState().goals,
}))

registerHydrate((d: UserDoc) => {
  const patch: Partial<{ roadmap: Roadmap; goals: GoalEntries }> = {}
  if (d.roadmap) patch.roadmap = d.roadmap
  if (d.goals) patch.goals = d.goals
  if (Object.keys(patch).length) useGoalStore.setState(patch)
})
