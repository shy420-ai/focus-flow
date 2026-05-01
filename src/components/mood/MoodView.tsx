// Mood / 마음 tab — CBT-style emotion journal entries with per-entry
// slider snapshots (집중·기분·에너지). Dev-mode only for now. Local-only
// persistence (no Firestore sync yet).
import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/date'
import { useMoodStore } from '../../store/MoodStore'
import { saveAudio, clearAudio, getAudioName } from '../../lib/moodAudio'
import { MoodEntryModal } from './MoodEntryModal'
import type { MoodEntry } from '../../types/mood'

const DEFAULT_BGM_KEY = 'ff_mood_default_bgm'
const DEFAULT_BGM_TITLE_KEY = 'ff_mood_default_bgm_title'

// YouTube oEmbed endpoint — public, no API key, CORS friendly.
async function fetchYoutubeTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.title === 'string' ? data.title : null
  } catch {
    return null
  }
}

// Mirror of DISTORTIONS labels in MoodEntryModal — kept short so the
// trend panel can show readable names without importing the modal file.
const DISTORTION_LABELS: Record<string, string> = {
  allornone: '흑백사고',
  mindread: '마인드리딩',
  catastrophize: '파국화',
  selfblame: '자기비난',
  overgeneralize: '과잉일반화',
  emoreason: '감정적 추론',
  should: '당위적 사고',
  labeling: '라벨링',
}

