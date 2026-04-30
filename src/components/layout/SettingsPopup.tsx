import { useState, useEffect, useRef } from 'react'
import { applyTheme, getTheme } from '../../lib/theme'
import { THEMES, THEME_LABELS, type ThemeName } from '../../constants/themes'
import { useAppStore, type CurView } from '../../store/AppStore'
import { todayStr, pad } from '../../lib/date'
import { signOutUser } from '../../lib/auth'

interface Props {
  onClose: () => void
  onFriendsOpen: () => void
}

const TL_START_KEY = 'ff_tl_start'
const TL_HOURS_KEY = 'ff_tl_hours'
const PX_KEY = 'ff_px'

const ALL_TABS: Array<{ id: CurView; label: string }> = [
  { id: 'week', label: '주간' },
  { id: 'cal', label: '월간' },
  { id: 'habit', label: '습관' },
  { id: 'goal', label: '목표' },
  { id: 'drop', label: '드롭' },
  { id: 'stats', label: '메디' },
]

function loadHiddenTabs(): CurView[] {
  try { return JSON.parse(localStorage.getItem('ff_hidden_tabs') || '[]') } catch { return [] }
}

function loadCycleData() {
  try { return JSON.parse(localStorage.getItem('ff_cycle') || 'null') } catch { return null }
}

function saveCycleData(d: unknown) {
  localStorage.setItem('ff_cycle', JSON.stringify(d))
}

