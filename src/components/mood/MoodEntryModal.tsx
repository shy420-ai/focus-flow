// CBT thought-record entry modal. All fields optional except situation
// (so you can save a quick capture without finishing the full record).
import { useState, useEffect } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import { useMoodStore } from '../../store/MoodStore'
import { showMiniToast } from '../../lib/miniToast'
import { todayStr, pad } from '../../lib/date'
import type { MoodEntry } from '../../types/mood'

const SOFT_LIMIT_SEC = 300  // 5 minutes — gentle nudge, not enforced

const EMOTION_GROUPS: Array<{ label: string; chips: string[] }> = [
  { label: '🌧 부정', chips: ['짜증', '분노', '억울함', '서운함', '불안', '걱정', '두려움', '긴장', '슬픔', '외로움', '공허함', '우울', '부끄러움', '죄책감', '자기혐오', '실망', '좌절', '답답함', '무기력'] },
  { label: '🌤 중립', chips: ['멍함', '지침', '피곤함', '혼란', '복잡함'] },
  { label: '☀️ 긍정', chips: ['뿌듯', '평온', '감사', '설렘', '안도', '홀가분', '기대', '기쁨', '따뜻함'] },
]

const DISTORTIONS: Array<{ id: string; label: string; hint: string }> = [
  { id: 'allornone', label: '흑백사고', hint: '다 망함 / 완벽 X면 실패' },
  { id: 'mindread', label: '마인드리딩', hint: '남이 비웃을 거야' },
  { id: 'catastrophize', label: '파국화', hint: '커리어 끝남 / 인생 망함' },
  { id: 'selfblame', label: '자기비난', hint: '다 내 탓' },
  { id: 'overgeneralize', label: '과잉일반화', hint: '나는 항상 이래' },
  { id: 'emoreason', label: '감정적 추론', hint: '이렇게 느끼니까 사실일 거야' },
  { id: 'should', label: '당위적 사고', hint: '꼭 ~해야만 해 / ~여야 돼' },
  { id: 'labeling', label: '라벨링', hint: '나는 실패자 / 멍청이' },
]

const REFRAME_TEMPLATES: Array<{ label: string; text: string }> = [
  { label: '사실 vs 해석', text: '내가 받아들인 건 [____]였지만, 사실 일어난 건 [____]일 수도 있어' },
  { label: '친구라면', text: '친구가 같은 일을 겪었다면 나는 "____" 라고 말해줬을 것 같아' },
  { label: '부분 인정', text: '확실히 [____]은 있었어. 근데 [____]도 있었어' },
  { label: '시간 거리', text: '1년 후에 이걸 떠올리면 [____] 정도일 거야' },
  { label: '환경 원인', text: '내가 부족해서가 아니라, [수면/식사/스트레스]이 영향 줬어' },
]

const ACTION_TEMPLATES: Array<{ label: string; text: string }> = [
  { label: '반응 늦추기', text: '같은 상황 또 오면, [____]초 멈추고 다시 본다' },
  { label: '환경 바꾸기', text: '[____] 트리거 막으려면 [____] 한다' },
  { label: '셀프케어', text: '오늘 [수면/식사/휴식] 챙기기' },
  { label: '소통', text: '[누구]에게 [____]를 말해본다' },
  { label: '도움 요청', text: '혼자 안고 가지 말고 [누구]한테 한 줄 보내기' },
  { label: '몸 움직이기', text: '5분만 [산책/스트레칭/물 마시기]' },
  { label: '거리 두기', text: '오늘은 [SNS/그 사람/그 채팅] 잠깐 끄기' },
  { label: '자기 위로', text: '나한테 "[____]" 라고 말해주기' },
]

interface Props {
  entry?: MoodEntry
  onClose: () => void
}

