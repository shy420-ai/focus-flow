// CBT thought-record entry modal. All fields optional except situation
// (so you can save a quick capture without finishing the full record).
import { useState, useEffect } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import { useMoodStore } from '../../store/MoodStore'
import { showMiniToast } from '../../lib/miniToast'
import { loadAudioBlob, getAudioName } from '../../lib/moodAudio'
import { todayStr, pad } from '../../lib/date'
import type { MoodEntry } from '../../types/mood'

const SOFT_LIMIT_SEC = 300  // 5 minutes — gentle nudge, not enforced

const EMOTION_GROUPS: Array<{ label: string; chips: string[] }> = [
  { label: '🌧 힘든 감정', chips: ['짜증', '분노', '억울함', '서운함', '불안', '걱정', '두려움', '긴장', '슬픔', '외로움', '공허함', '우울', '부끄러움', '죄책감', '자기혐오', '실망', '좌절', '답답함', '무기력', '지침', '피곤함', '멍함', '혼란', '복잡함'] },
  { label: '☀️ 편안한 감정', chips: ['뿌듯', '평온', '감사', '설렘', '안도', '홀가분', '기대', '기쁨', '따뜻함', '사랑', '자랑스러움', '신남', '활기', '만족', '자신감', '희망', '여유', '즐거움', '든든함', '반가움', '차분함', '충만'] },
]

// Each distortion has a *mechanism* (the cognitive move) and a *hint*
// (a real example). Showing both side-by-side keeps cards distinct —
// the content is similar but the moves are different.
type Distortion = { id: string; label: string; mechanism: string; hint: string; group: 'guess' | 'overgen' | 'rule' }
const DISTORTIONS: Distortion[] = [
  // 🔮 추측류 — 증거 없이 머릿속에서 결론
  { id: 'mindread', label: '마인드리딩', mechanism: '남의 마음 추측', hint: '"남이 비웃을 거야"', group: 'guess' },
  { id: 'catastrophize', label: '파국화', mechanism: '미래 최악 상상', hint: '"인생 끝났어"', group: 'guess' },
  { id: 'emoreason', label: '감정적 추론', mechanism: '느낌 = 사실', hint: '"불안하니까 위험할 거야"', group: 'guess' },
  // 🌀 일반화류 — 한 부분을 전체로
  { id: 'allornone', label: '흑백사고', mechanism: '이분법 (둘 중 하나)', hint: '"완벽 X면 실패"', group: 'overgen' },
  { id: 'overgeneralize', label: '과잉일반화', mechanism: '한 번 → 매번', hint: '"나는 항상 이래"', group: 'overgen' },
  { id: 'labeling', label: '라벨링', mechanism: '행동 → 정체성', hint: '"나는 실패자"', group: 'overgen' },
  // ⚖️ 규칙·책임류 — 짊어지지 말아야 할 짐
  { id: 'selfblame', label: '자기비난', mechanism: '내 탓 과대화', hint: '"다 내 탓"', group: 'rule' },
  { id: 'should', label: '당위적 사고', mechanism: '"꼭 ~해야" 강박', hint: '"절대 화내면 안 돼"', group: 'rule' },
]
const DISTORTION_GROUP_LABEL: Record<Distortion['group'], { label: string; color: string }> = {
  guess: { label: '🔮 추측 함정 — 증거 없이 결론', color: '#B6A8E8' },
  overgen: { label: '🌀 일반화 함정 — 한 부분을 전체로', color: 'var(--pink)' },
  rule: { label: '⚖️ 규칙·책임 함정 — 짊어진 짐', color: '#FFB677' },
}

