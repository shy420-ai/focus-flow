// 일간 탭 전용 설정 시트. SettingsPopup에 흩어져 있던 일간 관련 항목들
// (위 카드 / 타임라인 범위 / 더블탭 블록)을 일간 탭 본인의 ⚙ 아이콘 아래로
// 모은 곳. 같은 localStorage 키와 같은 ff-tl-* 이벤트를 그대로 사용해서
// 동작은 기존과 100% 호환.
import { useState } from 'react'
import { getDailyWidgetPref, setDailyWidgetPref, type DailyWidgetPref } from '../../lib/dailyTip'
import { useBackClose } from '../../hooks/useBackClose'

const TL_START_KEY = 'ff_tl_start'
const TL_HOURS_KEY = 'ff_tl_hours'
const PX_KEY = 'ff_px'
const DUR_KEY = 'ff_default_block_dur'

interface Props { onClose: () => void }

export function TimelineSettings({ onClose }: Props) {
  useBackClose(true, onClose)

  const [dailyWidget, setDailyWidget] = useState<DailyWidgetPref>(getDailyWidgetPref())
  function pickDailyWidget(p: DailyWidgetPref) {
    setDailyWidget(p)
    setDailyWidgetPref(p)
  }

  const [tlStart, setTlStart] = useState(parseInt(localStorage.getItem(TL_START_KEY) || '6'))
  const [tlEnd, setTlEnd] = useState(
    parseInt(localStorage.getItem(TL_START_KEY) || '6') +
    parseInt(localStorage.getItem(TL_HOURS_KEY) || '18'),
  )
  const [px, setPx] = useState(parseInt(localStorage.getItem(PX_KEY) || '140'))
  const [dur, setDur] = useState(parseFloat(localStorage.getItem(DUR_KEY) || '1'))

  function setRange(start: number, end: number) {
    if (end <= start) end = Math.min(start + 1, 24)
    const hours = end - start
    localStorage.setItem(TL_START_KEY, String(start))
    localStorage.setItem(TL_HOURS_KEY, String(hours))
    setTlStart(start)
    setTlEnd(end)
    window.dispatchEvent(new CustomEvent('ff-tl-range', { detail: { start, hours } }))
  }
  function setPxVal(val: number) {
    setPx(val)
    localStorage.setItem(PX_KEY, String(val))
    window.dispatchEvent(new CustomEvent('ff-tl-px', { detail: val }))
  }
  function setDurVal(h: number) {
    setDur(h)
    localStorage.setItem(DUR_KEY, String(h))
    window.dispatchEvent(new CustomEvent('ff-default-dur-changed'))
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,.32)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '20px 18px calc(20px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -4px 16px rgba(0,0,0,.15)',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--pd)', textAlign: 'center', marginBottom: 14 }}>📅 일간 탭 설정</div>

        {/* 일간 탭 위 카드 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6 }}>📌 일간 탭 위 카드</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { id: 'tip' as const, label: '💡 오늘의 팁' },
              { id: 'saju' as const, label: '🔮 사주' },
              { id: 'off' as const, label: '🚫 없음' },
            ]).map((opt) => {
              const on = dailyWidget === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => pickDailyWidget(opt.id)}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 10,
                    border: '1.5px solid ' + (on ? 'var(--pink)' : 'var(--pl)'),
                    background: on ? 'color-mix(in srgb, var(--pink) 12%, #fff)' : '#fff',
                    color: on ? 'var(--pink)' : '#888',
                    fontSize: 11, fontWeight: on ? 800 : 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{opt.label}</button>
              )
            })}
          </div>
        </div>

        {/* 타임라인 범위 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6 }}>⏰ 타임라인 범위</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
            <select value={tlStart} onChange={(e) => setRange(parseInt(e.target.value), tlEnd)} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--pl)', fontSize: 12, fontFamily: 'inherit' }}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
            <span style={{ fontSize: 12, color: '#aaa' }}>~</span>
            <select value={tlEnd} onChange={(e) => setRange(tlStart, parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--pl)', fontSize: 12, fontFamily: 'inherit' }}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#888' }}>간격</span>
            <input type="range" min={80} max={200} step={20} value={px} onChange={(e) => setPxVal(parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--pink)' }} />
            <span style={{ fontSize: 11, color: '#888', minWidth: 36 }}>{px}px</span>
          </div>
        </div>

        {/* 더블탭 블록 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6 }}>👆 더블탭 자동블록 길이</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {([0.25, 0.5, 1, 1.5, 2] as const).map((h) => {
              const on = Math.abs(dur - h) < 0.01
              return (
                <button key={h}
                  onClick={() => setDurVal(h)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: '1.5px solid ' + (on ? 'var(--pink)' : 'var(--pl)'),
                    background: on ? 'var(--pink)' : '#fff',
                    color: on ? '#fff' : 'var(--pd)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{h < 1 ? `${Math.round(h * 60)}분` : `${h}h`}</button>
              )
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 6, padding: '10px 12px',
            borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>완료</button>
      </div>
    </div>
  )
}
