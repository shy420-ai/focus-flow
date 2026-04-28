export interface Habit {
  id: number
  name: string
  createdAt: string
  days: number[] | null // null=every day, 0-6 (0=Mon..6=Sun)
}

// Record<dateStr, Record<habitIdStr, boolean>>
export type HabitLogs = Record<string, Record<string, boolean>>