// CBT/ACT 검증된 기법만 선별. 카드 라벨/설명 + 구체 예시(이해용) +
// 빈칸 폼(slots) — 카드 탭하면 빈칸만 채우는 폼이 떠서, 너 상황에
// 맞는 문장이 자동 조립됨.
type ActionSlot = { label: string; placeholder: string }
type ActionTemplate = {
  label: string
  desc: string
  example: string
  slots?: ActionSlot[]
  assemble?: (vals: string[]) => string
}
const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    label: '4-7-8 호흡',
    desc: '격앙·충동 즉각 차단 (자율신경 진정)',
    example: '4초 들이쉬고 → 7초 멈추고 → 8초 내쉬기, 4번 반복',
    // No slots — tap fills the example directly.
  },
  {
    label: '행동 실험',
    desc: '자동 사고가 진짜 맞는지 검증 (Beck CBT 핵심)',
    example: '"사람들이 비웃었을 거야" 진짜인지, 동료한테 "오늘 발표 어땠어" 직접 물어본다',
    slots: [
      { label: '확인하고 싶은 자동 사고', placeholder: '예: 사람들이 비웃었을 거야' },
      { label: '어떻게 검증할지', placeholder: '예: 동료한테 직접 물어본다' },
    ],
    assemble: ([a, b]) => `"${a}" 진짜인지, ${b}`,
  },
  {
    label: '증거 점검',
    desc: '자동 사고 vs 사실의 증거·반증 (Beck CBT)',
    example: '"또 망했다" — 증거: 발표 더듬음. 반증: 끝까지 마무리, 핵심 메시지 전달됨.',
    slots: [
      { label: '자동 사고', placeholder: '예: 또 망했다' },
      { label: '증거 (그 생각을 뒷받침하는 사실)', placeholder: '예: 발표 더듬었음' },
      { label: '반증 (그 생각과 안 맞는 사실)', placeholder: '예: 끝까지 마무리, 핵심은 전달됨' },
    ],
    assemble: ([a, b, c]) => `"${a}" — 증거: ${b} / 반증: ${c}`,
  },
  {
    label: '작게 부딪히기',
    desc: '피하던 거에 짧게 노출 (불안장애 1차 치료)',
    example: '회의 발언이 무서워 회피 중 → 다음 회의에서 한 마디만 해본다',
    slots: [
      { label: '지금 피하고 있는 것', placeholder: '예: 회의 발언' },
      { label: '5분짜리 첫 걸음', placeholder: '예: 다음 회의에서 한 마디만 해보기' },
    ],
    assemble: ([a, b]) => `${a} 회피 중 → ${b}`,
  },
  {
    label: '친구라면',
    desc: '자기비난 대신 친구한테 하듯 (Neff Self-Compassion)',
    example: '친구가 발표 더듬었으면 "한 번 그런 거지, 다음엔 잘 해" 라고 말해줬을 거야',
    slots: [
      { label: '친구한테 해줄 한 마디', placeholder: '예: 한 번 그런 거지, 다음엔 잘 해' },
    ],
    assemble: ([a]) => `친구가 그랬으면 "${a}" 라고 말해줬을 거야`,
  },
  {
    label: '시간 거리 두기',
    desc: '지금 vs 미래 무게 비교 (Self-Distancing)',
    example: '지금: 머리 90% 잡고 있음 / 1년 후: 거의 안 떠오를 듯',
    slots: [
      { label: '지금 이 일의 무게 (머리에 얼마나 차지해?)', placeholder: '예: 머리 90% 잡고 있음 / 잠도 못 잘 정도' },
      { label: '1년 후 이 일의 무게 (그때 시점에서 보면?)', placeholder: '예: 거의 안 떠오를 듯 / 가끔 생각나는 추억 정도' },
    ],
    assemble: ([a, b]) => `지금: ${a} / 1년 후: ${b}`,
  },
  {
    label: '본질적 가치로 돌아가기',
    desc: '감정 말고 내 본질 가치에 맞춰 행동 (ACT)',
    example: '내가 본질적으로 중요하게 여기는 "솔직한 관계" 따라서, 친구한테 미안하다고 말한다',
    slots: [
      { label: '나에게 본질적인 가치', placeholder: '예: 솔직한 관계' },
      { label: '그 가치에 맞는 행동', placeholder: '예: 친구한테 미안하다고 말한다' },
    ],
    assemble: ([a, b]) => `내가 본질적으로 중요하게 여기는 "${a}" 따라서, ${b}`,
  },
]

interface Props {
  entry?: MoodEntry
  onClose: () => void
}

