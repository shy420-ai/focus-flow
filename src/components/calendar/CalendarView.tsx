import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/AppStore'
import { todayStr, getDow, fmtH, pad } from '../../lib/date'
import { nid } from '../../lib/id'
import { generateRecurringBlocks } from '../../lib/recurring'
import { getCategories } from '../../lib/categories'
import { CatEditModal } from '../ui/CatEditModal'
import type { Block } from '../../types/block'

const MONTH = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

const COLOR_HEX: Record<string, string> = {
  red: '#E24B4A',
  amb: '#EF9F27',
  pink: '#E8849D',
  blue: '#378ADD',
  teal: '#1D9E75',
}

interface DayCellProps {
  ds: string
  dayNum: number
  isToday: boolean
  isSelected: boolean
  isPast: boolean
  isOther: boolean
  dow: number
  dayBlocks: Block[]
  onClick: (ds: string) => void
}

function DayCell({ ds, dayNum, isToday, isSelected, isPast, isOther, dow, dayBlocks, onClick }: DayCellProps) {
  let cls = 'cal-day'
  if (isOther) cls += ' other'
  else {
    if (isToday) cls += ' tod'
    if (isSelected) cls += ' sel'
    if (isPast) cls += ' past'
  }

  const numCls = 'cal-num' + (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '')

  return (
    <div className={cls} onClick={() => !isOther && onClick(ds)}>
      <div className={numCls}>{dayNum}</div>
      {dayBlocks.length > 0 && (
        <>
          <div className="cal-dots">
            {dayBlocks.slice(0, 3).map((b, i) => (
              <div
                key={i}
                className="cal-dot"
                style={{ background: COLOR_HEX[b.color] || '#E8849D' }}
              />
            ))}
          </div>
          <div className="cal-preview">
            {dayBlocks.slice(0, 2).map((b, i) => (
              <div key={i} className="cal-pv-line">
                {b.name}
              </div>
            ))}
            {dayBlocks.length > 2 && (
              <div className="cal-pv-line cal-pv-more">+{dayBlocks.length - 2}개</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface CalDetailProps {
  ds: string
  dayBlocks: Block[]
  onGoTimeline: (ds: string) => void
}

function CalDetail({ ds, dayBlocks, onGoTimeline }: CalDetailProps) {
  const [, m, d] = ds.split('-')
  const sorted = [...dayBlocks].sort((a, b) => a.startHour - b.startHour)

  return (
    <div className="cal-detail">
      <div className="cal-dlabel">
        {parseInt(m)}월 {parseInt(d)}일 ({getDow(ds)})
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#bbb', fontSize: '13px', padding: '16px 0' }}>
          이 날은 비어있어
        </div>
      ) : (
        sorted.map((b) => {
          const c = COLOR_HEX[b.color] || '#E8849D'
          return (
            <div
              key={b.id}
              className="cal-ev"
              style={{ borderLeftColor: c, opacity: b.done ? 0.4 : 1, cursor: 'pointer' }}
              onClick={() => onGoTimeline(ds)}
            >
              <div className="cal-ev-time" style={{ color: c }}>
                {fmtH(b.startHour)} – {fmtH(b.startHour + b.durHour)}
              </div>
              <div className="cal-ev-name">
                {b.done ? '✓ ' : ''}
                {b.name}
                {b.isRecurring ? ' 🔁' : ''}
              </div>
              {b.memo && (
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{b.memo}</div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export function CalendarView() {
  const blocks = useAppStore((s) => s.blocks)
  const recurring = useAppStore((s) => s.recurring)
  const calY = useAppStore((s) => s.calY)
  const calM = useAppStore((s) => s.calM)
  const setCalYM = useAppStore((s) => s.setCalYM)
  const setCurDate = useAppStore((s) => s.setCurDate)
  const setCurView = useAppStore((s) => s.setCurView)
  const [catFilter, setCatFilter] = useState('')
  const [categories, setCategories] = useState(getCategories)
  const [showCatEdit, setShowCatEdit] = useState(false)
  const today = todayStr()
  const [selDate, setSelDate] = useState(today)

  useEffect(() => {
    function onCatsChanged() { setCategories(getCategories()) }
    window.addEventListener('ff-cats-changed', onCatsChanged)
    return () => window.removeEventListener('ff-cats-changed', onCatsChanged)
  }, [])

  function prevMonth() {
    if (calM === 0) setCalYM(calY - 1, 11)
    else setCalYM(calY, calM - 1)
  }

  function nextMonth() {
    if (calM === 11) setCalYM(calY + 1, 0)
    else setCalYM(calY, calM + 1)
  }

  function handleDayClick(ds: string) {
    setSelDate(ds)
  }

  function handleGoTimeline(ds: string) {
    setCurDate(ds)
    setCurView('tl')
  }

  // 연도 진행도 계산
  const yr = calY
  const startOfYear = new Date(yr, 0, 1).getTime()
  const endOfYear = new Date(yr + 1, 0, 1).getTime()
  const nowTime = new Date().getTime()
  const yearPct = Math.round(((nowTime - startOfYear) / (endOfYear - startOfYear)) * 100)
  const daysRemain = Math.ceil((endOfYear - nowTime) / (1000 * 60 * 60 * 24))

  // 그리드 계산
  const firstDay = new Date(calY, calM, 1).getDay()
  const daysInMonth = new Date(calY, calM + 1, 0).getDate()
  const daysInPrevMonth = new Date(calY, calM, 0).getDate()

  const cells: Array<{ ds: string; dayNum: number; isOther: boolean }> = []

  // 이전 달 빈 칸
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrevMonth - firstDay + 1 + i
    const prevM = calM === 0 ? 11 : calM - 1
    const prevY = calM === 0 ? calY - 1 : calY
    const ds = prevY + '-' + pad(prevM + 1) + '-' + pad(d)
    cells.push({ ds, dayNum: d, isOther: true })
  }

  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = calY + '-' + pad(calM + 1) + '-' + pad(d)
    cells.push({ ds, dayNum: d, isOther: false })
  }

  // 다음 달 빈 칸
  const total = cells.length
  const remain = total % 7 === 0 ? 0 : 7 - (total % 7)
  for (let i = 1; i <= remain; i++) {
    const nextM = calM === 11 ? 0 : calM + 1
    const nextY = calM === 11 ? calY + 1 : calY
    const ds = nextY + '-' + pad(nextM + 1) + '-' + pad(i)
    cells.push({ ds, dayNum: i, isOther: true })
  }

  // 날짜별 블록 계산 함수
  function getDayBlocks(ds: string): Block[] {
    const real = blocks.filter(
      (b) => (b.type === 'timeline' || (!b.type && !b.isBuf)) && b.date === ds && !b.isBuf,
    )
    const recurBlocks = generateRecurringBlocks(ds, recurring, blocks)
    const all = [...real, ...recurBlocks]
    return catFilter ? all.filter((b) => b.category === catFilter) : all
  }

  const selectedDs = selDate

  return (
    <div className="cal-wrap">
      {/* 연도 진행 바 */}
      <div
        style={{
          textAlign: 'center',
          padding: '10px 12px',
          background: 'var(--pl)',
          borderRadius: '12px',
          marginBottom: '10px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
          {yr}년 {yearPct}% 달려왔어! 남은 {daysRemain}일 화이팅! 💪
        </div>
        <div style={{ position: 'relative', height: '28px', background: '#f0f0f0', borderRadius: '14px', overflow: 'visible' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: yearPct + '%',
              background: 'linear-gradient(90deg, var(--pink), var(--pd))',
              borderRadius: '14px',
              transition: 'width .5s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${Math.max(yearPct - 2, 0)}% - 10px)`,
              top: '50%',
              transform: 'translateY(-50%) scaleX(-1)',
              fontSize: '22px',
              zIndex: 2,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.2))',
            }}
          >
            🏃‍♀️
          </div>
          <div
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px',
            }}
          >
            🚩
          </div>
        </div>
      </div>

      {/* 헤더: 월 네비게이션 */}
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <div className="cal-title">{calY}년 {MONTH[calM]}</div>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <button
          className={'cat-pill' + (catFilter === '' ? ' active' : '')}
          style={catFilter === '' ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : {}}
          onClick={() => setCatFilter('')}
        >전체</button>
        {categories.map((c) => (
          <button
            key={c.name}
            className={'cat-pill' + (catFilter === c.name ? ' active' : '')}
            style={catFilter === c.name
              ? { background: c.color, color: '#fff', borderColor: c.color }
              : { color: c.color, borderColor: c.color }}
            onClick={() => setCatFilter(catFilter === c.name ? '' : c.name)}
          >{c.name}</button>
        ))}
        <button
          className="cat-pill"
          style={{ color: '#aaa', borderColor: '#ddd', fontSize: 11 }}
          onClick={() => setShowCatEdit(true)}
        >✏️</button>
      </div>
      {showCatEdit && (
        <CatEditModal
          onClose={() => setShowCatEdit(false)}
          onChange={() => setCategories(getCategories())}
        />
      )}

      {/* 요일 헤더 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px',
          padding: '0 1px',
        }}
      >
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: i === 0 ? '#E24B4A' : i === 6 ? '#378ADD' : '#999',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          const dow = idx % 7
          const dayBlocks = cell.isOther ? [] : getDayBlocks(cell.ds)
          return (
            <DayCell
              key={cell.ds + '-' + idx}
              ds={cell.ds}
              dayNum={cell.dayNum}
              isToday={cell.ds === today}
              isSelected={cell.ds === selDate && !cell.isOther}
              isPast={!cell.isOther && cell.ds < today}
              isOther={cell.isOther}
              dow={dow}
              dayBlocks={dayBlocks}
              onClick={handleDayClick}
            />
          )
        })}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDs && (
        <CalDetail
          ds={selectedDs}
          dayBlocks={getDayBlocks(selectedDs)}
          onGoTimeline={handleGoTimeline}
        />
      )}

      {/* 언젠가 할 것들 (DeskDump) */}
      <DeskDump />
    </div>
  )
}

function DeskDump() {
  const blocks = useAppStore((s) => s.blocks)
  const addBlock = useAppStore((s) => s.addBlock)
  const toggleDone = useAppStore((s) => s.toggleDone)
  const deleteBlock = useAppStore((s) => s.deleteBlock)
  const [input, setInput] = useState('')

  const items = blocks.filter((b) => b.type === 'inbox' && (b.priority === 'someday' || !b.priority))
  const todo = items.filter((b) => !b.done)
  const done = items.filter((b) => b.done)

  function handleAdd() {
    const txt = input.trim()
    if (!txt) return
    addBlock({
      id: nid(), type: 'inbox', name: txt, priority: null,
      done: false, memo: '', category: '', deadline: null,
      date: '', startHour: 0, durHour: 1, color: 'pink',
    })
    setInput('')
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--pl)', paddingTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>📝 언젠가 할 것들</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd() }}
          placeholder="메모..."
          style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={handleAdd}
          className="pomo-btn"
          style={{ padding: '4px 10px', fontSize: 11 }}
        >+</button>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', padding: 8 }}>아직 없어 ✨</div>
      ) : (
        <>
          {todo.slice(0, 10).map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--pl)' }}>
              <input
                type="checkbox"
                checked={false}
                onChange={() => {
                  toggleDone(b.id)
                  window.dispatchEvent(new CustomEvent('ff-block-done', { detail: b.id }))
                }}
                style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: '#555', flex: 1 }}>{b.name}</span>
              <button onClick={() => deleteBlock(b.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          ))}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 8, marginBottom: 4 }}>완료 {done.length}개</div>
              {done.slice(0, 5).map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', opacity: .5 }}>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleDone(b.id)}
                    style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, color: '#aaa', flex: 1, textDecoration: 'line-through' }}>{b.name}</span>
                  <button onClick={() => deleteBlock(b.id)} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
