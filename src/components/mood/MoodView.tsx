// Mood / 마음 tab — daily slider track + CBT-style emotion journal entries.
// Dev-mode only for now. Local-only persistence (no Firestore sync yet).
import { useState } from 'react'
import { todayStr } from '../../lib/date'
import { useMoodStore } from '../../store/MoodStore'
import { MoodEntryModal } from './MoodEntryModal'
import type { MoodEntry } from '../../types/mood'

const DEFAULT_BGM_KEY = 'ff_mood_default_bgm'

export function MoodView() {
  const today = todayStr()
  const daily = useMoodStore((s) => s.daily[today])
  const entries = useMoodStore((s) => s.entries)
  const setDailySlider = useMoodStore((s) => s.setDailySlider)
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

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ fontSize: 13, color: 'var(--pd)', fontWeight: 700, marginBottom: 10 }}>
        💝 마음 — 너의 오늘 컨디션
      </div>

      {/* Default BGM (collapsible) — auto-plays when entry modal opens */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 10, border: '1px solid #f5f5f5' }}>
        <button
          onClick={() => setBgmOpen((o) => !o)}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>🎵 기본 BGM {defaultBgm ? '(설정됨)' : '(없음)'}</span>
          <span style={{ fontSize: 10, color: '#aaa' }}>{bgmOpen ? '접기' : '설정'}</span>
        </button>
        {bgmOpen && (
          <div style={{ marginTop: 6 }}>
            <input
              type="text"
              value={defaultBgm}
              onChange={(e) => saveBgm(e.target.value)}
              placeholder="https://youtu.be/... (일기 쓸 때 자동 재생)"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>각 기록마다 다른 곡 넣고 싶으면 모달 안에서 따로 설정</div>
          </div>
        )}
      </div>

      {/* Daily slider track */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 10 }}>오늘 한눈에 (10초)</div>
        <SliderRow icon="🎯" label="집중" value={daily?.focus ?? 5}
          onChange={(v) => setDailySlider(today, { focus: v })} />
        <SliderRow icon="😊" label="기분" value={daily?.mood ?? 5}
          onChange={(v) => setDailySlider(today, { mood: v })} />
        <SliderRow icon="⚡" label="에너지" value={daily?.energy ?? 5}
          onChange={(v) => setDailySlider(today, { energy: v })} />
        <input
          type="text"
          placeholder="한 줄 메모 (선택)"
          value={daily?.note ?? ''}
          onChange={(e) => setDailySlider(today, { note: e.target.value })}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginTop: 6 }}
        />
      </div>

      {/* Add entry button */}
      <button
        onClick={() => setShowNew(true)}
        style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px dashed var(--pink)', background: 'var(--pl)', color: 'var(--pd)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}
      >+ 감정 기록 추가하기</button>

      {/* Today's entries */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6 }}>
        오늘 기록 ({todayEntries.length})
      </div>
      {todayEntries.length === 0 ? (
        <div style={{ color: '#bbb', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
          아직 오늘 기록한 감정이 없어
        </div>
      ) : (
        todayEntries.map((e) => (
          <EntryCard key={e.id} entry={e} onTap={() => setEditing(e)} onDelete={() => deleteEntry(e.id)} />
        ))
      )}

      {/* Past entries (last 7 days, excluding today) */}
      {entries.filter((e) => e.date !== today).slice(0, 20).length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', margin: '18px 0 6px' }}>지난 기록</div>
          {entries.filter((e) => e.date !== today).slice(0, 20).map((e) => (
            <EntryCard key={e.id} entry={e} onTap={() => setEditing(e)} onDelete={() => deleteEntry(e.id)} />
          ))}
        </>
      )}

      {showNew && <MoodEntryModal onClose={() => setShowNew(false)} />}
      {editing && <MoodEntryModal entry={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function SliderRow({ icon, label, value, onChange }: { icon: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#666', width: 32 }}>{label}</span>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--pink)' }}
      />
      <span style={{ fontSize: 12, color: 'var(--pd)', fontWeight: 700, width: 22, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function EntryCard({ entry, onTap, onDelete }: { entry: MoodEntry; onTap: () => void; onDelete: () => void }) {
  const tags = entry.emotions?.slice(0, 3) ?? []
  const dropDelta = (entry.distressBefore != null && entry.distressAfter != null)
    ? entry.distressBefore - entry.distressAfter
    : null
  return (
    <div
      onClick={onTap}
      style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#999' }}>{entry.date.slice(5)} {entry.time}</span>
        {tags.map((t) => (
          <span key={t} style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 99 }}>#{t}</span>
        ))}
        {entry.intensity != null && (
          <span style={{ fontSize: 9, color: '#aaa', marginLeft: 'auto' }}>강도 {entry.intensity}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12, padding: 2 }}
        >✕</button>
      </div>
      {entry.situation && (
        <div style={{ fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.situation}</div>
      )}
      {dropDelta != null && dropDelta > 0 && (
        <div style={{ fontSize: 10, color: 'var(--pink)', marginTop: 2, fontWeight: 700 }}>
          고통 {entry.distressBefore} → {entry.distressAfter} (-{dropDelta})
        </div>
      )}
    </div>
  )
}

