import { useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import { pad } from '../../lib/date'
import { nid } from '../../lib/id'
import { getCategories } from '../../lib/categories'

const QUICK_MINS = [1, 5, 10, 30, 60]

interface Props {
  onSheetOpen: () => void
}

export function QuickScheduleMenu({ onSheetOpen }: Props) {
  const addBlock = useAppStore((s) => s.addBlock)
  const [open, setOpen] = useState(false)
  const [selectedMin, setSelectedMin] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [qsCat, setQsCat] = useState('')

  function pick(min: number) {
    setSelectedMin(min)
    setQsCat('')
  }

  function confirm() {
    if (!name.trim() || selectedMin === null) return
    const now = new Date()
    const target = new Date(now.getTime() + selectedMin * 60000)
    const startH = Math.round((target.getHours() + target.getMinutes() / 60) * 2) / 2
    const dateStr = target.getFullYear() + '-' + pad(target.getMonth() + 1) + '-' + pad(target.getDate())
    addBlock({
      id: nid(), type: 'timeline', name: name.trim(),
      date: dateStr, startHour: startH, durHour: 1,
      color: 'pink', done: false, memo: '', category: qsCat,
      deadline: null, priority: null,
    })
    close()
  }

  function close() {
    setOpen(false)
    setSelectedMin(null)
    setName('')
  }

  return (
    <>
      {/* Overlay */}
      {open && <div className="qs-overlay" onClick={close} />}

      {/* Quick pills */}
      {open && selectedMin === null && (
        <div className="qs-menu show">
          {QUICK_MINS.map((m) => (
            <button key={m} className="qs-pill" onClick={() => pick(m)}>
              {m >= 60 ? m / 60 + '시간' : m + '분'} 뒤
            </button>
          ))}
          <button className="qs-pill" onClick={() => { close(); onSheetOpen() }}>직접 입력 ✏️</button>
        </div>
      )}

      {/* Name input after picking time */}
      {open && selectedMin !== null && (
        <div className="qs-input-row show">
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
            {selectedMin >= 60 ? selectedMin / 60 + '시간' : selectedMin + '분'} 뒤 시작
          </div>
          <input
            className="qs-input"
            placeholder="할 일 이름 입력"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirm()
              if (e.key === 'Escape') close()
            }}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {getCategories().map((c) => (
              <button
                key={c.name}
                onClick={() => setQsCat(qsCat === c.name ? '' : c.name)}
                style={{
                  padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: '1.5px solid ' + c.color,
                  background: qsCat === c.name ? c.color : '#fff',
                  color: qsCat === c.name ? '#fff' : c.color,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{c.name}</button>
            ))}
          </div>
          <button className="qs-submit" onClick={confirm}>✓ 추가</button>
        </div>
      )}

      {/* Long-press button - separate button above FAB for quick schedule */}
      <button
        style={{
          position: 'fixed', bottom: 88, right: 22, width: 38, height: 38,
          borderRadius: '50%', background: 'var(--pl)', border: '1.5px solid var(--pink)',
          color: 'var(--pd)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          zIndex: 190, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setOpen((o) => !o)}
        title="N분 뒤 빠른 추가"
      >⚡</button>
    </>
  )
}
