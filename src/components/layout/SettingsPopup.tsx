import { useState, useRef, useEffect } from 'react'
import { applyTheme, getTheme } from '../../lib/theme'
import { THEMES, THEME_LABELS, type ThemeName } from '../../constants/themes'
import { useAppStore, type CurView } from '../../store/AppStore'
import { todayStr, pad } from '../../lib/date'
import { signOutUser } from '../../lib/auth'
import { isDevMode, setDevMode } from '../../lib/devMode'
import { useBackClose } from '../../hooks/useBackClose'
import { showConfirm } from '../../lib/showConfirm'
import { showMiniToast } from '../../lib/miniToast'
import { isLeaderboardOn, setLeaderboardOn } from '../../lib/leaderboardPref'
import { flushSync } from '../../lib/syncManager'
import { getUserCount } from '../../lib/firestore'
import { showPrompt } from '../../lib/showPrompt'
import { tabIcon } from '../../lib/tabIcons'
import { useUnreadGuestbook, markGuestbookRead } from '../../lib/guestbookUnread'
import { getFontPref, setFontPref, listPresets, saveCustomFont, loadCustomFont, clearCustomFont, preloadAllFonts, type FontPref } from '../../lib/font'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return '방금'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(ts).toISOString().slice(5, 10)
}
import { AVATAR_OPTIONS, getAvatar, setAvatar } from '../../lib/avatar'
import { getBio, setBio } from '../../lib/bio'
import { getVisibility, setVisibility, VISIBILITY_LABELS, type VisibilitySection } from '../../lib/friendVisibility'
import { Avatar } from '../ui/Avatar'
import { AvatarCropModal } from '../ui/AvatarCropModal'
import { resetXp, getXp, getLevel } from '../../lib/xp'

interface Props {
  onClose: () => void
  onFriendsOpen: () => void
}

const TL_START_KEY = 'ff_tl_start'
const TL_HOURS_KEY = 'ff_tl_hours'
const PX_KEY = 'ff_px'

const ALL_TABS: Array<{ id: CurView; label: string }> = [
  { id: 'tl', label: '일간' },
  { id: 'week', label: '주간' },
  { id: 'cal', label: '월간' },
  { id: 'habit', label: '습관' },
  { id: 'goal', label: '목표' },
  { id: 'drop', label: '덤프' },
  { id: 'mood', label: '일기' },
  { id: 'stats', label: '메디' },
  { id: 'friends', label: '친구' },
  { id: 'tips', label: '정보' },
]

function loadHiddenTabs(): CurView[] {
  try { return JSON.parse(localStorage.getItem('ff_hidden_tabs') || '[]') } catch { return [] }
}

const TAB_ORDER_KEY = 'ff_tab_order'