export function SettingsPopup({ onClose, onFriendsOpen }: Props) {
  const uid = useAppStore((s) => s.uid)
  const displayName = useAppStore((s) => s.displayName)
  const setSkipLogin = useAppStore((s) => s.setSkipLogin)
  const [theme, setTheme] = useState<ThemeName>(getTheme())
  const [nickname, setNickname] = useState(localStorage.getItem('ff_nickname') || displayName || '')
  const [tlStart, setTlStart] = useState(parseInt(localStorage.getItem(TL_START_KEY) || '6'))
  const [tlEnd, setTlEnd] = useState(parseInt(localStorage.getItem(TL_START_KEY) || '6') + parseInt(localStorage.getItem(TL_HOURS_KEY) || '18'))
  const [px, setPx] = useState(parseInt(localStorage.getItem(PX_KEY) || '140'))
  const [hiddenTabs, setHiddenTabs] = useState<CurView[]>(loadHiddenTabs)
  const [cycleData, setCycleData] = useState(() => loadCycleData())
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  function handleTheme(name: ThemeName) {
    applyTheme(name)
    setTheme(name)
  }

  function saveNickname() {
    localStorage.setItem('ff_nickname', nickname)
  }

  function setTlRange(start: number, end: number) {
    const hours = Math.max(1, end - start)
    localStorage.setItem(TL_START_KEY, String(start))
    localStorage.setItem(TL_HOURS_KEY, String(hours))
    setTlStart(start)
    setTlEnd(end)
    window.dispatchEvent(new CustomEvent('ff-tl-range', { detail: { start, hours } }))
  }

  function setPxVal(val: number) {
    localStorage.setItem(PX_KEY, String(val))
    setPx(val)
    window.dispatchEvent(new CustomEvent('ff-tl-px', { detail: val }))
  }

  function toggleTab(id: CurView) {
    const updated = hiddenTabs.includes(id)
      ? hiddenTabs.filter((t) => t !== id)
      : [...hiddenTabs, id]
    localStorage.setItem('ff_hidden_tabs', JSON.stringify(updated))
    setHiddenTabs(updated)
    window.dispatchEvent(new CustomEvent('ff-tabs-changed'))
  }

  function setCycleStart() {
    const input = prompt('생리 시작일 (YYYY-MM-DD)', todayStr())
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return
    const base = cycleData || { starts: [], avgCycle: 28 }
    const starts = [...base.starts, input.trim()].sort()
    let avgCycle = base.avgCycle
    if (starts.length >= 2) {
      let total = 0; let count = 0
      for (let i = 1; i < starts.length; i++) {
        const diff = Math.round((new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime()) / 86400000)
        if (diff > 20 && diff < 45) { total += diff; count++ }
      }
      if (count > 0) avgCycle = Math.round(total / count)
    }
    const newData = { ...base, starts, avgCycle }
    saveCycleData(newData)
    setCycleData(newData)
    window.dispatchEvent(new CustomEvent('ff-cycle-changed'))
  }

  function setCycleEnd() {
    const input = prompt('생리 종료일 (YYYY-MM-DD)', todayStr())
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return
    const base = cycleData || { starts: [], avgCycle: 28 }
    const newData = { ...base, lastEnd: input.trim() }
    saveCycleData(newData)
    setCycleData(newData)
    window.dispatchEvent(new CustomEvent('ff-cycle-changed'))
  }

  function clearCycle() {
    localStorage.removeItem('ff_cycle')
    setCycleData(null)
    window.dispatchEvent(new CustomEvent('ff-cycle-changed'))
  }

  void pad

  const cycleInfo = cycleData?.starts?.length
    ? `마지막 시작일: ${cycleData.starts[cycleData.starts.length - 1]} | 평균 주기: ${cycleData.avgCycle}일`
    : ''

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)',
        background: '#fff', border: '2px solid var(--pink)', borderRadius: 14,
        padding: 12, zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,.15)',
        width: 'calc(100% - 24px)', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)', marginBottom: 12, textAlign: 'center' }}>⚙️ 설정</div>

      {/* 닉네임 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
        />
        <button onClick={saveNickname} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>저장</button>
      </div>

      {/* 친구 관리 */}
      <button
        onClick={() => { onClose(); onFriendsOpen() }}
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
      >👥 친구 관리</button>

      {/* 테마 */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pd)', marginBottom: 8 }}>🎨 테마</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {(Object.keys(THEMES) as ThemeName[]).map((name) => {
          const t = THEMES[name]
          return (
            <button
              key={name}
              onClick={() => handleTheme(name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                border: '1.5px solid ' + t.pink,
                background: t.pl,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                fontWeight: 600, color: t.pd,
                boxShadow: name === theme ? '0 0 0 2px ' + t.pink : 'none',
              }}
            >
              {THEME_LABELS[name]}
            </button>
          )
        })}
      </div>

      {/* 타임라인 범위 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8, textAlign: 'center', borderTop: '1px solid var(--pl)', paddingTop: 10 }}>⏰ 타임라인 범위</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
        <select value={tlStart} onChange={(e) => setTlRange(parseInt(e.target.value), tlEnd)} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--pl)', fontSize: 12, fontFamily: 'inherit' }}>
          {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#aaa' }}>~</span>
        <select value={tlEnd} onChange={(e) => setTlRange(tlStart, parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--pl)', fontSize: 12, fontFamily: 'inherit' }}>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => <option key={i} value={i}>{i}:00</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#888' }}>간격</span>
        <input type="range" min={80} max={200} step={20} value={px} onChange={(e) => setPxVal(parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--pink)' }} />
        <span style={{ fontSize: 11, color: '#888', minWidth: 36 }}>{px}px</span>
      </div>

      {/* 탭 관리 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8, textAlign: 'center', borderTop: '1px solid var(--pl)', paddingTop: 10 }}>📑 탭 관리</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {ALL_TABS.map((t) => {
          const on = !hiddenTabs.includes(t.id)
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: '#333' }}>{t.label}</span>
              <button
                onClick={() => toggleTab(t.id)}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--pink)' : '#ddd', position: 'relative', transition: 'background .2s', padding: 0 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, ...(on ? { right: 2 } : { left: 2 }), transition: 'all .2s' }} />
              </button>
            </div>
          )
        })}
      </div>

      {/* 생리주기 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8, textAlign: 'center', borderTop: '1px solid var(--pl)', paddingTop: 10 }}>🌙 생리주기</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: cycleInfo ? 4 : 12 }}>
        <button onClick={setCycleStart} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--pl)', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--pd)' }}>🩸 시작일</button>
        <button onClick={setCycleEnd} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--pl)', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--pd)' }}>✅ 종료일</button>
        <button onClick={clearCycle} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: '#aaa' }}>초기화</button>
      </div>
      {cycleInfo && <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginBottom: 12 }}>{cycleInfo}</div>}

      {/* 로그인 / 로그아웃 */}
      <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 10, marginTop: 8 }}>
        {!uid ? (
          <button
            onClick={() => { setSkipLogin(false); onClose() }}
            style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >🔑 로그인하기 (기기간 싱크)</button>
        ) : (
          <button
            onClick={async () => {
              if (!confirm('로그아웃하면 이 기기에서는 로컬 데이터로만 작동해요. 계속할까요?')) return
              await signOutUser()
              onClose()
            }}
            style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >🚪 로그아웃</button>
        )}
      </div>

      {/* 온보딩 */}
      <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 10, marginTop: 8 }}>
        <button
          onClick={() => {
            onClose()
            setTimeout(() => { window.__ffShowOnboarding?.() }, 100)
          }}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
        >📖 온보딩 가이드 다시 보기</button>
        <a
          href="https://qr.kakaopay.com/FH24plHDs"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-block', width: '100%', padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#FFE156,#FFDAC1)', color: '#333', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxSizing: 'border-box', textAlign: 'center' }}
        >☕ 개발자에게 커피 한 잔 사주기</a>
      </div>
    </div>
  )
}
