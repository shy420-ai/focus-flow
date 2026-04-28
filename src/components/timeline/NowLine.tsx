import { useNow } from '../../hooks/useNow'
import { pad } from '../../lib/date'

interface NowLineProps {
  startHour: number
  totalHours: number
  px: number
}

export function NowLine({ startHour, totalHours, px }: NowLineProps) {
  const now = useNow()
  const nh = now.getHours() + now.getMinutes() / 60

  if (nh < startHour || nh > startHour + totalHours) return null

  const top = (nh - startHour) * px

  return (
    <div className="now-line" style={{ top: `${top}px` }}>
      <div className="now-dot" />
      <div className="now-lbl">
        {pad(Math.floor(nh))}:{pad(Math.round((nh % 1) * 60))}
      </div>
    </div>
  )
}
