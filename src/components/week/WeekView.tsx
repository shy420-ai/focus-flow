import { useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import { generateRecurringBlocks } from '../../lib/recurring'
import { todayStr, pad } from '../../lib/date'
import { getCategories } from '../../lib/categories'
import type { Block } from '../../types/block'

const START = 6
const HOURS = 18
const PX = 28
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function catColor(block: Block): string {
  if (block.category) {
    const found = getCategories().find((c) => c.name === block.category)
    if (found) return found.color
  }
  return 'var(--pink)'
}

function getWeekStart(offset: number): Date {
  const today = new Date(todayStr() + 'T12:00:00')
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  return mon
}

function dateStr(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function WeekView() {
  const blocks = useAppStore((s) => s.blocks)
  const recurring = useAppStore((s) => s.recurring)
  const setCurDate = useAppStore((s) => s.setCurDate)
  const setCurView = useAppStore((s) => s.setCurView)

  const [offset, setOffset] = useState(0)
  const [tipHidden, setTipHidden] = useState(!!localStorage.getItem('ff_week_tip_hide'))

  const weekStart = getWeekStart(offset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const today = todayStr()

  function goToDay(ds: string) {
    setCurDate(ds)
    setCurView('tl')
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Tip */}
      {!tipHidden && (
        <div style={{ fontSize: 11, color: '#888', background: 'var(--pl)', borderRadius: 10, padding: '8px 14px', margin: '8px 8px 0', textAlign: 'center', position: 'relative' }}>
          💡 블록을 터치하면 해당 날짜 타임라인으로 이동!
          <button
            onClick={() => { localStorage.setItem('ff_week_tip_hide', '1'); setTipHidden(true) }}
            style={{ position: 'absolute', top: 4, right: 8, background: 'none', border: 'none', color: '#ccc', fontSize: 14, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 8px 4px' }}>
        <button
          onClick={() => setOffset((o) => o - 1)}
          style={{ background: 'var(--pl)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', color: 'var(--pd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>
          {weekStart.getMonth() + 1}/{weekStart.getDate()} ~ {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
        </span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          style={{ background: 'var(--pl)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', color: 'var(--pd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >›</button>
        <button
          onClick={() => setOffset(0)}
          style={{ background: 'var(--pl)', border: '1.5px solid var(--pink)', borderRadius: 8, fontSize: 10, color: 'var(--pd)', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: offset === 0 ? 0.4 : 1 }}
        >이번 주</button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <div className="week-grid">
          {/* Header row */}
          <div className="week-header" />
          {days.map((d, i) => {
            const ds = dateStr(d)
            const isToday = ds === today
            return (
              <div key={i} className={'week-header' + (isToday ? ' today' : '')}>
                {DAY_LABELS[i]}<br />{d.getDate()}
              </div>
            )
          })}

          {/* Time rows */}
          {Array.from({ length: HOURS }, (_, rowIdx) => {
            const t = START + rowIdx
            return (
              <>
                <div key={'time-' + t} className="week-time">{t}:00</div>
                {days.map((d, di) => {
                  const ds = dateStr(d)
                  const dayBlocks = blocks.filter(
                    (b) => b.date === ds && !b.isBuf && (b.type === 'timeline' || !b.type),
                  )
                  const recurBlocks = generateRecurringBlocks(ds, recurring, blocks)
                  const allB: Block[] = [...dayBlocks, ...recurBlocks]

                  return (
                    <div key={di} className="week-cell" data-date={ds} data-hour={t}>
                      {allB.map((b) => {
                        if (Math.floor(b.startHour) !== t) return null
                        const top = Math.round((b.startHour - t) * PX)
                        const height = Math.max(Math.round(b.durHour * PX), 14)
                        return (
                          <div
                            key={b.id}
                            className={'week-block' + (b.done ? ' done' : '')}
                            style={{ top, height, background: catColor(b) }}
                            title={b.name + ' ' + b.startHour + '-' + (b.startHour + b.durHour)}
                            onClick={() => goToDay(ds)}
                          >
                            {b.name}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )
          })}
        </div>
      </div>
    </div>
  )
}
