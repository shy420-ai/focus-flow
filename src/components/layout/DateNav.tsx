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
