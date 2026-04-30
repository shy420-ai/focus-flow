import { useAppStore } from '../../store/AppStore'
import { todayStr, addDays } from '../../lib/date'

export function PastMeMirror() {
  const blocks = useAppStore((s) => s.blocks)
  const today = todayStr()
  const yesterday = addDays(today, -1)
  const now = new Date()
  const nowFrac = now.getHours() + now.getMinutes() / 60

  const todayBlocks = blocks.filter((b) => b.date === today && (b.type === 'timeline' || !b.type) && !b.isBuf && b.startHour <= nowFrac)
  const todayDone = todayBlocks.filter((b) => b.done).length
  const todayTotal = todayBlocks.length

  const yBlocks = blocks.filter((b) => b.date === yesterday && (b.type === 'timeline' || !b.type) && !b.isBuf && b.startHour <= nowFrac)
  const yDone = yBlocks.filter((b) => b.done).length
  const yTotal = yBlocks.length

  if (yTotal === 0 && todayTotal === 0) return null

  const todayRate = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0
  const yRate = yTotal > 0 ? Math.round((yDone / yTotal) * 100) : 0
  const diff = todayRate - yRate

  let msg: string
  let bg: string
  if (yTotal === 0) {
    msg = '어제 이 시간엔 데이터가 없네. 오늘이 시작!'
    bg = 'var(--pl)'
  } else if (diff > 0) {
    msg = `✅ 어제의 너보다 +${diff}% 앞서있어`
    bg = '#E8F5E9'
  } else if (diff < 0) {
    msg = `🫂 어제의 너보다 ${diff}%, 천천히 따라잡자`
    bg = '#FFF3E0'
  } else {
    msg = '🤝 어제의 너랑 동률'
    bg = 'var(--pl)'
  }

  return (
    <div style={{ margin: '0 16px 8px', padding: '8px 12px', background: bg, borderRadius: 10, fontSize: 12, color: 'var(--pd)', lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>🪞 Past Me 미러</div>
      <div style={{ fontSize: 11, color: '#666' }}>
        어제 이 시간: {yDone}/{yTotal} ({yRate}%) · 지금: {todayDone}/{todayTotal} ({todayRate}%)
      </div>
      <div style={{ marginTop: 2 }}>{msg}</div>
    </div>
  )
}
