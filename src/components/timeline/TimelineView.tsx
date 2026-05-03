import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/AppStore'
import { todayStr, fmtH, addDays } from '../../lib/date'
import { NowLine } from './NowLine'
import { TimeBlock } from './TimeBlock'
import { AddBlockSheet } from './AddBlockSheet'
import { EditBlockModal } from './EditBlockModal'
import { getHoroscopeText } from '../../lib/saju'
import { DailyTipCard } from './DailyTipCard'
import { getDailyWidgetPref, type DailyWidgetPref } from '../../lib/dailyTip'
import { generateRecurringBlocks } from '../../lib/recurring'
import { showMiniToast } from '../../lib/miniToast'
import { CopyDayModal } from './CopyDayModal'
import { useDraggableFab } from '../../hooks/useDraggableFab'
import { useBackClose } from '../../hooks/useBackClose'
import { isDevMode } from '../../lib/devMode'
import type { Block } from '../../types/block'

type DayMode = 'low' | 'normal' | 'good'
function loadDayMode(): DayMode {
  const v = localStorage.getItem('ff_day_mode')
  return v === 'low' || v === 'good' ? v : 'normal'
}

function BirthdayModal({ onClose }: { onClose: () => void }) {
  const [year, setYear] = useState(localStorage.getItem('ff_birthyear') || '')
  const [md, setMd] = useState(localStorage.getItem('ff_birthday') || '')
  useBackClose(true, onClose)

  function save() {
    if (!year || !/^\d{4}$/.test(year)) { showMiniToast('년도를 확인해주세요'); return }
    if (!md || !/^\d{1,2}-\d{1,2}$/.test(md)) { showMiniToast('월-일을 확인해주세요'); return }
    localStorage.setItem('ff_birthyear', year)
    localStorage.setItem('ff_birthday', md)
    Object.keys(localStorage).filter((k) => k.startsWith('ff_horo_')).forEach((k) => localStorage.removeItem(k))
    window.dispatchEvent(new CustomEvent('ff-birthday-set'))
    showMiniToast('🔮 생일 저장!')
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '85%', maxWidth: 300 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--pd)', marginBottom: 16, textAlign: 'center' }}>🔮 생일 입력</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>태어난 년도</div>
          <input
            type="number"
            placeholder="2000"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pd)', marginBottom: 4 }}>생일 (월-일, 양력 기준)</div>
          <input
            placeholder="01-15"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            style={{ width: '100%', padding: 10, border: '1.5px solid var(--pl)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ fontSize: 9, color: '#aaa', marginBottom: 14, textAlign: 'center' }}>※ 음력이면 양력으로 변환해서 입력해주세요</div>
        <button
          onClick={save}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >저장</button>
      </div>
    </div>
  )
}

const DEFAULT_START = 6
const DEFAULT_HOURS = 18
const DEFAULT_PX = 140

function loadTlSettings() {
  return {
    start: parseInt(localStorage.getItem('ff_tl_start') || String(DEFAULT_START)),
    hours: parseInt(localStorage.getItem('ff_tl_hours') || String(DEFAULT_HOURS)),
    px: parseInt(localStorage.getItem('ff_px') || String(DEFAULT_PX)),
  }
}

interface MemoSheetState {
  id: string
  memo: string
}

