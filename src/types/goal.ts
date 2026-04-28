export interface QTask {
  id: string
  text: string
  done: boolean
}

export interface Quarter {
  title: string
  tasks: QTask[]
}

export interface YearGoal {
  id: string
  text: string
  quarters: Quarter[]
}

export interface Roadmap {
  goals: YearGoal[]
}

export interface GoalEntry {
  id: string
  text: string
  done: boolean
}

// key = 'm2026-04' (month) or 'w2026-04-21' (week)
export type GoalEntries = Record<string, GoalEntry[]>
