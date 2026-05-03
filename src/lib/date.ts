export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayStr(): string {
  const d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// "Logical today" — before 4 AM the calendar day still feels like
// yesterday for night owls (esp. ADHD users). Use this anywhere the
// default landing date matters; calendar-accurate code keeps todayStr.
export const DAY_ROLL_HOUR = 4
export function logicalTodayStr(): string {
  const d = new Date()
  if (d.getHours() < DAY_ROLL_HOUR) {
    const y = new Date(d.getTime() - 24 * 3600 * 1000)
    return y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate())
  }
  return todayStr()
}

export function addDays(ds: string, n: number): string {
  const d = new Date(ds + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function fmtH(h: number): string {
  const hr = Math.floor(h)
  const mn = Math.round((h % 1) * 60)
  return hr + ':' + String(mn).padStart(2, '0')
}

export function nowH(): number {
  const n = new Date()
  return n.getHours() + n.getMinutes() / 60
}

export function getDow(ds: string): string {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토']
  return DAYS[new Date(ds + 'T12:00:00').getDay()]
}

export function daysFromNow(ds: string | null): number {
  if (!ds) return Infinity
  return Math.round(
    (new Date(ds + 'T12:00:00').getTime() - new Date(todayStr() + 'T12:00:00').getTime()) /
      86400000,
  )
}

export function dateLabel(ds: string): string {
  const today = todayStr()
  const diff = Math.round(
    (new Date(ds + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000,
  )
  const dow = getDow(ds)
  const [, m, d] = ds.split('-')
  if (diff === 0) return '오늘(' + dow + ')'
  if (diff === 1) return '내일(' + dow + ')'
  if (diff === 2) return '모레(' + dow + ')'
  if (diff === -1) return '어제(' + dow + ')'
  return parseInt(m) + '/' + parseInt(d) + '(' + dow + ')'
}