export function TimelineView() {
  const blocks = useAppStore((s) => s.blocks)
  const curDate = useAppStore((s) => s.curDate)
  const updateBlock = useAppStore((s) => s.updateBlock)
  const recurring = useAppStore((s) => s.recurring)

  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [memoState, setMemoState] = useState<MemoSheetState | null>(null)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const { bind: bindAddFab, fabStyle: addFabStyle, isDragging: addFabDragging } = useDraggableFab('ff_add_fab_pos', { x: window.innerWidth - 80, y: window.innerHeight - 90 })
  const [editId, setEditId] = useState<string | null>(null)
  const [newBlockId, setNewBlockId] = useState<string | null>(null)
  const [nudgeBar, setNudgeBar] = useState<{ text: string; type: string } | null>(null)
  const [tipHidden, setTipHidden] = useState(!!localStorage.getItem('ff_tip_hidden'))
  const [tlSettings, setTlSettings] = useState(loadTlSettings)
  const [showBirthdayModal, setShowBirthdayModal] = useState(false)

  useEffect(() => {
    function onRange(e: Event) {
      const d = (e as CustomEvent).detail as { start: number; hours: number }
      setTlSettings((prev) => ({ ...prev, start: d.start, hours: d.hours }))
    }
    function onPx(e: Event) {
      const val = (e as CustomEvent).detail as number
      setTlSettings((prev) => ({ ...prev, px: val }))
    }
    window.addEventListener('ff-tl-range', onRange)
    window.addEventListener('ff-tl-px', onPx)
    return () => {
      window.removeEventListener('ff-tl-range', onRange)
      window.removeEventListener('ff-tl-px', onPx)
    }
  }, [])

  const { start: START, hours: HOURS, px: PX } = tlSettings
  const timelineRef = useRef<HTMLDivElement>(null)
  // Drag-to-create: long-press (350ms) on empty area arms create mode,
  // then vertical drag draws the preview. Long-press requirement is
  // what separates this from a normal scroll touch.
  const dragCreateRef = useRef<{
    startHour: number
    startY: number
    pointerId: number
    armed: boolean
    armTimer: ReturnType<typeof setTimeout> | null
  } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ startHour: number; durHour: number } | null>(null)
  // Past-hours collapse — only applies to today. Default collapsed so the
  // user lands at "current hour" without a wall of finished slots above.
  const [pastCollapsed, setPastCollapsed] = useState<boolean>(true)
  const isToday = curDate === todayStr()
  const nowHour = new Date().getHours()
  // When collapsed, start the visible timeline at the current hour. When
  // expanded (or viewing another day), use the configured START.
  const displayStart = (isToday && pastCollapsed)
    ? Math.max(START, Math.min(START + HOURS - 1, nowHour))
    : START
  const displayHours = START + HOURS - displayStart
  const hiddenPastHours = displayStart - START

  // Auto-scroll-to-now removed per user request — they want to land
  // wherever they last scrolled, not be jumped down on every visit.
  const [cycleBar, setCycleBar] = useState<{ bg: string; color: string; text: string } | null>(null)
  const [horoscopeText, setHoroscopeText] = useState<string | null>(null)
  const [horoscopeHint, setHoroscopeHint] = useState<'no-birthday' | 'no-year' | null>(null)
  const [widgetPref, setWidgetPref] = useState<DailyWidgetPref>(getDailyWidgetPref)
  useEffect(() => {
    function onChange() { setWidgetPref(getDailyWidgetPref()) }
    window.addEventListener('ff-daily-widget-changed', onChange)
    return () => window.removeEventListener('ff-daily-widget-changed', onChange)
  }, [])
  const [dayMode] = useState<DayMode>(loadDayMode)


  useEffect(() => {
    function loadHoroscope() {
      const bday = localStorage.getItem('ff_birthday')
      const byear = localStorage.getItem('ff_birthyear')
      if (!bday) {
        setHoroscopeHint('no-birthday')
        setHoroscopeText(null)
      } else if (!byear) {
        setHoroscopeHint('no-year')
        setHoroscopeText(null)
      } else {
        setHoroscopeHint(null)
        setHoroscopeText(getHoroscopeText())
      }
    }
    loadHoroscope()
    window.addEventListener('ff-birthday-set', loadHoroscope)
    return () => window.removeEventListener('ff-birthday-set', loadHoroscope)
  }, [])

  useEffect(() => {
    function computeCycleBar() {
      try {
        const data = JSON.parse(localStorage.getItem('ff_cycle') || 'null')
        if (!data?.starts?.length) { setCycleBar(null); return }
        const lastStart = data.starts[data.starts.length - 1]
        const daysSince = Math.round((new Date(todayStr() + 'T12:00:00').getTime() - new Date(lastStart + 'T12:00:00').getTime()) / 86400000) + 1
        const cycleDay = ((daysSince - 1) % data.avgCycle) + 1
        if (cycleDay >= 1 && cycleDay <= 5) {
          setCycleBar({ bg: '#F8D0D0', color: '#C45A78', text: `🩸 생리 ${cycleDay}일차 — 무리하지 마. 가벼운 일 위주로 해도 충분해!` })
        } else if (cycleDay >= data.avgCycle - 4) {
          const dleft = data.avgCycle - cycleDay + 1
          setCycleBar({ bg: '#FFF3E0', color: '#B8720A', text: `⚠️ PMS 기간 (생리까지 D-${dleft}) — 컨디션 관리 기간. 하나만 해도 괜찮아 💛` })
        } else {
          const daysUntilPeriod = data.avgCycle - cycleDay + 1
          if (daysUntilPeriod <= 7) {
            setCycleBar({ bg: '#FFF3E0', color: '#B8720A', text: `📅 생리 D-${daysUntilPeriod} — 컨디션 변화에 주의해` })
          } else {
            setCycleBar({ bg: 'var(--pl)', color: 'var(--pd)', text: `🌸 ${cycleDay}일차 / 다음 생리 D-${daysUntilPeriod}` })
          }
        }
      } catch { setCycleBar(null) }
    }
    computeCycleBar()
    window.addEventListener('ff-cycle-changed', computeCycleBar)
    return () => window.removeEventListener('ff-cycle-changed', computeCycleBar)
  }, [])

  useEffect(() => {
    function checkNudge() {
      const hour = new Date().getHours()
      const today = todayStr()
      const tomorrow = addDays(today, 1)
      const isNight = hour >= 21 && hour <= 23
      const isLateNight = hour >= 0 && hour <= 5
      const isMorning = hour >= 6 && hour <= 9
      if (!isNight && !isLateNight && !isMorning) { setNudgeBar(null); return }
      const todayB = blocks.filter((b) => b.date === today && !b.isBuf && (b.type === 'timeline' || !b.type))
      const tomorrowB = blocks.filter((b) => b.date === tomorrow && !b.isBuf && (b.type === 'timeline' || !b.type))
      if (isNight && tomorrowB.length > 0) { setNudgeBar(null); return }
      if ((isLateNight || isMorning) && todayB.length > 0) { setNudgeBar(null); return }
      const nudgeKey = 'ff_plan_nudge_' + today + (isNight ? '_night' : '_today')
      if (localStorage.getItem(nudgeKey)) { setNudgeBar(null); return }
      const msg = isNight
        ? '🌙 자기 전 5분!<br/>미리 계획을 적어두면<br/>실행률이 올라가요'
        : isLateNight ? '🦉 아직 안 잤어?<br/>미리 계획을 적어두면<br/>아침 의지력을 아낄 수 있어'
        : '☀️ 좋은 아침!<br/>3개만 정하면 시작이 쉬워져'
      setNudgeBar({ text: msg, type: isNight ? 'night' : 'today' })
    }
    checkNudge()
    const iv = setInterval(checkNudge, 300000)
    return () => clearInterval(iv)
  }, [blocks])

  const today = todayStr()

  // Filter blocks for current date (includes recurring blocks)
  const realBlocks: Block[] = blocks.filter(
    (b) =>
      (b.type === 'timeline' || (!b.type && !b.isBuf)) &&
      b.date === curDate &&
      !b.isBuf,
  )
  const recurBlocks: Block[] = generateRecurringBlocks(curDate, recurring, blocks)
  const timelineBlocks: Block[] = [...realBlocks, ...recurBlocks].sort(
    (a, b) => a.startHour - b.startHour,
  )

  function handleMemoOpen(id: string) {
    const block = blocks.find((b) => b.id === id)
    if (block) {
      setMemoState({ id, memo: block.memo })
    }
  }

  function handleMemoSave() {
    if (!memoState) return
    updateBlock(memoState.id, { memo: memoState.memo })
    setMemoState(null)
  }

  return (
    <div className="tl-wrap">
      {/* 일간 위젯 — 설정에서 사주 / 오늘의 팁 / 없음 토글 */}
      {widgetPref === 'tip' ? (
        <DailyTipCard />
      ) : widgetPref === 'saju' ? (
        horoscopeText ? (
          <div
            onClick={() => setShowBirthdayModal(true)}
            style={{ padding: '6px 14px', fontSize: 12, color: 'var(--pd)', background: 'var(--pl)', borderRadius: 10, margin: '0 0 16px', lineHeight: 1.45, textAlign: 'center', cursor: 'pointer' }}
            dangerouslySetInnerHTML={{ __html: horoscopeText }}
          />
        ) : horoscopeHint === 'no-birthday' ? (
          <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--pd)', background: 'var(--pl)', borderRadius: 10, margin: '0 0 16px', lineHeight: 1.45, textAlign: 'center' }}>
            ⭐ <span onClick={() => setShowBirthdayModal(true)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>생일 입력하면 오늘의 운세를 볼 수 있어!</span>
          </div>
        ) : horoscopeHint === 'no-year' ? (
          <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--pd)', background: 'var(--pl)', borderRadius: 10, margin: '0 0 16px', lineHeight: 1.45, textAlign: 'center' }}>
            🔮 <span onClick={() => setShowBirthdayModal(true)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>태어난 년도를 추가 입력하면 사주 운세도 볼 수 있어!</span>
          </div>
        ) : null
      ) : null}
      {/* 사용 팁 — 그리드 위에 표시 (원본 tip-bar 위치) */}
      {!tipHidden && (
        <div style={{ margin: '8px 16px 0' }}>
          <div style={{ background: '#fff', border: '1.5px solid var(--pink)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px color-mix(in srgb, var(--pink) 15%, transparent)' }}>
            <div style={{ background: 'var(--pink)', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>📌 타임라인 사용 팁</span>
              <button onClick={() => { localStorage.setItem('ff_tip_hidden', '1'); setTipHidden(true) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#555', lineHeight: 2 }}>
              <div>👆 빈 칸 <b>두 번 탭</b> → 해당 시간에 블록 바로 추가</div>
              <div>↕️ 블록 하단 핸들 <b>드래그</b> → 시간 늘리기/줄이기</div>
              <div>✊ 블록 <b>꾹 누르고 드래그</b> → 블록 이동</div>
            </div>
          </div>
        </div>
      )}
      {/* 너지 바 — 인라인, 원본 nudge-bar 위치 */}
      {nudgeBar && (
        <div style={{ padding: '10px 16px', fontSize: 12, color: '#fff', background: 'var(--pd)', borderRadius: 10, margin: '4px 16px 0', textAlign: 'center', lineHeight: 1.5 }}>
          <div dangerouslySetInnerHTML={{ __html: nudgeBar.text }} />
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#fff', color: 'var(--pd)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => {
                const key = 'ff_plan_nudge_' + today + (nudgeBar.type === 'night' ? '_night' : '_today')
                localStorage.setItem(key, '1')
                setNudgeBar(null)
              }}
            >{nudgeBar.type === 'night' ? '내일 계획' : '오늘 계획'}</button>
            <button
              style={{ padding: '5px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,.3)', color: 'rgba(255,255,255,.7)', fontSize: 11, cursor: 'pointer' }}
              onClick={() => {
                const key = 'ff_plan_nudge_' + today + (nudgeBar.type === 'night' ? '_night' : '_today')
                localStorage.setItem(key, '1')
                setNudgeBar(null)
              }}
            >닫기</button>
          </div>
        </div>
      )}
      {/* 사이클 바 */}
      {cycleBar && (
        <div style={{ padding: '8px 16px', fontSize: 12, borderRadius: 10, margin: '4px 16px 0', lineHeight: 1.5, textAlign: 'center', background: cycleBar.bg, color: cycleBar.color }}>
          {cycleBar.text}
        </div>
      )}
      {/* Copy yesterday's schedule (with selection) when today is empty */}
      {(() => {
        const todayBlocks = blocks.filter((b) => b.date === curDate && !b.isBuf && (b.type === 'timeline' || !b.type))
        if (todayBlocks.length > 0) return null
        const yesterday = addDays(curDate, -1)
        const yesterdayBlocks = blocks.filter((b) => b.date === yesterday && !b.isBuf && (b.type === 'timeline' || !b.type))
        if (yesterdayBlocks.length === 0) return null
        return (
          <button
            onClick={() => setCopyModalOpen(true)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 14,
              border: '1.5px dashed var(--pink)',
              background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 50%, #fff))',
              color: 'var(--pd)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>어제 일정 {yesterdayBlocks.length}개에서 골라 복사</span>
                <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>원하는 것만 체크해서 가져와</span>
              </span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700 }}>골라 복사</span>
          </button>
        )
      })()}

      {/* Past-hours collapse toggle — only visible on today's timeline */}
      {isToday && hiddenPastHours > 0 && (
        <button
          onClick={() => setPastCollapsed(false)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, var(--pl), color-mix(in srgb, var(--pl) 50%, #fff))',
            color: 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,.04)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 14, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>↑</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>지난 {hiddenPastHours}시간</span>
              <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>{START}:00 ~ {displayStart}:00</span>
            </span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700 }}>펼치기</span>
        </button>
      )}
      {isToday && !pastCollapsed && (
        <button
          onClick={() => setPastCollapsed(true)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 12,
            border: 'none', background: '#FAFAFA',
            color: '#888', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
          }}
        >↓ 지난 시간 접기</button>
      )}
      <div className="timeline" ref={timelineRef}>
        {/* Time column */}
        <div className="time-col">
          {Array.from({ length: displayHours + 1 }, (_, i) => {
            const hour = displayStart + i
            return (
              <div key={hour} className="time-tick" style={{ height: `${PX}px` }}>
                <span>{hour}:00</span>
                {i < displayHours && (
                  <span
                    className="half-label"
                    style={{ position: 'absolute', bottom: PX / 2 - 5, right: 0, fontSize: '8px', color: '#ccc', paddingRight: '8px' }}
                  >
                    :30
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Blocks column */}
        <div
          className="blocks-col"
          style={{ position: 'relative', height: `${displayHours * PX}px` }}
          onClick={() => setActiveMenu(null)}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return
            if (e.button !== 0) return
            const rect = e.currentTarget.getBoundingClientRect()
            const startY = e.clientY - rect.top
            const startHour = displayStart + Math.max(0, startY) / PX
            // 350ms timer flips armed flag + shows preview.
            // setPointerCapture is deferred to the next live pointermove
            // (more reliable than calling from a timeout).
            const timer = setTimeout(() => {
              const d = dragCreateRef.current
              if (!d) return
              d.armed = true
              setDragPreview({ startHour: d.startHour, durHour: 10/60 })
              if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                try { navigator.vibrate(10) } catch { /* ignore */ }
              }
            }, 350)
            dragCreateRef.current = { startHour, startY, pointerId: e.pointerId, armed: false, armTimer: timer }
          }}
          onPointerMove={(e) => {
            const d = dragCreateRef.current
            if (!d || d.pointerId !== e.pointerId) return
            const rect = e.currentTarget.getBoundingClientRect()
            const relY = e.clientY - rect.top
            // Pre-arm: vertical movement > 12px = it's a scroll → cancel.
            if (!d.armed) {
              if (Math.abs(relY - d.startY) > 12) {
                if (d.armTimer) clearTimeout(d.armTimer)
                dragCreateRef.current = null
              }
              return
            }
            // Armed: capture pointer on first live move (reliable here).
            try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* ignore */ }
            const cur = displayStart + Math.max(0, relY) / PX
            const a = Math.min(d.startHour, cur)
            const b = Math.max(d.startHour, cur)
            const snap = (h: number) => Math.round(h * 6) / 6
            setDragPreview({ startHour: snap(a), durHour: Math.max(snap(b - a), 10/60) })
          }}
          onPointerUp={(e) => {
            try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
            const d = dragCreateRef.current
            if (d?.armTimer) clearTimeout(d.armTimer)
            dragCreateRef.current = null
            const preview = dragPreview
            setDragPreview(null)
            if (!d?.armed || !preview) return
            const newId = String(Date.now())
            useAppStore.getState().addBlock({
              id: newId, type: 'timeline', name: '',
              date: curDate, startHour: preview.startHour, durHour: preview.durHour,
              color: 'pink', done: false, memo: '', category: '',
              deadline: null, priority: null,
            })
            setEditId(newId)
            setNewBlockId(newId)
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
              try { navigator.vibrate([10, 30, 10]) } catch { /* ignore */ }
            }
          }}
          onPointerCancel={() => {
            // Only reset if we never armed — if we already armed, the
            // browser shouldn't normally cancel mid-capture, and if it
            // does we'd rather not silently drop the user's preview.
            const d = dragCreateRef.current
            if (d && !d.armed) {
              dragCreateRef.current = null
              setDragPreview(null)
            }
          }}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const relY = e.clientY - rect.top
            const hour = displayStart + Math.floor(relY / PX)
            const subH = Math.round((relY % PX) / PX * 6) / 6
            const startHour = hour + subH
            const newId = String(Date.now())
            useAppStore.getState().addBlock({
              id: newId, type: 'timeline', name: '',
              date: curDate, startHour, durHour: 1,
              color: 'pink', done: false, memo: '', category: '',
              deadline: null, priority: null,
            })
            setEditId(newId)
            setNewBlockId(newId)
          }}
        >
          {/* Hour lines */}
          {Array.from({ length: displayHours + 1 }, (_, i) => (
            <div
              key={i}
              className="hour-line"
              style={{ top: `${i * PX}px` }}
            />
          ))}

          {/* Drag-to-create preview */}
          {dragPreview && (
            <div
              style={{
                position: 'absolute',
                left: 4, right: 4,
                top: (dragPreview.startHour - displayStart) * PX,
                height: dragPreview.durHour * PX,
                background: 'color-mix(in srgb, var(--pink) 25%, #fff)',
                border: '2px dashed var(--pink)',
                borderRadius: 8,
                pointerEvents: 'none',
                zIndex: 50,
                fontSize: 11, color: 'var(--pd)', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {(() => {
                const hh = Math.floor(dragPreview.startHour)
                const mm = Math.round((dragPreview.startHour - hh) * 60)
                const eh = dragPreview.startHour + dragPreview.durHour
                const eHH = Math.floor(eh)
                const eMM = Math.round((eh - eHH) * 60)
                const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
                const totalMin = Math.round(dragPreview.durHour * 60)
                return `${fmt(hh, mm)} – ${fmt(eHH, eMM)} (${totalMin}m)`
              })()}
            </div>
          )}

          {/* 10-minute sub-lines */}
          {Array.from({ length: displayHours }, (_, i) =>
            [10, 20, 30, 40, 50].map((m) => (
              <div
                key={`${i}-${m}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${i * PX + Math.round((m / 60) * PX)}px`,
                  borderTop: `1px ${m === 30 ? 'dashed' : 'dotted'} rgba(0,0,0,${m === 30 ? '0.15' : '0.1'})`,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )),
          )}

          {/* Empty state */}
          {timelineBlocks.length === 0 && (
            <div className="empty-tl">
              이 날엔 아직 할 일이 없어
              <br />+ 버튼으로 추가해봐
            </div>
          )}

          {/* Now line */}
          {curDate === today && (
            <NowLine startHour={displayStart} totalHours={displayHours} px={PX} />
          )}

          {/* Time blocks — skip blocks that finish before the visible window */}
          {timelineBlocks.map((block, index) => {
            const blockEnd = block.startHour + (block.durHour || 0)
            if (blockEnd <= displayStart) return null
            // Auto-classify: recurring = obligation (must), single = flexible
            const isFlex = !block.isRecurring
            // In '🫂 힘들어' mode, dim flexible (자율) blocks so the user only
            // visually focuses on the obligations they have to keep.
            const dimmed = isDevMode() && dayMode === 'low' && isFlex
            return (
              <TimeBlock
                key={block.id}
                block={block}
                curDate={curDate}
                startHour={displayStart}
                px={PX}
                isMenuOpen={activeMenu === block.id}
                onMenuToggle={setActiveMenu}
                onMemo={handleMemoOpen}
                onEdit={(id) => setEditId(id)}
                index={index}
                dimmed={dimmed}
              />
            )
          })}
        </div>
      </div>

      {/* FAB — draggable on long press */}
      <button
        ref={bindAddFab as React.RefCallback<HTMLButtonElement>}
        className="fab"
        onClick={() => { if (!addFabDragging) setSheetOpen(true) }}
        style={addFabStyle}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="11" y1="2" x2="11" y2="20" />
          <line x1="2" y1="11" x2="20" y2="11" />
        </svg>
      </button>

      {/* Add block sheet */}
      <AddBlockSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onQuickEmpty={(id) => { setSheetOpen(false); setTimeout(() => { setEditId(id); setNewBlockId(id) }, 300) }}
      />

      {/* Edit block modal */}
      {editId && (() => {
        const b = blocks.find((x) => x.id === editId)
        return b ? (
          <EditBlockModal
            block={b}
            onClose={() => { setEditId(null); setNewBlockId(null) }}
            onCancel={() => {
              const cur = useAppStore.getState().blocks.find((x) => x.id === editId)
              const isUnmodifiedNew =
                editId === newBlockId &&
                cur && (cur.name === '' || cur.name === '새 블록') && !cur.category && cur.durHour === 1 && !cur.memo
              if (isUnmodifiedNew) useAppStore.getState().deleteBlock(editId)
              setEditId(null)
              setNewBlockId(null)
            }}
          />
        ) : null
      })()}

      {/* Memo sheet */}
      {memoState && (
        <div className="moverlay show" onClick={() => setMemoState(null)}>
          <div className="msheet" style={{ background: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#333', marginBottom: '12px' }}>
              {blocks.find((b) => b.id === memoState.id)?.name} 메모
            </div>
            <textarea
              className="mi"
              rows={4}
              placeholder="링크, 참고사항..."
              value={memoState.memo}
              onChange={(e) => setMemoState((prev) => (prev ? { ...prev, memo: e.target.value } : prev))}
              style={{ background: '#fff', color: '#333' }}
            />
            <div className="mbtns">
              <button className="mcancel" onClick={() => setMemoState(null)}>취소</button>
              <button className="msave" onClick={handleMemoSave}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {timelineBlocks.length > 0 && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 100 }}>
          <span style={{ background: 'var(--pl)', border: '1px solid var(--pink)', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: 'var(--pd)', fontWeight: 500 }}>
            총 {Math.round(timelineBlocks.reduce((s, b) => s + b.durHour, 0) * 10) / 10}h
          </span>
          <span style={{ background: 'var(--pl)', border: '1px solid var(--pink)', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: 'var(--pd)', fontWeight: 500 }}>
            완료 {timelineBlocks.filter((b) => b.done).length}/{timelineBlocks.length}
          </span>
        </div>
      )}

      {/* Done toast */}

      {/* Birthday modal */}
      {showBirthdayModal && <BirthdayModal onClose={() => setShowBirthdayModal(false)} />}

      {/* Copy yesterday selection modal */}
      {copyModalOpen && (() => {
        const yesterday = addDays(curDate, -1)
        const yesterdayBlocks = blocks.filter((b) => b.date === yesterday && !b.isBuf && (b.type === 'timeline' || !b.type))
        return (
          <CopyDayModal
            sourceBlocks={yesterdayBlocks}
            onClose={() => setCopyModalOpen(false)}
            onCopy={(selected) => {
              const addBlock = useAppStore.getState().addBlock
              for (const b of selected) {
                addBlock({
                  ...b,
                  id: String(Date.now() + Math.random()),
                  date: curDate,
                  done: false,
                  memo: b.memo || '',
                })
              }
              showMiniToast(`📋 ${selected.length}개 복사 완료`)
            }}
          />
        )
      })()}

      {/* Time label helper */}
      <div style={{ display: 'none' }}>
        {Array.from({ length: HOURS }, (_, i) => fmtH(START + i))}
      </div>
    </div>
  )
}
