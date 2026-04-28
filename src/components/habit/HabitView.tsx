import { useState, useRef } from 'react'
import { showConfirm } from '../../lib/showConfirm'
import {
  useHabitStore,
  getHabitStreak,
  getHabitTotalDays,
  isHabitDay,
  getWeekDates,
} from '../../store/HabitStore'
import { addDays } from '../../lib/date'

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const FLOWERS = ['🌱', '🌿', '☘️', '🌷', '🌸', '🌺', '💐']
const FLOWER_NAMES = ['씨앗', '새싹', '줄기', '봉오리', '개화', '만개', '완성!']
const FLOWER_MSGS = [
  '시작이 반이야!',
  '뿌리 내리는 중',
  '뇌가 기억하기 시작해',
  '절반 왔어! 대단해',
  '자동 모드 진입 중',
  '거의 습관이 됐어!',
  '66일 완성! 이제 네 것이야 🎉',
]
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍑', '🍒', '🍓', '🥝']

function computeFlowerLevel(habitId: number, createdAt: string, habitLogs: Record<string, Record<string, boolean>>, totalDays: number): number {
  const created = createdAt
  const daysPassed = Math.max(1, Math.floor((new Date().getTime() - new Date(created + 'T12:00:00').getTime()) / 86400000) + 1)
  const progress = Math.min(daysPassed, 66)
  const totalWeeks = Math.ceil(progress / 7) || 1
  let level = 0
  for (let w = 0; w < totalWeeks; w++) {
    let wc = 0
    for (let d = 0; d < 7; d++) {
      const off = w * 7 + d
      if (off >= progress) break
      const ds = addDays(created, off)
      if (habitLogs[ds]?.[String(habitId)]) wc++
    }
    if (wc >= 5) level = Math.min(level + 1, FLOWERS.length - 1)
    else if (wc < 3) level = Math.max(level - 1, 0)
  }
  if (totalDays >= 66) level = FLOWERS.length - 1
  return level
}

interface ScheduleModalProps {
  name: string
  onConfirm: (days: number[] | null) => void
  onClose: () => void
}

function ScheduleModal({ name, onConfirm, onClose }: ScheduleModalProps) {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  function toggleDay(d: number) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    )
  }

  function confirm() {
    if (mode === 'daily') {
      onConfirm(null)
    } else {
      if (selectedDays.length === 0) { alert('요일을 선택해주세요'); return }
      const days = selectedDays.length === 7 ? null : selectedDays
      onConfirm(days)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 300 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)', marginBottom: 12, textAlign: 'center' }}>{name}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 8 }}>주기 설정</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            className={'cat-pill' + (mode === 'daily' ? ' active' : '')}
            style={mode === 'daily' ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : {}}
            onClick={() => setMode('daily')}
          >매일</button>
          <button
            className={'cat-pill' + (mode === 'weekly' ? ' active' : '')}
            style={mode === 'weekly' ? { background: 'var(--pink)', color: '#fff', borderColor: 'var(--pink)' } : {}}
            onClick={() => setMode('weekly')}
          >요일 선택</button>
        </div>
        {mode === 'weekly' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 12 }}>
            {WEEK_LABELS.map((label, i) => (
              <button
                key={i}
                className={'cat-pill' + (selectedDays.includes(i) ? ' active' : '')}
                style={{
                  padding: '8px 0', textAlign: 'center', fontSize: 12,
                  background: selectedDays.includes(i) ? 'var(--pink)' : '#fff',
                  color: selectedDays.includes(i) ? '#fff' : 'var(--pd)',
                }}
                onClick={() => toggleDay(i)}
              >{label}</button>
            ))}
          </div>
        )}
        <button
          onClick={confirm}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >추가</button>
      </div>
    </div>
  )
}

interface EditNameModalProps {
  habitId: number
  currentName: string
  onSave: (name: string) => void
  onClose: () => void
}

function EditNameModal({ habitId: _habitId, currentName, onSave, onClose }: EditNameModalProps) {
  const [val, setVal] = useState(currentName)
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '80%', maxWidth: 280 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 12, textAlign: 'center' }}>습관 수정</div>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: 10, border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
          onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSave(val.trim())}
        />
        <button
          onClick={() => val.trim() && onSave(val.trim())}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >저장</button>
      </div>
    </div>
  )
}