function loadOrderedTabs(): typeof ALL_TABS {
  let order: CurView[] = []
  try { order = JSON.parse(localStorage.getItem(TAB_ORDER_KEY) || '[]') } catch { /* ignore */ }
  if (!order.length) return ALL_TABS
  const seen = new Set(order)
  const ordered = order
    .map((id) => ALL_TABS.find((t) => t.id === id))
    .filter(Boolean) as typeof ALL_TABS
  const missing = ALL_TABS.filter((t) => !seen.has(t.id))
  return [...ordered, ...missing]
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
  const [devOn, setDevOn] = useState<boolean>(isDevMode())
  const [lbOn, setLbOn] = useState<boolean>(isLeaderboardOn())
  const backdropDownRef = useRef(false)
  // Arm the backdrop close handler 200ms after mount so the gear-tap that
  // opened the popup can't immediately bleed through into a backdrop click.
  const armedRef = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => { armedRef.current = true }, 200)
    return () => clearTimeout(t)
  }, [])

  const [userCount, setUserCount] = useState<number | null>(null)
  useEffect(() => {
    getUserCount().then(setUserCount).catch(() => setUserCount(null))
  }, [])
  useBackClose(true, onClose)
  const [theme, setTheme] = useState<ThemeName>(getTheme())
  const [fontPref, setFontPrefState] = useState<FontPref>(getFontPref())
  const [customName, setCustomName] = useState<string | null>(null)
  const [, setFontTick] = useState(0)
  useEffect(() => {
    loadCustomFont().then((r) => setCustomName(r?.fileName ?? null)).catch(() => { /* ignore */ })
  }, [fontPref])
  // Eager load every preset so the preview rows render in their actual
  // font. setFontTick() forces a re-render once loads finish.
  useEffect(() => {
    preloadAllFonts().then(() => setFontTick((n) => n + 1)).catch(() => { /* ignore */ })
  }, [])
  const fontInputRef = useRef<HTMLInputElement | null>(null)
  async function pickFont(pref: FontPref) {
    if (pref === 'custom' && !customName) {
      fontInputRef.current?.click()
      return
    }
    setFontPrefState(pref)
    setFontPref(pref)
  }
  async function onCustomFontFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(file.name)) {
      showMiniToast('ttf / otf / woff 파일만 가능해')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      showMiniToast('8MB 이하 파일만 가능해')
      return
    }
    await saveCustomFont(file, file.name)
    setCustomName(file.name)
    setFontPrefState('custom')
    setFontPref('custom')
    showMiniToast('폰트 적용됨')
  }
  async function clearCustom() {
    await clearCustomFont()
    setCustomName(null)
    if (fontPref === 'custom') {
      setFontPrefState('default')
      setFontPref('default')
    }
  }
  const [nickname, setNickname] = useState(localStorage.getItem('ff_nickname') || displayName || '')
  const [tlStart, setTlStart] = useState(parseInt(localStorage.getItem(TL_START_KEY) || '6'))
  const [tlEnd, setTlEnd] = useState(parseInt(localStorage.getItem(TL_START_KEY) || '6') + parseInt(localStorage.getItem(TL_HOURS_KEY) || '18'))
  const [px, setPx] = useState(parseInt(localStorage.getItem(PX_KEY) || '140'))
  const [hiddenTabs, setHiddenTabs] = useState<CurView[]>(loadHiddenTabs)
  const [orderedTabs, setOrderedTabs] = useState(loadOrderedTabs)
  // Pointer-events drag — works on touch and desktop. Captured on the
  // ≡ handle so taps elsewhere on the row don't start a drag.
  const [dragId, setDragId] = useState<CurView | null>(null)
  const [dragOverId, setDragOverId] = useState<CurView | null>(null)
  const unreadList = useUnreadGuestbook()
  const setCurView = useAppStore((s) => s.setCurView)

  function openFromNotif() {
    onClose()
    setCurView('friends')
    markGuestbookRead()
  }


  function onHandleDown(e: React.PointerEvent, id: CurView) {
    setDragId(id)
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onHandleMove(e: React.PointerEvent) {
    if (!dragId) return
    // elementFromPoint finds the row under the finger/pointer — pointer
    // capture would otherwise force events back to the handle's element.
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-tab-id]') as HTMLElement | null
    const tid = el?.dataset.tabId as CurView | undefined
    if (tid && tid !== dragOverId) setDragOverId(tid)
  }
  function onHandleUp(e: React.PointerEvent) {
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    if (dragId && dragOverId && dragId !== dragOverId) {
      const next = [...orderedTabs]
      const fromIdx = next.findIndex((t) => t.id === dragId)
      const toIdx = next.findIndex((t) => t.id === dragOverId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const [m] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, m)
        setOrderedTabs(next)
        localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(next.map((t) => t.id)))
        localStorage.setItem('ff_tab_order_ts', String(Date.now()))
        window.dispatchEvent(new CustomEvent('ff-tabs-changed'))
        flushSync().catch(() => { /* offline ok */ })
      }
    }
    setDragId(null)
    setDragOverId(null)
  }
  const [cycleData, setCycleData] = useState(() => loadCycleData())
  const [avatar, setAvatarState] = useState<string>(getAvatar())
  const [bio, setBioState] = useState<string>(getBio())
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [visibility, setVisibilityState] = useState<Record<VisibilitySection, boolean>>(getVisibility())

  function handleTheme(name: ThemeName) {
    applyTheme(name)
    setTheme(name)
  }

  async function saveNickname() {
    const trimmed = nickname.trim()
    if (!trimmed) {
      showMiniToast('닉네임을 입력해줘')
      return
    }
    localStorage.setItem('ff_nickname', trimmed)
    setNickname(trimmed)  // reflect trimmed value in the input
    showMiniToast('✅ 닉네임 저장됨')  // show toast first so user sees feedback even if sync is slow/offline
    try {
      await flushSync()
    } catch (err) {
      console.error('[saveNickname] sync failed', err)
    }
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
    // Don't let the user hide every tab — keep at least one visible.
    const visibleCount = ALL_TABS.length - updated.length
    if (visibleCount < 1) {
      showMiniToast('최소 한 개의 탭은 보여야 해')
      return
    }
    localStorage.setItem('ff_hidden_tabs', JSON.stringify(updated))
    localStorage.setItem('ff_hidden_tabs_ts', String(Date.now()))
    setHiddenTabs(updated)
    window.dispatchEvent(new CustomEvent('ff-tabs-changed'))
    // If the user just hid the tab they're currently on, jump to the first
    // remaining visible tab so they don't get stuck on a hidden view.
    if (updated.includes(useAppStore.getState().curView)) {
      const firstVisible = ALL_TABS.find((t) => !updated.includes(t.id))
      if (firstVisible) useAppStore.getState().setCurView(firstVisible.id)
    }
    flushSync().catch(() => { /* offline ok */ })
  }

  async function setCycleStart() {
    const input = await showPrompt({ msg: '생리 시작일 (YYYY-MM-DD)', defaultValue: todayStr() })
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

  async function setCycleEnd() {
    const input = await showPrompt({ msg: '생리 종료일 (YYYY-MM-DD)', defaultValue: todayStr() })
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
      onMouseDown={(e) => { backdropDownRef.current = e.target === e.currentTarget }}
      onTouchStart={(e) => { backdropDownRef.current = e.target === e.currentTarget }}
      onClick={(e) => {
        if (!armedRef.current) return
        if (e.target === e.currentTarget && backdropDownRef.current) onClose()
        backdropDownRef.current = false
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 56 }}
    >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#fff', border: '2px solid var(--pink)', borderRadius: 14,
        padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,.15)',
        width: 'calc(100% - 24px)', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--pd)', textAlign: 'center', marginLeft: 28 }}>⚙️ 설정</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
      </div>
      <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center', marginBottom: 12 }}>
        🛠 빌드 {(() => {
          try {
            const d = new Date(__BUILD_TIME__)
            const m = (d.getMonth() + 1)
            const day = d.getDate()
            const h = String(d.getHours()).padStart(2, '0')
            const mn = String(d.getMinutes()).padStart(2, '0')
            return `${m}/${day} ${h}:${mn}`
          } catch { return '?' }
        })()}
      </div>

      {/* ADHD 여성 단톡방 */}
      <a
        href="https://open.kakao.com/o/pWLTCgsi"
        target="_blank"
        rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--pink)', borderRadius: 12, marginBottom: 10, textDecoration: 'none', color: '#fff', boxShadow: '0 2px 10px color-mix(in srgb, var(--pink) 30%, transparent)' }}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ADHD 여성 단톡방 — 카톡 오픈채팅</span>
        <span style={{ fontSize: 12, fontWeight: 800 }}>→</span>
      </a>

      {/* 알림: 새 방명록 미리보기 */}
      {unreadList.length > 0 && (
        <div style={{ background: 'color-mix(in srgb, var(--pl) 50%, #fff)', border: '1.5px solid var(--pink)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>💌 새 방명록 {unreadList.length}개</span>
            <button onClick={markGuestbookRead} style={{ background: 'none', border: 'none', color: '#888', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>모두 읽음</button>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {unreadList.slice(0, 5).map((e, i) => (
              <button
                key={i}
                onClick={openFromNotif}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: '#fff', border: '1px solid #f5f5f5', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pd)' }}>{e.from}</span>
                  <span style={{ fontSize: 9, color: '#bbb' }}>{relativeTime(e.ts)}</span>
                </div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {e.text}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={openFromNotif}
            style={{ display: 'block', width: '100%', marginTop: 6, padding: '7px', background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8 }}
          >👥 친구 탭 → 내 방명록 →</button>
        </div>
      )}

      {/* 프로필 사진 + 닉네임 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--pl)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--pink)' }}>
            <Avatar value={avatar} size={68} />
          </div>
          <label style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--pink)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
            📷
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setCropFile(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
        />
        <button onClick={saveNickname} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>저장</button>
      </div>

      {/* 한줄 소개 (Twitter-style bio) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, marginTop: 6 }}>
        <input
          value={bio}
          onChange={(e) => setBioState(e.target.value.slice(0, 80))}
          placeholder="한줄 소개 (예: ADHD 같이 헤쳐나가요)"
          maxLength={80}
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--pl)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          onKeyDown={(e) => { if (e.key === 'Enter') { setBio(bio); showMiniToast('✅ 소개 저장됨') } }}
        />
        <button onClick={() => { setBio(bio); showMiniToast('✅ 소개 저장됨') }} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--pink)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>저장</button>
      </div>
      <div style={{ fontSize: 9, color: '#bbb', marginBottom: 4, textAlign: 'right' }}>{bio.length}/80</div>

      {/* 아바타 이모지 (사진 안 쓸 때 옵션 — 접힘) */}
      <button
        onClick={() => setEmojiOpen((o) => !o)}
        style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px dashed #ddd', background: '#fff', color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, marginBottom: emojiOpen ? 6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>또는 이모지 선택</span>
        <span>{emojiOpen ? '▲' : '▼'}</span>
      </button>
      {emojiOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 8 }}>
          {AVATAR_OPTIONS.map((emo) => (
            <button
              key={emo}
              onClick={() => { setAvatar(emo); setAvatarState(emo); showMiniToast('✅ 아바타 변경') }}
              style={{ aspectRatio: '1', border: '1.5px solid ' + (avatar === emo ? 'var(--pink)' : '#eee'), background: avatar === emo ? 'var(--pl)' : '#fff', borderRadius: 8, fontSize: 18, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            >{emo}</button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 12, lineHeight: 1.5 }}>
        💡 닉네임·프사는 🏆 순위와 친구 화면에 표시돼
      </div>

      {/* 친구 관리 */}
      <button
        onClick={() => { onClose(); onFriendsOpen() }}
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
      >👥 친구 관리</button>

      {/* 내 공유 코드 */}
      {uid && (() => {
        let h = 0
        for (let i = 0; i < uid.length; i++) { h = ((h << 5) - h) + uid.charCodeAt(i); h |= 0 }
        const myCode = Math.abs(h).toString(36).toUpperCase().slice(0, 6)
        return (
          <div style={{ background: 'var(--pl)', borderRadius: 10, padding: 12, marginBottom: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>내 공유 코드</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pd)', letterSpacing: 4 }}>{myCode}</div>
            <button
              onClick={async () => {
                try {
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(myCode)
                    showMiniToast('📋 코드 복사 완료')
                  } else {
                    const ta = document.createElement('textarea')
                    ta.value = myCode
                    ta.style.position = 'fixed'; ta.style.opacity = '0'
                    document.body.appendChild(ta)
                    ta.select()
                    document.execCommand('copy')
                    document.body.removeChild(ta)
                    showMiniToast('📋 코드 복사 완료')
                  }
                } catch {
                  showMiniToast('😢 복사 실패')
                }
              }}
              style={{ marginTop: 6, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--pink)', background: '#fff', color: 'var(--pink)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >📋 복사</button>
            <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>친구한테 알려주면 친구가 너 추가할 수 있어</div>
          </div>
        )
      })()}

      {/* 친구에게 보일 항목 — privacy toggles */}
      <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 10, marginBottom: 12, border: '1px solid #eee' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>👁 친구에게 공개할 항목</div>
        {(Object.keys(VISIBILITY_LABELS) as VisibilitySection[]).map((sec) => {
          const on = visibility[sec]
          return (
            <button
              key={sec}
              onClick={() => {
                const next = { ...visibility, [sec]: !on }
                setVisibility(next)
                setVisibilityState(next)
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', marginBottom: 4, borderRadius: 8, border: '1px solid ' + (on ? 'var(--pink)' : '#ddd'), background: on ? 'var(--pl)' : '#fff', color: on ? 'var(--pd)' : '#aaa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span>{on ? '☑️' : '☐'} {VISIBILITY_LABELS[sec]}</span>
              <span style={{ fontSize: 9, opacity: .7 }}>{on ? '공개' : '비공개'}</span>
            </button>
          )
        })}
      </div>

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

      {/* 폰트 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 8, textAlign: 'center', borderTop: '1px solid var(--pl)', paddingTop: 10 }}>✏️ 글꼴</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {([
          { id: 'default' as const, label: '기본 (시스템)', sample: '집중 → 흐름 7일' },
          ...listPresets().map((p) => ({ id: p.id as FontPref, label: p.name, sample: '집중 → 흐름 7일' })),
          { id: 'custom' as const, label: customName ? `📁 ${customName}` : '📁 직접 올린 폰트', sample: customName ? '집중 → 흐름 7일' : '+ ttf·otf·woff 파일 올리기' },
        ]).map((opt) => {
          const on = fontPref === opt.id
          const family =
            opt.id === 'leeseoyoon' ? "'Leeseoyoon', sans-serif" :
            opt.id === 'dxmsub' ? "'DXMSubtitles', sans-serif" :
            opt.id === 'custom' && customName ? "'CustomUserFont', sans-serif" :
            'inherit'
          return (
            <div key={opt.id} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
              <button
                onClick={() => pickFont(opt.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                  padding: '8px 12px', borderRadius: 10,
                  border: '1.5px solid ' + (on ? 'var(--pink)' : 'var(--pl)'),
                  background: on ? 'color-mix(in srgb, var(--pink) 12%, #fff)' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                  fontWeight: 600, color: 'var(--pd)', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--pink)' : '#888' }}>{opt.label}</span>
                <span style={{ fontFamily: family, fontSize: 14, color: '#444' }}>{opt.sample}</span>
              </button>
              {opt.id === 'custom' && customName && (
                <button onClick={clearCustom}
                  style={{ width: 36, borderRadius: 10, border: '1.5px solid var(--pl)', background: '#fff', color: '#bbb', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                  aria-label="커스텀 폰트 삭제"
                >✕</button>
              )}
            </div>
          )
        })}
        <input
          ref={fontInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/*"
          onChange={onCustomFontFile}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center', marginTop: 2 }}>
          폰트는 이 기기에만 저장돼. 다른 기기에선 다시 골라야 해.
        </div>
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
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 4, textAlign: 'center', borderTop: '1px solid var(--pl)', paddingTop: 10 }}>📑 탭 관리</div>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8, textAlign: 'center' }}>
        💡 ≡ 핸들 잡고 드래그해서 순서 바꿔
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
        {orderedTabs.map((t) => {
          const on = !hiddenTabs.includes(t.id)
          const isDragging = dragId === t.id
          const isOver = dragOverId === t.id && dragId && dragId !== t.id
          return (
            <div
              key={t.id}
              data-tab-id={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 8,
                background: isOver ? 'var(--pl)' : 'transparent',
                opacity: isDragging ? .4 : 1,
                transition: 'background .15s, opacity .15s',
              }}
            >
              <span
                onPointerDown={(e) => onHandleDown(e, t.id)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                style={{
                  cursor: 'grab',
                  color: '#bbb',
                  fontSize: 14,
                  padding: '4px 6px',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="순서 변경"
              >☰</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: on ? 'var(--pd)' : '#999', flex: 1 }}>
                <span style={{ display: 'inline-flex', color: on ? 'var(--pink)' : '#bbb' }}>{tabIcon(t.id)}</span>
                {t.label}
              </span>
              <button
                onClick={() => toggleTab(t.id)}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--pink)' : '#ddd', position: 'relative', transition: 'background .2s', padding: 0, flexShrink: 0 }}
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
              if (!(await showConfirm('로그아웃하면 이 기기에서는 로컬 데이터로만 작동해요. 계속할까요?'))) return
              await signOutUser()
              onClose()
            }}
            style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >🚪 로그아웃</button>
        )}
      </div>

      {/* 옵션 */}
      <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 10, marginTop: 8 }}>
        <button
          onClick={() => { const next = !lbOn; setLeaderboardOn(next); setLbOn(next) }}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px dashed ' + (lbOn ? 'var(--pink)' : '#ddd'), background: lbOn ? 'var(--pl)' : '#fff', color: lbOn ? 'var(--pd)' : '#aaa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
        >🏆 순위 보기 {lbOn ? 'ON' : 'OFF'}</button>
        <button
          onClick={() => { const next = !devOn; setDevMode(next); setDevOn(next) }}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px dashed ' + (devOn ? 'var(--pink)' : '#ddd'), background: devOn ? 'var(--pl)' : '#fff', color: devOn ? 'var(--pd)' : '#aaa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
        >🧪 개발자 모드 {devOn ? 'ON' : 'OFF'}</button>
      </div>

      {/* 사용자 통계 */}
      <div style={{ borderTop: '1px solid var(--pl)', paddingTop: 10, marginTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>📊 통계</div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
          전체 사용자: {userCount == null ? '...' : userCount.toLocaleString() + '명'}
          {' · '}내 레벨: Lv.{getLevel(getXp())} ({getXp()} XP)
        </div>
        <button
          onClick={async () => {
            if (await showConfirm('레벨/XP를 0으로 초기화할까? (다시 쌓아야 해)')) {
              resetXp()
              showMiniToast('🔄 레벨 초기화 완료')
            }
          }}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1.5px dashed #ddd', background: '#fff', color: '#999', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
        >🔄 레벨 초기화</button>
      </div>

      {/* 가이드 / 온보딩 */}
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
    {cropFile && (
      <AvatarCropModal
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onConfirm={(dataUrl) => {
          setAvatar(dataUrl)
          setAvatarState(dataUrl)
          setCropFile(null)
          showMiniToast('✅ 사진 변경 완료')
        }}
      />
    )}
    </div>
  )
}
