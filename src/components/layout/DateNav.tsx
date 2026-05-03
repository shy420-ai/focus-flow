import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/AppStore'
import { addDays, todayStr, dateLabel } from '../../lib/date'
import { getHoliday } from '../../lib/holidays'

export function DateNav() {
  const curDate = useAppStore((s) => s.curDate)
  const setCurDate = useAppStore((s) => s.setCurDate)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const today = todayStr()

  useEffect(() => {
    if (!showPicker) return
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  function nav(dir: number) {
    setCurDate(addDays(curDate, dir))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 16px 2px', position: 'relative' }}>
      <button
        onClick={() => nav(-1)}
        style={{ background: 'var(--pl)', border: 'none', width: 38, height: 38, borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: 'var(--pd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >‹</button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => setShowPicker((o) => !o)}
          >
            <span>📅</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)' }}>{dateLabel(curDate)}</span>
          </div>
          <button
            onClick={() => setCurDate(today)}
            style={{ background: 'var(--pl)', border: '1.5px solid var(--pink)', borderRadius: 8, fontSize: 10, color: 'var(--pd)', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: curDate === today ? 0.4 : 1 }}
          >오늘</button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('ff-tl-settings-open'))}
            aria-label="일간 설정"
            title="일간 설정"
            style={{
              background: 'var(--pl)', border: 'none', borderRadius: '50%',
              width: 26, height: 26, cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--pd)',
              padding: 0, fontFamily: 'inherit',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" />
            </svg>
          </button>
        </div>
        {getHoliday(curDate) && (
          <div style={{ fontSize: 10, color: '#E24B4A', fontWeight: 700 }}>🎉 {getHoliday(curDate)}</div>
        )}
      </div>

      <button
        onClick={() => nav(1)}
        style={{ background: 'var(--pl)', border: 'none', width: 38, height: 38, borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: 'var(--pd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >›</button>

      {showPicker && (
        <div
          ref={pickerRef}
          style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#fff', borderRadius: 12, border: '2px solid var(--pink)', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="date"
            defaultValue={curDate}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--pl)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            onChange={(e) => {
              if (e.target.value) {
                setCurDate(e.target.value)
                setShowPicker(false)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
