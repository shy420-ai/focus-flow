import { useState, useEffect } from 'react'
import type { Block } from '../../types/block'
import type { RecurringTask } from '../../types/recurring'
import { nid } from '../../lib/id'
import { parse } from '../../lib/parser'
import { useAppStore } from '../../store/AppStore'
import { todayStr, fmtH } from '../../lib/date'
import { getCategories } from '../../lib/categories'
import { CatEditModal } from '../ui/CatEditModal'
import { useBackClose } from '../../hooks/useBackClose'
import type { Category } from '../../constants/categories'

interface AddBlockSheetProps {
  isOpen: boolean
  onClose: () => void
  onQuickEmpty?: (id: string) => void
}

function freeSlotLocal(blocks: Block[], date: string, dur: number, fixed: number | null): number {
  if (fixed !== null && fixed !== undefined) return fixed
  const used = blocks
    .filter((b) => (b.type === 'timeline' || (!b.type && !b.isBuf)) && b.date === date && !b.isBuf)
    .map((b) => ({ s: b.startHour, e: b.startHour + b.durHour }))
    .sort((a, b) => a.s - b.s)
  let c = 9
  for (const u of used) {
    if (u.s >= c + dur) break
    if (u.e > c) c = u.e
  }
  return Math.min(c, 23)
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function AddBlockSheet({ isOpen, onClose, onQuickEmpty }: AddBlockSheetProps) {
  const blocks = useAppStore((s) => s.blocks)
  const curDate = useAppStore((s) => s.curDate)
  const addBlock = useAppStore((s) => s.addBlock)
  const addRecurring = useAppStore((s) => s.addRecurring)
  useBackClose(isOpen, onClose)

  const [input, setInput] = useState('')
  const [date, setDate] = useState(curDate)
  const [startTime, setStartTime] = useState('')
  const [durH, setDurH] = useState('1')
  const [durM, setDurM] = useState('0')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>(getCategories)
  const [showCatEdit, setShowCatEdit] = useState(false)

  // 반복 UI 상태
  const [recurOn, setRecurOn] = useState(false)
  const [recurDays, setRecurDays] = useState<number[]>([])

  useEffect(() => {
    function onCatsChanged() { setCategories(getCategories()) }
    window.addEventListener('ff-cats-changed', onCatsChanged)
    return () => window.removeEventListener('ff-cats-changed', onCatsChanged)
  }, [])

  const parsed = input.trim() ? parse(input) : null
  const detectedDays = parsed?.recurDays ?? null

  function toggleRecurDay(d: number) {
    setRecurDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    )
  }

  function resetForm() {
    setInput('')
    setStartTime('')
    setDurH('1')
    setDurM('0')
    setCategory('')
    setRecurOn(false)
    setRecurDays([])
  }

  function handleAdd() {
    const p = parse(input || '새 블록')
    const targetDate = date || p.date || todayStr()
    const durHour = (parseInt(durH) || 0) + (parseInt(durM) || 0) / 60 || p.durHour

    let startHour: number
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number)
      startHour = h + m / 60
    } else {
      startHour = freeSlotLocal(blocks, targetDate, durHour, p.startHour)
    }

    const name = input.trim() || p.name
    const effectiveDays = recurOn ? (recurDays.length > 0 ? recurDays : detectedDays ?? []) : []

    if (recurOn && effectiveDays.length > 0) {
      const task: RecurringTask = {
        id: nid(),
        name,
        days: effectiveDays,
        startHour,
        durHour,
        color: 'pink',
        category,
        memo: '',
        exceptions: [],
      }
      addRecurring(task)
    } else {
      const newBlock: Block = {
        id: nid(),
        type: 'timeline',
        name,
        date: targetDate,
        startHour,
        durHour,
        color: 'pink',
        done: false,
        memo: '',
        category,
        deadline: null,
        priority: null,
      }
      addBlock(newBlock)
    }

    resetForm()
    onClose()
  }

  function handleQuickAdd() {
    if (!input.trim()) return
    const p = parse(input)
    const effectiveDays = recurOn ? (recurDays.length > 0 ? recurDays : detectedDays ?? []) : []

    if (recurOn && effectiveDays.length > 0) {
      const startHour = freeSlotLocal(blocks, p.date, p.durHour, p.startHour)
      const task: RecurringTask = {
        id: nid(),
        name: p.name,
        days: effectiveDays,
        startHour,
        durHour: p.durHour,
        color: 'pink',
        category,
        memo: '',
        exceptions: [],
      }
      addRecurring(task)
    } else {
      const startHour = freeSlotLocal(blocks, p.date, p.durHour, p.startHour)
      const newBlock: Block = {
        id: nid(),
        type: 'timeline',
        name: p.name,
        date: p.date,
        startHour,
        durHour: p.durHour,
        color: 'pink',
        done: false,
        memo: '',
        category,
        deadline: null,
        priority: null,
      }
      addBlock(newBlock)
    }

    resetForm()
    onClose()
  }

  function handleQuickEmpty() {
    const now = new Date()
    const startHour = now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0)
    const id = nid()
    addBlock({
      id,
      type: 'timeline',
      name: '',
      date: curDate,
      startHour,
      durHour: 1,
      color: 'pink',
      done: false,
      memo: '',
      category: '',
      deadline: null,
      priority: null,
    })
    onQuickEmpty?.(id)
  }

  function handleInputChange(v: string) {
    setInput(v)
    if (/매주|매일/.test(v)) {
      setRecurOn(true)
      const p = parse(v)
      if (p.recurDays) setRecurDays(p.recurDays)
    }
  }

  return (
    <>
      <div
        className={'overlay' + (isOpen ? ' show' : '')}
        onClick={onClose}
      />
      <div className={'sheet' + (isOpen ? ' show' : '')}>
        <div className="sh" />
        <div className="sheet-title">할 일 추가</div>

        <button
          onClick={handleQuickEmpty}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px dashed var(--pink)', background: 'var(--pl)', color: 'var(--pd)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
        >⚡ 빈 블록 바로 추가</button>

        <div
          style={{
            fontSize: '10px',
            color: 'var(--pd)',
            background: 'var(--pl)',
            borderRadius: '8px',
            padding: '6px 10px',
            marginBottom: '8px',
            lineHeight: 1.6,
          }}
        >
          🧠 제목 날짜 시작시간 소요 →{' '}
          <span
            style={{ display: 'inline', padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
            onClick={() => setInput('보고서 430 14시 1시간')}
          >보고서 430 14시 1시간</span>
          {' '}← 터치
        </div>

        <textarea
          className="ri"
          placeholder={'제목 날짜 시작시간 소요\n예: 보고서 430 14시 1시간'}
          rows={2}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleQuickAdd()
            }
          }}
          style={{
            width: '100%',
            border: '1.5px solid var(--pink)',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            color: '#333',
            minHeight: '76px',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            outline: 'none',
          }}
        />

        {parsed && (
          <div style={{ fontSize: '11px', color: '#aaa', padding: '4px 6px' }}>
            파싱: {fmtH(parsed.startHour ?? 9)} 시작, {parsed.durHour}시간, {parsed.date}
            {parsed.recurDays && (
              <span style={{ color: 'var(--pd)', marginLeft: '6px' }}>
                반복: {parsed.recurDays.map((d) => DAY_LABELS[d]).join(', ')}
              </span>
            )}
          </div>
        )}

        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--pd)', fontWeight: 600, marginBottom: '3px' }}>📅 날짜</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={recurOn}
              style={{ width: '100%', padding: '8px', border: '1.5px solid var(--pl)', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', height: '38px', boxSizing: 'border-box', opacity: recurOn ? 0.4 : 1 }}
            />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--pd)', fontWeight: 600, marginBottom: '3px' }}>⏰ 시작시간</div>
            <input
              type="time"
              step={900}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: '100%', padding: '8px 4px', border: '1.5px solid var(--pl)', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', height: '38px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--pd)', fontWeight: 600, marginBottom: '3px' }}>⏱ 소요</div>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '38px' }}>
              <select value={durH} onChange={(e) => setDurH(e.target.value)} style={{ flex: 1, padding: '8px 0', border: '1.5px solid var(--pl)', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', textAlign: 'center', height: '38px' }}>
                {[0, 1, 2, 3, 4, 5].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span style={{ fontSize: '8px', color: '#aaa' }}>h</span>
              <select value={durM} onChange={(e) => setDurM(e.target.value)} style={{ flex: 1, padding: '8px 0', border: '1.5px solid var(--pl)', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', textAlign: 'center', height: '38px' }}>
                {[0, 10, 15, 20, 30, 40, 45, 50].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <span style={{ fontSize: '8px', color: '#aaa' }}>m</span>
            </div>
          </div>
        </div>

        {/* 반복 섹션 */}
        <div className="recur-section">
          <div className="recur-toggle">
            <button
              className={'recur-switch' + (recurOn ? ' on' : '')}
              onClick={() => { setRecurOn(!recurOn); if (!recurOn && detectedDays) setRecurDays(detectedDays) }}
            />
            <span className={'recur-toggle-label' + (recurOn ? ' on' : '')}>
              {recurOn ? '반복' : '반복 안 함'}
            </span>
          </div>
          {recurOn && (
            <div className="recur-days">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  className={
                    'recur-day-btn' +
                    (i === 0 ? ' sun' : i === 6 ? ' sat' : '') +
                    (recurDays.includes(i) ? ' active' : '')
                  }
                  onClick={() => toggleRecurDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div style={{ marginTop: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pd)' }}>카테고리</span>
          <button
            onClick={() => setShowCatEdit(true)}
            style={{ fontSize: 10, color: '#aaa', background: 'none', border: '1px solid #eee', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
          >편집</button>
        </div>
        <div className="cat-pills">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={'cat-pill' + (category === cat.name ? ' active' : '')}
              style={category === cat.name ? { background: cat.color, borderColor: cat.color } : { color: cat.color, borderColor: cat.color }}
              onClick={() => setCategory(category === cat.name ? '' : cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button className="cbtn" onClick={handleAdd}>
          {recurOn && (recurDays.length > 0 || detectedDays) ? '반복 추가' : '추가하기'}
        </button>
      </div>

      {showCatEdit && (
        <CatEditModal
          onClose={() => setShowCatEdit(false)}
          onChange={() => setCategories(getCategories())}
        />
      )}
    </>
  )
}