export function MoodEntryModal({ entry, onClose }: Props) {
  const addEntry = useMoodStore((s) => s.addEntry)
  const editEntry = useMoodStore((s) => s.editEntry)
  useBackClose(true, onClose)

  const [situation, setSituation] = useState(entry?.situation ?? '')
  const [autoThought, setAutoThought] = useState(entry?.autoThought ?? '')
  const [emotions, setEmotions] = useState<string[]>(entry?.emotions ?? [])
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 5)
  const [bodyFelt, setBodyFelt] = useState(entry?.bodyFelt ?? '')
  const [distortions, setDistortions] = useState<string[]>(entry?.distortions ?? [])
  const [reframe, setReframe] = useState(entry?.reframe ?? '')
  const [nextAction, setNextAction] = useState(entry?.nextAction ?? '')
  const [distressBefore] = useState<number | undefined>(entry?.distressBefore ?? entry?.intensity ?? undefined)
  const [distressAfter, setDistressAfter] = useState<number | undefined>(entry?.distressAfter)
  const [youtubeUrl, setYoutubeUrl] = useState(
    entry?.youtubeUrl ?? localStorage.getItem('ff_mood_default_bgm') ?? ''
  )
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

  function toggleChip(arr: string[], v: string, setter: (next: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  function save() {
    if (!situation.trim() && emotions.length === 0) {
      onClose()
      return
    }
    const now = new Date()
    const payload = {
      date: entry?.date ?? todayStr(),
      time: entry?.time ?? `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      situation: situation.trim() || undefined,
      autoThought: autoThought.trim() || undefined,
      emotions: emotions.length ? emotions : undefined,
      intensity,
      bodyFelt: bodyFelt.trim() || undefined,
      distortions: distortions.length ? distortions : undefined,
      reframe: reframe.trim() || undefined,
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
          {/* BGM at top — autoplays so the music starts as the modal opens */}
          {embedSrc && (
            <iframe
              src={embedSrc}
              title="BGM"
              style={{ width: '100%', height: 80, border: 'none', borderRadius: 10 }}
              allow="autoplay; encrypted-media"
            />
          )}

          {/* 1. 상황 */}
          <Section title="1. 상황" hint="사실 한 줄. 평가·해석 X.">
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="예: 오후 4시 회의에서 발표 더듬음"
              rows={2}
              style={textareaStyle}
            />
          </Section>

          {/* 2. 자동 생각 */}
          <Section title="2. 자동 생각" hint="그 순간 머리에 든 한 줄.">
            <textarea
              value={autoThought}
              onChange={(e) => setAutoThought(e.target.value)}
              placeholder="예: 또 망했다 / 사람들이 비웃었을 듯"
              rows={2}
              style={textareaStyle}
            />
          </Section>

          {/* 3. 감정 + 강도 */}
          <Section title="3. 감정" hint="구체적인 단어로 — 이름 붙이기만 해도 진정돼.">
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

          {/* 4. 신체 감각 */}
          <Section title="4. 신체 감각" hint="(선택) 감정이 몸 어디에 느껴졌는지.">
            <textarea
              value={bodyFelt}
              onChange={(e) => setBodyFelt(e.target.value)}
              placeholder="예: 가슴 답답, 손에 땀, 얼굴 화끈"
              rows={2}
              style={textareaStyle}
            />
          </Section>

          {/* 5. 사고 함정 */}
          <Section title="5. 사고 함정 체크" hint="(선택) 자동 생각이 어느 함정에 걸렸는지. 예시 보고 골라.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {DISTORTIONS.map((d) => {
                const on = distortions.includes(d.id)
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleChip(distortions, d.id, setDistortions)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1.5px solid ' + (on ? 'var(--pink)' : '#eee'),
                      background: on ? 'var(--pl)' : '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--pd)' : '#444' }}>{d.label}</span>
                    <span style={{ fontSize: 9, color: '#999', lineHeight: 1.4 }}>"{d.hint}"</span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 6. 다른 시각 (재해석) */}
          <Section title="6. 다른 시각" hint="(선택) 카드 탭하면 템플릿이 자동으로 들어가. 빈칸만 채워.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {REFRAME_TEMPLATES.map((t) => (
                <TemplateCard key={t.label} label={t.label} preview={t.text} onClick={() => setReframe(t.text)} />
              ))}
              <button
                onClick={() => setReframe('지금은 답이 안 보임. 시간 두고 보자.')}
                style={passCardStyle}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>지금은 못 쓰겠어</span>
                <span style={{ fontSize: 9, color: '#bbb', lineHeight: 1.4 }}>"답 안 보임. 시간 두고 보자."</span>
              </button>
            </div>
            <textarea
              value={reframe}
              onChange={(e) => setReframe(e.target.value)}
              placeholder="템플릿 탭하거나 직접 써도 OK"
              rows={3}
              style={textareaStyle}
            />
          </Section>

          {/* 7. 다음 선택 */}
          <Section title="7. 다음 선택" hint="감정은 자동, 반응은 선택 — 작게 1개만.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {ACTION_TEMPLATES.map((t) => (
                <TemplateCard key={t.label} label={t.label} preview={t.text} onClick={() => setNextAction(t.text)} />
              ))}
              <button
                onClick={() => setNextAction('오늘은 패스')}
                style={passCardStyle}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>오늘은 패스</span>
                <span style={{ fontSize: 9, color: '#bbb', lineHeight: 1.4 }}>비워두고 넘어가기</span>
              </button>
            </div>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="예: 발표 전날 일찍 자기"
              rows={2}
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

          {/* BGM URL (already playing at top — this is just the input) */}
          <Section title="🎵 BGM 변경" hint="(선택) 다른 곡으로 바꾸려면 여기에 링크.">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </Section>

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

function TemplateCard({ label, preview, onClick }: { label: string; preview: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        border: '1.5px solid #eee',
        background: '#fafafa',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>{label}</span>
      <span style={{ fontSize: 9, color: '#888', lineHeight: 1.45 }}>{preview}</span>
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
  const params = autoplay ? '?autoplay=1' : ''
  return `https://www.youtube.com/embed/${m[1]}${params}`
}
