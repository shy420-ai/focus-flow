// Mood / 마음 tab — CBT-style emotion journal entries with per-entry
// slider snapshots (집중·기분·에너지). Dev-mode only for now. Local-only
// persistence (no Firestore sync yet).
import { useState } from 'react'
import { todayStr } from '../../lib/date'
import { useMoodStore } from '../../store/MoodStore'
import { MoodEntryModal } from './MoodEntryModal'
import type { MoodEntry } from '../../types/mood'

const DEFAULT_BGM_KEY = 'ff_mood_default_bgm'

export function MoodView() {
  const today = todayStr()
  const entries = useMoodStore((s) => s.entries)
  const deleteEntry = useMoodStore((s) => s.deleteEntry)
  const [editing, setEditing] = useState<MoodEntry | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [defaultBgm, setDefaultBgm] = useState(() => localStorage.getItem(DEFAULT_BGM_KEY) ?? '')
  const [bgmOpen, setBgmOpen] = useState(false)

  function saveBgm(v: string) {
    setDefaultBgm(v)
    if (v.trim()) localStorage.setItem(DEFAULT_BGM_KEY, v.trim())
    else localStorage.removeItem(DEFAULT_BGM_KEY)
  }

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
        <div style={{ fontSize: 14, color: 'var(--pd)', fontWeight: 800, marginBottom: 2 }}>마음</div>
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
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🎵</span>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>기본 BGM</span>
            {defaultBgm && <span style={{ background: 'var(--pl)', color: 'var(--pink)', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>설정됨</span>}
          </span>
          <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600 }}>{bgmOpen ? '접기' : '설정'}</span>
        </button>
        {bgmOpen && (
          <div style={{ marginTop: 10, animation: 'mood-float-in .2s ease' }}>
            <input
              type="text"
              value={defaultBgm}
              onChange={(e) => saveBgm(e.target.value)}
              placeholder="https://youtu.be/... (일기 쓸 때 자동 재생)"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid color-mix(in srgb, var(--pl) 80%, #fff)', borderRadius: 10, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'color-mix(in srgb, var(--pl) 25%, #fff)' }}
            />
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 6, lineHeight: 1.5 }}>각 기록마다 다른 곡 넣고 싶으면 모달 안에서 따로 설정해도 OK</div>
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
