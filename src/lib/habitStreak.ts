// Compute consecutive-day streak ending today (or yesterday if today not yet done).
// Returns 0 if no log within the last 2 days. Used in friends panel.
export function computeStreak(habitId: string, logs: Record<string, Record<string, boolean>>): number {
  const id = String(habitId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Allow streak to count even if today not yet done — start from yesterday.
  const cursor = new Date(today)
  if (!logs[dayStr(cursor)]?.[id]) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (logs[dayStr(cursor)]?.[id]) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break
  }
  return streak
}