export function MoodView() {
  const today = todayStr()
  const entries = useMoodStore((s) => s.entries)
  const deleteEntry = useMoodStore((s) => s.deleteEntry)
  const [editing, setEditing] = useState<MoodEntry | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [defaultBgm, setDefaultBgm] = useState(() => localStorage.getItem(DEFAULT_BGM_KEY) ?? '')
  const [bgmTitle, setBgmTitle] = useState(() => localStorage.getItem(DEFAULT_BGM_TITLE_KEY) ?? '')
  const [bgmOpen, setBgmOpen] = useState(false)
  const [audioName, setAudioName] = useState(() => getAudioName())

  async function handleAudioUpload(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('audio/')) return
    await saveAudio(file)
    setAudioName(file.name)
    // Notify any open entry modal that the audio source changed.
    window.dispatchEvent(new CustomEvent('ff-mood-audio-changed'))
  }

  async function handleAudioClear() {
    await clearAudio()
    setAudioName('')
    window.dispatchEvent(new CustomEvent('ff-mood-audio-changed'))
  }

  function saveBgm(v: string) {
    setDefaultBgm(v)
    if (v.trim()) localStorage.setItem(DEFAULT_BGM_KEY, v.trim())
    else {
      localStorage.removeItem(DEFAULT_BGM_KEY)
      localStorage.removeItem(DEFAULT_BGM_TITLE_KEY)
      setBgmTitle('')
    }
  }

  // Resolve the video title via YouTube oEmbed — no API key needed.
  // Cached in localStorage so refresh doesn't refetch. We only kick off a
  // fetch when the URL changed and we don't yet have a title for it.
  useEffect(() => {
    const url = defaultBgm.trim()
    if (!url) return
    const cachedFor = localStorage.getItem(DEFAULT_BGM_KEY)
    const cachedTitle = localStorage.getItem(DEFAULT_BGM_TITLE_KEY)
    if (cachedFor === url && cachedTitle) return  // already resolved
    let cancelled = false
    fetchYoutubeTitle(url).then((title) => {
      if (cancelled || !title) return
      setBgmTitle(title)
      localStorage.setItem(DEFAULT_BGM_TITLE_KEY, title)
    })
    return () => { cancelled = true }
  }, [defaultBgm])

  const todayEntries = entries.filter((e) => e.date === today)
  const pastEntries = entries.filter((e) => e.date !== today).slice(0, 20)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      <style>{`
        @keyframes mood-float-in { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mood-soft-pulse { 0%,100% { box-shadow: 0 6px 20px color-mix(in srgb, var(--pink) 22%, transparent); } 50% { box-shadow: 0 8px 26px color-mix(in srgb, var(--pink) 38%, transparent); } }
      `}</style>

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--pink) 18%, #fff) 0%, color-mix(in srgb, var(--pl) 70%, #fff) 100%)',
        borderRadius: 18,
        padding: '14px 18px',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, opacity: .15, transform: 'rotate(15deg)' }}>💝</div>
        <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>일기</div>
        <div style={{ fontSize: 11, color: '#888' }}>오늘 어떻게 지내고 있어?</div>
      </div>

      {/* BGM card */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: '10px 14px',
        marginBottom: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
        border: '1px solid color-mix(in srgb, var(--pl) 60%, #fff)',
      }}>
        <button
          onClick={() => setBgmOpen((o) => !o)}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0, fontFamily: 'inherit', gap: 8 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 14 }}>🎵</span>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600, flexShrink: 0 }}>기본 BGM</span>
            {defaultBgm && bgmTitle ? (
              <span style={{ fontSize: 11, color: 'var(--pd)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, fontWeight: 500 }} title={bgmTitle}>· {bgmTitle}</span>
            ) : defaultBgm ? (
              <span style={{ background: 'var(--pl)', color: 'var(--pink)', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>설정됨</span>
            ) : null}
          </span>
          <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600, flexShrink: 0 }}>{bgmOpen ? '접기' : '설정'}</span>
        </button>
        {bgmOpen && (
          <div style={{ marginTop: 10, animation: 'mood-float-in .2s ease' }}>
            {/* YouTube link */}
            <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 4 }}>유튜브 링크</div>
            <input
              type="text"
              value={defaultBgm}
              onChange={(e) => saveBgm(e.target.value)}
              placeholder="https://youtu.be/..."
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid color-mix(in srgb, var(--pl) 80%, #fff)', borderRadius: 10, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--pl) 25%, #fff)' }}
            />

            {/* MP3 file upload */}
            <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginTop: 10, marginBottom: 4 }}>또는 mp3 파일 (광고 없음)</div>
            {audioName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'color-mix(in srgb, var(--pl) 35%, #fff)', borderRadius: 10, border: '1.5px solid color-mix(in srgb, var(--pl) 80%, #fff)' }}>
                <span style={{ fontSize: 14 }}>🎵</span>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--pd)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audioName}</span>
                <button
                  onClick={handleAudioClear}
                  style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12, padding: 4, fontFamily: 'inherit' }}
                >✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: '1.5px dashed color-mix(in srgb, var(--pl) 80%, #fff)', borderRadius: 10, cursor: 'pointer', fontSize: 11, color: '#888', fontFamily: 'inherit' }}>
                📁 mp3 파일 선택
                <input
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { handleAudioUpload(e.target.files?.[0] ?? null); e.target.value = '' }}
                />
              </label>
            )}

            <div style={{ fontSize: 10, color: '#aaa', marginTop: 6, lineHeight: 1.5 }}>
              {audioName ? '🎵 mp3가 우선 재생돼. 유튜브는 mp3 지우면 사용.' : '둘 다 설정하면 mp3 우선.'}
            </div>
          </div>
        )}
      </div>

      {/* Add entry CTA */}
      <button
        onClick={() => setShowNew(true)}
        style={{
          width: '100%',
          padding: '16px 14px',
          borderRadius: 18,
          border: 'none',
          background: 'linear-gradient(135deg, var(--pink) 0%, color-mix(in srgb, var(--pink) 60%, #ffb4c8) 100%)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginBottom: 18,
          boxShadow: '0 6px 20px color-mix(in srgb, var(--pink) 28%, transparent)',
          letterSpacing: 0.2,
          animation: 'mood-soft-pulse 3.2s ease-in-out infinite',
        }}
      >
        ✨ 감정 기록 남기기
      </button>

      {/* Trend analytics — pure local computation, no API/token cost */}
      {entries.length >= 2 && <TrendPanel entries={entries} />}

      {/* Today section */}
      <SectionHeader emoji="🌸" title="오늘" count={todayEntries.length} />
      {todayEntries.length === 0 ? (
        <div style={{ color: '#bbb', fontSize: 12, textAlign: 'center', padding: '24px 0', background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, marginBottom: 8 }}>
          아직 오늘 기록한 감정이 없어<br />
          <span style={{ fontSize: 10, color: '#ccc' }}>위 버튼으로 첫 기록 남겨봐 🍃</span>
        </div>
      ) : (
        todayEntries.map((e) => (
          <EntryCard key={e.id} entry={e} onTap={() => setEditing(e)} onDelete={() => deleteEntry(e.id)} />
        ))
      )}

      {/* Past section */}
      {pastEntries.length > 0 && (
        <>
          <div style={{ marginTop: 18 }}>
            <SectionHeader emoji="🕊" title="지난 기록" count={pastEntries.length} />
          </div>
          {pastEntries.map((e) => (
            <EntryCard key={e.id} entry={e} onTap={() => setEditing(e)} onDelete={() => deleteEntry(e.id)} />
          ))}
        </>
      )}

      {showNew && <MoodEntryModal onClose={() => setShowNew(false)} />}
      {editing && <MoodEntryModal entry={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function SectionHeader({ emoji, title, count }: { emoji: string; title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 2px' }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>{title}</span>
      <span style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, color-mix(in srgb, var(--pl) 80%, #fff), transparent)' }} />
    </div>
  )
}

// Local-only accumulated stats — no API calls, no token cost.
function TrendPanel({ entries }: { entries: MoodEntry[] }) {
  // Average sliders across all entries (only count where the field exists).
  const avg = (key: 'focus' | 'mood' | 'energy') => {
    const vals = entries.map((e) => e[key]).filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }
  const focusAvg = avg('focus')
  const moodAvg = avg('mood')
  const energyAvg = avg('energy')

  // Last 7 days: per-day mean of mood (most expressive single line).
  const today = new Date()
  const days: Array<{ key: string; label: string; mood: number | null; focus: number | null; energy: number | null }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayEntries = entries.filter((e) => e.date === key)
    const m = dayEntries.map((e) => e.mood).filter((v): v is number => typeof v === 'number')
    const f = dayEntries.map((e) => e.focus).filter((v): v is number => typeof v === 'number')
    const en = dayEntries.map((e) => e.energy).filter((v): v is number => typeof v === 'number')
    const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null)
    days.push({
      key,
      label: String(d.getDate()),
      mood: mean(m),
      focus: mean(f),
      energy: mean(en),
    })
  }

  // Top emotions
  const emoCount = new Map<string, number>()
  entries.forEach((e) => e.emotions?.forEach((t) => emoCount.set(t, (emoCount.get(t) ?? 0) + 1)))
  const topEmotions = Array.from(emoCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Top distortions — your "단골 함정"
  const distCount = new Map<string, number>()
  entries.forEach((e) => e.distortions?.forEach((t) => distCount.set(t, (distCount.get(t) ?? 0) + 1)))
  const topDistortions = Array.from(distCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // Average distress drop (where both before & after exist)
  const drops = entries
    .map((e) => (e.distressBefore != null && e.distressAfter != null ? e.distressBefore - e.distressAfter : null))
    .filter((v): v is number => typeof v === 'number')
  const dropAvg = drops.length ? drops.reduce((s, v) => s + v, 0) / drops.length : null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff 0%, color-mix(in srgb, var(--pl) 30%, #fff) 100%)',
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
      border: '1px solid color-mix(in srgb, var(--pl) 60%, #fff)',
      boxShadow: '0 2px 10px rgba(0,0,0,.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13 }}>📊</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>누적 분석</span>
        <span style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{entries.length}개 기록</span>
      </div>

      {/* Averages */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <AvgPill icon="🎯" label="집중" value={focusAvg} />
        <AvgPill icon="😊" label="기분" value={moodAvg} />
        <AvgPill icon="⚡" label="에너지" value={energyAvg} />
      </div>

      {/* 7-day mini line chart */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 6 }}>최근 7일 흐름</div>
        <MiniLineChart days={days} />
        <div style={{ display: 'flex', gap: 12, marginTop: 4, justifyContent: 'center' }}>
          <Legend color="var(--pink)" label="기분" />
          <Legend color="#9CB7FF" label="집중" />
          <Legend color="#FFC58A" label="에너지" />
        </div>
      </div>

      {/* Top emotions */}
      {topEmotions.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 6 }}>자주 등장한 감정</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {topEmotions.map(([t, n]) => (
              <span key={t} style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>#{t} <span style={{ color: 'var(--pink)' }}>{n}</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Top cognitive distortions — 너의 단골 함정 */}
      {topDistortions.length > 0 && (
        <div style={{ marginBottom: dropAvg != null ? 10 : 0 }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 6 }}>🪤 자주 걸리는 함정</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {topDistortions.map(([id, n]) => (
              <span key={id} style={{ background: 'color-mix(in srgb, var(--pink) 14%, #fff)', color: 'var(--pd)', border: '1px solid color-mix(in srgb, var(--pink) 30%, #fff)', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>{DISTORTION_LABELS[id] ?? id} <span style={{ color: 'var(--pink)' }}>{n}</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Average distress drop */}
      {dropAvg != null && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--pl) 50%, #fff)', padding: '5px 11px', borderRadius: 99, fontSize: 11, color: 'var(--pd)', fontWeight: 700 }}>
          🌱 평균 고통 감소 <span style={{ color: 'var(--pink)' }}>-{dropAvg.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

function AvgPill({ icon, label, value }: { icon: string; label: string; value: number | null }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1px solid color-mix(in srgb, var(--pl) 60%, #fff)', textAlign: 'center' }}>
      <div style={{ fontSize: 12, marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--pd)' }}>{value != null ? value.toFixed(1) : '—'}</div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#666' }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      {label}
    </span>
  )
}

interface DayPoint { mood: number | null; focus: number | null; energy: number | null; label: string }
function MiniLineChart({ days }: { days: DayPoint[] }) {
  const W = 320
  const H = 70
  const pad = 6
  const stepX = (W - pad * 2) / Math.max(1, days.length - 1)
  const yFor = (v: number | null) => v == null ? null : H - pad - (v / 10) * (H - pad * 2)
  const linePath = (key: 'mood' | 'focus' | 'energy') => {
    let d = ''
    let started = false
    days.forEach((day, i) => {
      const y = yFor(day[key])
      if (y == null) return
      const x = pad + i * stepX
      d += (started ? ' L' : 'M') + x + ' ' + y
      started = true
    })
    return d
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
      {/* baseline */}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#eee" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={W - pad} y2={pad} stroke="#f5f5f5" strokeWidth={1} strokeDasharray="2 3" />
      <path d={linePath('focus')} stroke="#9CB7FF" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={linePath('energy')} stroke="#FFC58A" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={linePath('mood')} stroke="var(--pink)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {days.map((d, i) => {
        const y = yFor(d.mood)
        if (y == null) return null
        return <circle key={i} cx={pad + i * stepX} cy={y} r={2.5} fill="var(--pink)" />
      })}
      {days.map((d, i) => (
        <text key={`l${i}`} x={pad + i * stepX} y={H - 1} fontSize="7" textAnchor="middle" fill="#bbb">{d.label}</text>
      ))}
    </svg>
  )
}

function EntryCard({ entry, onTap, onDelete }: { entry: MoodEntry; onTap: () => void; onDelete: () => void }) {
  const tags = entry.emotions?.slice(0, 3) ?? []
  const dropDelta = (entry.distressBefore != null && entry.distressAfter != null)
    ? entry.distressBefore - entry.distressAfter
    : null
  // Mood-tinted left bar — softer when mood is higher.
  const moodHue = entry.mood ?? 5
  const accent = moodHue >= 7 ? '#FFD8A8'   // warm peach (good)
    : moodHue <= 3 ? '#C9D6FF'              // soft blue (low)
    : 'var(--pink)'                          // mid → brand pink
  const stateChips = [
    entry.focus != null ? { icon: '🎯', val: entry.focus } : null,
    entry.mood != null ? { icon: '😊', val: entry.mood } : null,
    entry.energy != null ? { icon: '⚡', val: entry.energy } : null,
  ].filter(Boolean) as Array<{ icon: string; val: number }>
  const summary = entry.situation || entry.quickNote
  return (
    <div
      onClick={onTap}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '12px 14px 12px 16px',
        marginBottom: 8,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        border: '1px solid #f5f5f5',
        borderLeft: `4px solid ${accent}`,
        transition: 'transform .15s ease, box-shadow .15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ background: 'color-mix(in srgb, var(--pl) 40%, #fff)', color: 'var(--pd)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
          {entry.date.slice(5)} · {entry.time}
        </span>
        {tags.map((t) => (
          <span key={t} style={{ background: 'var(--pl)', color: 'var(--pink)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>#{t}</span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {entry.intensity != null && (
            <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>강도 {entry.intensity}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1 }}
            aria-label="삭제"
          >✕</button>
        </span>
      </div>

      {stateChips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {stateChips.map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '2px 7px', fontSize: 10, color: '#666', fontWeight: 600 }}>
              <span>{c.icon}</span>
              <span style={{ color: 'var(--pd)' }}>{c.val}</span>
            </span>
          ))}
        </div>
      )}

      {summary && (
        <div style={{ fontSize: 12.5, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>{summary}</div>
      )}

      {dropDelta != null && dropDelta > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: 'var(--pink)', fontWeight: 700, background: 'color-mix(in srgb, var(--pl) 50%, #fff)', padding: '3px 10px', borderRadius: 99 }}>
          🌱 고통 {entry.distressBefore} → {entry.distressAfter} (-{dropDelta})
        </div>
      )}
    </div>
  )
}