export function HabitView() {
  const habits = useHabitStore((s) => s.habits)
  const habitLogs = useHabitStore((s) => s.habitLogs)
  const quickMemo = useHabitStore((s) => s.quickMemo)
  const addHabit = useHabitStore((s) => s.addHabit)
  const deleteHabit = useHabitStore((s) => s.deleteHabit)
  const updateHabitName = useHabitStore((s) => s.updateHabitName)
  const toggleLog = useHabitStore((s) => s.toggleLog)
  const setQuickMemo = useHabitStore((s) => s.setQuickMemo)

  const [inputVal, setInputVal] = useState('')
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [tipHidden, setTipHidden] = useState(!!localStorage.getItem('ff_habit_tip_hide'))
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const weekDates = getWeekDates()

  function handleAddHabit() {
    const name = inputVal.trim()
    if (!name) return
    setScheduleFor(name)
    setInputVal('')
  }

  function handleScheduleConfirm(days: number[] | null) {
    if (scheduleFor) {
      addHabit(scheduleFor, days)
    }
    setScheduleFor(null)
  }

  function dismissTip() {
    localStorage.setItem('ff_habit_tip_hide', '1')
    setTipHidden(true)
  }

  function handleMemoChange(val: string) {
    setQuickMemo(val)
    if (memoTimer.current) clearTimeout(memoTimer.current)
    memoTimer.current = setTimeout(() => setQuickMemo(val), 1500)
  }

  const completedHabits = habits.filter((h) => getHabitTotalDays(habitLogs, h.id) >= 66).length

  return (
    <div className="habit-wrap">
      {/* Habit tree */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10, position: 'relative' }}>
        <img src="/tree.png" style={{ width: 180, height: 'auto', display: 'block' }} alt="habit tree" />
        {completedHabits > 0 && (
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 100, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            {Array.from({ length: completedHabits }, (_, i) => (
              <span key={i} style={{ fontSize: 18 }}>{FRUITS[i % FRUITS.length]}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>66일 달성 습관마다 열매가 열려요 🌳</div>
      </div>

      {/* Tip banner */}
      {!tipHidden && (
        <div style={{ fontSize: 10, color: '#aaa', background: 'var(--pl)', borderRadius: 10, padding: '8px 14px', marginBottom: 10, lineHeight: 1.7, textAlign: 'center', position: 'relative' }}>
          🧠 습관이 자동화되려면 평균 66일 <span style={{ fontSize: 9, opacity: .7 }}>(Phillippa Lally, 2009)</span><br />
          연속 아니어도 총 66일 달성하면 완성!
          <button
            onClick={dismissTip}
            style={{ position: 'absolute', top: 4, right: 8, background: 'none', border: 'none', color: '#ccc', fontSize: 14, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Habit add */}
      <div className="habit-section-title">습관 관리</div>
      <div className="habit-input-row">
        <input
          className="habit-input"
          placeholder="새 습관 추가... (Enter)"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddHabit()
          }}
        />
        <button className="habit-add-btn" onClick={handleAddHabit}>+</button>
      </div>

      {/* Habit list */}
      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, padding: '20px 0' }}>아직 등록된 습관이 없어</div>
      ) : (
        habits.map((hab) => {
          const streak = getHabitStreak(habitLogs, hab.id)
          const schedLabel = hab.days ? '주' + hab.days.length : '매일'
          return (
            <div key={hab.id} className="habit-item">
              <div className="habit-top">
                <span
                  className="habit-name"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setEditingId(hab.id)}
                >{hab.name}</span>
                {streak > 0 && <span className="habit-streak">🔥 {streak}일</span>}
                <span style={{ fontSize: 9, color: '#aaa', marginLeft: 4 }}>{schedLabel}</span>
                <button
                  className="habit-del"
                  onClick={() => {
                    showConfirm(hab.name + ' 습관을 삭제할까요?').then((ok) => { if (ok) deleteHabit(hab.id) })
                  }}
                >✕</button>
              </div>
              <div className="habit-week">
                {weekDates.map((wd, i) => {
                  const filled = !!habitLogs[wd]?.[String(hab.id)]
                  const active = isHabitDay(hab, wd)
                  return (
                    <div key={wd} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <div className="habit-week-label" style={active ? {} : { color: '#ddd' }}>{WEEK_LABELS[i]}</div>
                      {active ? (
                        <div
                          className={'habit-week-cell' + (filled ? ' filled' : '')}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleLog(hab.id, wd)}
                        />
                      ) : (
                        <div className="habit-week-cell" style={{ background: '#f5f5f5', opacity: .3 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* 66일 챌린지 */}
      {habits.length > 0 && (
        <div style={{ marginTop: 16, padding: 14, background: 'linear-gradient(135deg,var(--pl),#fff)', borderRadius: 14, border: '1.5px solid var(--pink)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 10 }}>🏆 66일 챌린지</div>
          {habits.map((hab) => {
            const created = hab.createdAt
            const daysPassed = Math.max(1, Math.floor((new Date().getTime() - new Date(created + 'T12:00:00').getTime()) / 86400000) + 1)
            const totalDays = 66
            const progress = Math.min(daysPassed, totalDays)
            const actualTotal = getHabitTotalDays(habitLogs, hab.id)
            const totalWeeks = Math.ceil(progress / 7) || 1
            let totalChecked = 0
            for (let w = 0; w < totalWeeks; w++) {
              for (let d = 0; d < 7; d++) {
                const off = w * 7 + d
                if (off >= progress) break
                const ds = addDays(created, off)
                if (habitLogs[ds]?.[String(hab.id)]) totalChecked++
              }
            }
            const finalChecked = Math.max(totalChecked, actualTotal)
            const pct = Math.round(Math.min(finalChecked, totalDays) / totalDays * 100)
            const flowerLevel = computeFlowerLevel(hab.id, created, habitLogs, finalChecked)
            const flower = FLOWERS[flowerLevel]
            const flowerName = FLOWER_NAMES[flowerLevel]
            const flowerMsg = FLOWER_MSGS[flowerLevel]
            const scheduleLabel = hab.days
              ? '주 ' + hab.days.length + '회 (' + hab.days.map((d) => WEEK_LABELS[d]).join('') + ')'
              : '매일'

            return (
              <div key={hab.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{hab.name}</div>
                  <div style={{ fontSize: 36, lineHeight: 1, transition: 'all .3s' }}>{flower}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--pd)', fontWeight: 600 }}>{flowerName}</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>{flowerMsg}</div>
                  </div>
                </div>
                {/* Flower stage indicator */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                  {FLOWERS.map((f, i) => (
                    <span key={i}>
                      <span style={{ fontSize: i === flowerLevel ? 20 : 14, opacity: i <= flowerLevel ? 1 : 0.25, transition: 'all .3s', display: 'inline-block', transform: i === flowerLevel ? 'scale(1.2)' : 'none' }}>{f}</span>
                      {i < FLOWERS.length - 1 && (
                        <span style={{ display: 'inline-block', width: 8, height: 2, background: i < flowerLevel ? 'var(--pd)' : 'var(--pl)', borderRadius: 1, verticalAlign: 'middle', margin: '0 0 0 0' }} />
                      )}
                    </span>
                  ))}
                </div>
                {/* 66-day dot grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
                  {Array.from({ length: totalDays }, (_, i) => {
                    if (i < finalChecked) {
                      const ratio = i / totalDays
                      const opacity = 0.4 + ratio * 0.6
                      return <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--pink)', opacity }} />
                    }
                    return <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--pl)' }} />
                  })}
                </div>
                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--pl)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'var(--pd)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--pd)', fontWeight: 600, whiteSpace: 'nowrap' }}>{finalChecked}/{totalDays}일 달성</span>
                </div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                  {scheduleLabel} · D+{daysPassed} · 연속 {getHabitStreak(habitLogs, hab.id)}일{finalChecked >= 66 ? ' · ✅ 66일 달성!' : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Memo */}
      <div style={{ marginTop: 16, padding: 14, background: 'var(--pl)', borderRadius: 14, border: '1.5px solid var(--pink)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 10 }}>📝 메모</div>
        <textarea
          placeholder="자유롭게 메모하세요..."
          value={quickMemo}
          onChange={(e) => handleMemoChange(e.target.value)}
          style={{ width: '100%', minHeight: 80, border: '1.5px solid var(--pink)', borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#333' }}
        />
      </div>

      {/* Modals */}
      {scheduleFor !== null && (
        <ScheduleModal
          name={scheduleFor}
          onConfirm={handleScheduleConfirm}
          onClose={() => setScheduleFor(null)}
        />
      )}
      {editingId !== null && (
        <EditNameModal
          habitId={editingId}
          currentName={habits.find((h) => h.id === editingId)?.name || ''}
          onSave={(name) => { updateHabitName(editingId, name); setEditingId(null) }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