export function MoodEntryModal({ entry, onClose }: Props) {
  const addEntry = useMoodStore((s) => s.addEntry)
  const editEntry = useMoodStore((s) => s.editEntry)
  useBackClose(true, onClose)

  // Per-entry sliders (Section 1 — moved from the daily summary so each
  // entry has its own snapshot of how I'm doing in this moment).
  const [focus, setFocus] = useState<number>(entry?.focus ?? 5)
  const [mood, setMood] = useState<number>(entry?.mood ?? 5)
  const [energy, setEnergy] = useState<number>(entry?.energy ?? 5)
  const [quickNote, setQuickNote] = useState(entry?.quickNote ?? '')
  const [situation, setSituation] = useState(entry?.situation ?? '')
  const [autoThought, setAutoThought] = useState(entry?.autoThought ?? '')
  const [emotions, setEmotions] = useState<string[]>(entry?.emotions ?? [])
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 5)
  const [distortions, setDistortions] = useState<string[]>(entry?.distortions ?? [])
  const [nextAction, setNextAction] = useState(entry?.nextAction ?? '')
  const [distressBefore] = useState<number | undefined>(entry?.distressBefore ?? entry?.intensity ?? undefined)
  const [distressAfter, setDistressAfter] = useState<number | undefined>(entry?.distressAfter)
  // BGM resolves at modal-open time: either the entry's saved URL or the
  // user's default. No per-entry override UI right now, so this is read-only.
  const youtubeUrl = entry?.youtubeUrl ?? localStorage.getItem('ff_mood_default_bgm') ?? ''
  // Soft 5-min timer — counts up from 0, nudges at 5:00 but never forces save.
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (entry) return  // don't time edits — only fresh writes
    const t = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1
        if (next === SOFT_LIMIT_SEC) {
          showMiniToast('5분 됐어. 여기까지만 해도 충분 ✓')
        }
        return next
      })
    }, 1000)
    return () => clearInterval(t)
  }, [entry])
  const overLimit = elapsed >= SOFT_LIMIT_SEC
  // Action template slot fill-in: when a card with slots is tapped, render
  // labeled inputs below the grid so the user only fills the blanks. The
  // assembled sentence then drops into 다음 선택.
  const [activeTplIdx, setActiveTplIdx] = useState<number | null>(null)
  const [slotVals, setSlotVals] = useState<string[]>([])

  const [breathingOpen, setBreathingOpen] = useState(false)

  function pickAction(idx: number) {
    const t = ACTION_TEMPLATES[idx]
    // Special case: 4-7-8 호흡 → guided breathing timer instead of text fill
    if (t.label === '4-7-8 호흡') {
      setBreathingOpen(true)
      setActiveTplIdx(null)
      return
    }
    if (!t.slots || !t.assemble) {
      setNextAction(t.example)
      setActiveTplIdx(null)
      return
    }
    setActiveTplIdx(idx)
    setSlotVals(t.slots.map(() => ''))
  }

  function commitSlots() {
    if (activeTplIdx == null) return
    const t = ACTION_TEMPLATES[activeTplIdx]
    if (!t.slots || !t.assemble) return
    if (slotVals.some((v) => !v.trim())) return
    setNextAction(t.assemble(slotVals))
    setActiveTplIdx(null)
  }

  function toggleChip(arr: string[], v: string, setter: (next: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  function save() {
    // Allow saving with just the sliders too — they're a valid quick check-in.
    if (!situation.trim() && emotions.length === 0 && !quickNote.trim()) {
      onClose()
      return
    }
    const now = new Date()
    const payload = {
      date: entry?.date ?? todayStr(),
      time: entry?.time ?? `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      focus,
      mood,
      energy,
      quickNote: quickNote.trim() || undefined,
      situation: situation.trim() || undefined,
      autoThought: autoThought.trim() || undefined,
      emotions: emotions.length ? emotions : undefined,
      intensity,
      bodyFelt: entry?.bodyFelt,  // legacy field preserved
      distortions: distortions.length ? distortions : undefined,
      reframe: entry?.reframe,  // preserved if existing entry already had one
      nextAction: nextAction.trim() || undefined,
      distressBefore: distressBefore ?? intensity,
      distressAfter,
      youtubeUrl: youtubeUrl.trim() || undefined,
    }
    if (entry) editEntry(entry.id, payload)
    else addEntry(payload)
    onClose()
  }

  const embedSrc = ytEmbed(youtubeUrl, true)  // autoplay enabled

  // mp3 BGM takes precedence over YouTube. Loaded from IndexedDB at mount;
  // we create an Object URL so <audio> can stream it.
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  useEffect(() => {
    let revokeUrl: string | null = null
    let cancelled = false
    if (getAudioName()) {
      loadAudioBlob().then((blob) => {
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        revokeUrl = url
        setAudioUrl(url)
      })
    }
    return () => {
      cancelled = true
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`@keyframes mood-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>💝 {entry ? '감정 기록 편집' : '새 감정 기록'}</div>
            {!entry && (
              <span style={{ fontSize: 10, color: overLimit ? 'var(--pink)' : '#aaa', fontVariantNumeric: 'tabular-nums', fontWeight: overLimit ? 700 : 500 }}>
                ⏱ {pad(Math.floor(elapsed / 60))}:{pad(elapsed % 60)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={save}
              style={{ background: 'var(--pink)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', animation: overLimit ? 'mood-pulse 1.4s ease-in-out infinite' : undefined }}
            >저장</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* BGM at top — autoplays so the music starts as the modal opens.
              mp3 file takes precedence over YouTube. */}
          {audioUrl ? (
            <audio
              src={audioUrl}
              autoPlay
              loop
              controls
              style={{ width: '100%', borderRadius: 10 }}
            />
          ) : embedSrc ? (
            <iframe
              src={embedSrc}
              title="BGM"
              style={{ width: '100%', height: 80, border: 'none', borderRadius: 10 }}
              allow="autoplay; encrypted-media"
            />
          ) : null}

          {/* 1. 지금 상태 (per-entry slider snapshot) */}
          <Section title="1. 지금 상태" hint="이 순간 컨디션 — 슬라이더만 끌어도 OK.">
            <ModalSliderRow icon="🎯" label="집중" value={focus} onChange={setFocus} />
            <ModalSliderRow icon="😊" label="기분" value={mood} onChange={setMood} />
            <ModalSliderRow icon="⚡" label="에너지" value={energy} onChange={setEnergy} />
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="한 줄 메모 (선택)"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginTop: 6 }}
            />
          </Section>

          {/* 2. 상황 */}
          <Section title="2. 상황" hint="사실 한 줄. 평가·해석 X.">
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="예: 오후 4시 회의에서 발표 더듬음"
              rows={2}
              style={textareaStyle}
            />
          </Section>

          {/* 3. 자동 생각 */}
          <Section title="3. 자동 생각" hint="그 순간 머리에 든 한 줄.">
            <textarea
              value={autoThought}
              onChange={(e) => setAutoThought(e.target.value)}
              placeholder="예: 또 망했다 / 사람들이 비웃었을 듯"
              rows={2}
              style={textareaStyle}
            />
          </Section>

          {/* 4. 감정 + 강도 */}
          <Section title="4. 감정" hint="구체적인 단어로 — 이름 붙이기만 해도 진정돼.">
            {EMOTION_GROUPS.map((g) => (
              <div key={g.label} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 4 }}>{g.label}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {g.chips.map((c) => {
                    const on = emotions.includes(c)
                    return (
                      <button
                        key={c}
                        onClick={() => toggleChip(emotions, c, setEmotions)}
                        style={{
                          padding: '4px 10px', borderRadius: 99,
                          border: '1.5px solid ' + (on ? 'var(--pink)' : '#eee'),
                          background: on ? 'var(--pink)' : '#fff',
                          color: on ? '#fff' : 'var(--pd)',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >#{c}</button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#666' }}>강도</span>
              <input
                type="range"
                min={0}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--pink)' }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', width: 22, textAlign: 'right' }}>{intensity}</span>
            </div>
          </Section>

          {/* 5. 사고 함정 */}
          <Section title="5. 사고 함정 체크" hint="(선택) 비슷해 보여도 함정마다 '왜곡 방식'이 달라. 그룹별로 정리.">
            {(['guess', 'overgen', 'rule'] as const).map((g) => {
              const items = DISTORTIONS.filter((d) => d.group === g)
              const meta = DISTORTION_GROUP_LABEL[g]
              return (
                <div key={g} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, marginBottom: 6 }}>{meta.label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {items.map((d) => {
                      const on = distortions.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleChip(distortions, d.id, setDistortions)}
                          style={{
                            padding: '9px 10px',
                            borderRadius: 10,
                            border: '1.5px solid ' + (on ? meta.color : '#eee'),
                            background: on ? `color-mix(in srgb, ${meta.color} 18%, #fff)` : '#fff',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--pd)' }}>{d.label}</span>
                          <span style={{ fontSize: 9.5, color: meta.color, fontWeight: 600 }}>{d.mechanism}</span>
                          <span style={{ fontSize: 9.5, color: '#999', lineHeight: 1.4, marginTop: 1 }}>{d.hint}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </Section>

          {/* 6. 다음 선택 */}
          <Section title="6. 다음 선택" hint="감정은 자동, 반응은 선택 — 카드 탭하면 빈칸만 채우는 폼이 떠.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 8 }}>
              {ACTION_TEMPLATES.map((t, idx) => (
                <ActionCard
                  key={t.label}
                  label={t.label}
                  desc={t.desc}
                  example={t.example}
                  active={activeTplIdx === idx}
                  onClick={() => pickAction(idx)}
                />
              ))}
              <button
                onClick={() => { setNextAction('오늘은 패스'); setActiveTplIdx(null) }}
                style={{ ...passCardStyle, marginTop: 4 }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>오늘은 패스</span>
                <span style={{ fontSize: 9, color: '#bbb', lineHeight: 1.4 }}>비워두고 넘어가기</span>
              </button>
            </div>

            {/* Slot fill-in form for the active template */}
            {activeTplIdx != null && ACTION_TEMPLATES[activeTplIdx].slots && (
              <div style={{ background: 'var(--pl)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)', marginBottom: 8 }}>
                  ✏️ {ACTION_TEMPLATES[activeTplIdx].label} — 빈칸만 채우면 돼
                </div>
                {ACTION_TEMPLATES[activeTplIdx].slots!.map((slot, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 4 }}>{slot.label}</div>
                    <input
                      type="text"
                      value={slotVals[i] ?? ''}
                      onChange={(e) => {
                        const next = [...slotVals]
                        next[i] = e.target.value
                        setSlotVals(next)
                      }}
                      placeholder={slot.placeholder}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #fff', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    onClick={commitSlots}
                    disabled={slotVals.some((v) => !v.trim())}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: slotVals.every((v) => v.trim()) ? 'var(--pink)' : '#ddd', color: '#fff', fontSize: 12, fontWeight: 700, cursor: slotVals.every((v) => v.trim()) ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                  >이걸로 넣기</button>
                  <button
                    onClick={() => setActiveTplIdx(null)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                  >취소</button>
                </div>
              </div>
            )}

            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="카드 탭하거나 직접 써도 OK"
              rows={3}
              style={textareaStyle}
            />
          </Section>

          {/* AFTER 점수 */}
          <Section title="✨ 지금 고통 점수" hint="(선택) 다 적고 나서 다시 매겨봐.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min={0}
                max={10}
                value={distressAfter ?? intensity}
                onChange={(e) => setDistressAfter(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--pink)' }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', width: 22, textAlign: 'right' }}>{distressAfter ?? intensity}</span>
            </div>
            {distressAfter != null && distressBefore != null && distressBefore > distressAfter && (
              <div style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700, marginTop: 4 }}>
                {distressBefore} → {distressAfter} (-{distressBefore - distressAfter}) 잘했어 🌱
              </div>
            )}
          </Section>

          {breathingOpen && <BreathingTimer onClose={() => setBreathingOpen(false)} onComplete={() => { setNextAction('✅ 4-7-8 호흡 4번 완료 — 한결 가라앉음'); setBreathingOpen(false) }} />}

          {/* Bottom save — easier than scrolling back to top */}
          <button
            onClick={save}
            style={{ marginTop: 4, padding: 14, borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px color-mix(in srgb, var(--pink) 40%, transparent)', animation: overLimit ? 'mood-pulse 1.4s ease-in-out infinite' : undefined }}
          >{overLimit ? '저장 ✓ (5분 됐어, 충분해)' : '저장 ✓'}</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 10, color: '#999', marginBottom: 8, lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  )
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e8e8e8',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
  lineHeight: 1.6,
}

// Guided 4-7-8 breathing — 4 cycles of 들이쉬기 4s / 멈춤 7s / 내쉬기 8s.
// Shown as an inline modal-style overlay so the user does the exercise
// before continuing the journal entry.
function BreathingTimer({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const PHASES = [
    { label: '들이쉬기', dur: 4, color: '#FFD8A8' },
    { label: '멈춤', dur: 7, color: '#FFC0CB' },
    { label: '내쉬기', dur: 8, color: '#9CB7FF' },
  ]
  const TOTAL_CYCLES = 4

  const [cycle, setCycle] = useState(0)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [remaining, setRemaining] = useState(PHASES[0].dur)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => {
      // Tick down; when current phase hits 0, advance to next phase or
      // next cycle (or finish). All transitions happen inside this async
      // callback so React doesn't see a synchronous setState chain.
      setRemaining((r) => {
        if (r > 1) return r - 1
        // r === 1, this tick ends the phase
        const nextPhase = phaseIdx + 1
        if (nextPhase >= PHASES.length) {
          const nextCycle = cycle + 1
          if (nextCycle >= TOTAL_CYCLES) {
            setDone(true)
            return 0
          }
          setCycle(nextCycle)
          setPhaseIdx(0)
          return PHASES[0].dur
        }
        setPhaseIdx(nextPhase)
        return PHASES[nextPhase].dur
      })
    }, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phaseIdx, cycle, done])

  const phase = PHASES[phaseIdx]
  // Circle size: grows during inhale, holds, shrinks during exhale
  const scale = phase.label === '들이쉬기' ? 0.6 + (1 - remaining / phase.dur) * 0.6
    : phase.label === '멈춤' ? 1.2
    : 1.2 - (1 - remaining / phase.dur) * 0.6

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 22, padding: '28px 24px', width: '90%', maxWidth: 320, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)' }}>🌬 4-7-8 호흡</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 16, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>

        {!done ? (
          <>
            <div style={{
              width: 180, height: 180, margin: '12px auto', borderRadius: '50%',
              background: `radial-gradient(circle, ${phase.color} 0%, color-mix(in srgb, ${phase.color} 60%, #fff) 100%)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${scale})`,
              transition: 'transform 1s ease-in-out, background 0.3s',
              boxShadow: `0 0 60px ${phase.color}88`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pd)' }}>{phase.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--pd)', fontVariantNumeric: 'tabular-nums' }}>{remaining}</div>
            </div>
            <div style={{ marginTop: 18, fontSize: 11, color: '#888', fontWeight: 600 }}>
              {cycle + 1} / {TOTAL_CYCLES} 사이클
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 4, justifyContent: 'center' }}>
              {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                <span key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i < cycle ? 'var(--pink)' : i === cycle ? 'color-mix(in srgb, var(--pink) 50%, #fff)' : '#eee' }} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)', marginBottom: 6 }}>완료!</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 18 }}>
              4번 다 했어. 한 번 더 해도 되고,<br />여기서 끝내도 좋아.
            </div>
            <button
              onClick={onComplete}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >다음 선택에 기록하기 ✓</button>
            <button
              onClick={onClose}
              style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: 'none', color: '#aaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
            >닫기</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ModalSliderRow({ icon, label, value, onChange }: { icon: string; label: string; value: number; onChange: (v: number) => void }) {
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

function ActionCard({ label, desc, example, active, onClick }: { label: string; desc: string; example: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        border: '1.5px solid ' + (active ? 'var(--pink)' : '#eee'),
        background: active ? 'var(--pl)' : '#fafafa',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--pink)', fontWeight: 600 }}>{desc}</span>
      <span style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{example}</span>
    </button>
  )
}

const passCardStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1.5px dashed #ddd',
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

function ytEmbed(url: string, autoplay = false): string | null {
  if (!url.trim()) return null
  // Accept youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
  const m =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/)
  if (!m) return null
  // youtube-nocookie.com is the privacy-enhanced embed domain. It still
  // shows ads (only YouTube Premium suppresses them) but blocks unrelated
  // tracking cookies, which sometimes reduces ad targeting and frequency.
  const params = autoplay ? '?autoplay=1' : ''
  return `https://www.youtube-nocookie.com/embed/${m[1]}${params}`
}
