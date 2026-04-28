export interface RecurringTask {
  id: string
  name: string
  days: number[]      // 0=일 ~ 6=토
  startHour: number
  durHour: number
  color?: string
  memo?: string
  category?: string
  exceptions?: string[]  // 'YYYY-MM-DD' 제외 날짜
  reward?: string | null
}
