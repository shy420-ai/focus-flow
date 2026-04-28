import { useAppStore } from '../../store/AppStore'
import { todayStr, addDays, dateLabel } from '../../lib/date'
import type { Block } from '../../types/block'

function buildDateList(blocks: Block[]): string[] {
  const today = todayStr()
  const s = new Set<string>(
    blocks
      .filter((b) => b.type === 'timeline' || b.type === 'buffer')
      .map((b) => b.date),
  )
  s.add(today)
  // Show -3 to +7 range from today for date navigation
  for (let i = -3; i <= 7; i++) {
    s.add(addDays(today, i))
  }
  const all = [...s].sort()
  const past = all.filter((d) => d < today).slice(-3)
  const future = all.filter((d) => d >= today)
  return [...past, ...future]
}

export function DateTabs() {
  const blocks = useAppStore((s) => s.blocks)
  const curDate = useAppStore((s) => s.curDate)
  const setCurDate = useAppStore((s) => s.setCurDate)
  const today = todayStr()

  const dates = buildDateList(blocks)
  const pastDates = dates.filter((d) => d < today)
  const futureDates = dates.filter((d) => d >= today)

  return (
    <div className="date-tabs">
      {pastDates.map((ds) => (
        <button
          key={ds}
          className={'dtab' + (ds === curDate ? ' active' : '')}
          onClick={() => setCurDate(ds)}
        >
          {dateLabel(ds)}
        </button>
      ))}
      {futureDates.map((ds) => (
        <button
          key={ds}
          className={'dtab' + (ds === curDate ? ' active' : '')}
          onClick={() => setCurDate(ds)}
        >
          {dateLabel(ds)}
        </button>
      ))}
    </div>
  )
}
