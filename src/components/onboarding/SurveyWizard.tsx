// First-run setup wizard. Six questions tailor the visible tabs and a few
// preferences (leaderboard on/off, friend visibility, condition toggle).
// Answers are written to the same localStorage keys the rest of the app
// reads, so no special integration is needed downstream.
import { useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import type { CurView } from '../../store/AppStore'
import { setLeaderboardOn } from '../../lib/leaderboardPref'
import { setVisibility } from '../../lib/friendVisibility'

interface Props {
  onDone: () => void
}

type Style = 'time' | 'goal' | 'drop' | 'all'
type Habit = 'few' | 'many' | 'none'
type Calendar = 'both' | 'month' | 'week' | 'none'
type YesNo = 'yes' | 'no'

interface Answers {
  style?: Style
  calendar?: Calendar
  habit?: Habit
  friend?: YesNo
  rank?: YesNo
  med?: YesNo
  cycle?: YesNo
}

const TOTAL = 7

export function SurveyWizard({ onDone }: Props) {
  const setCurView = useAppStore((s) => s.setCurView)
  const [step, setStep] = useState(0)  // 0=intro, 1..6=questions, 7=result
  const [a, setA] = useState<Answers>({})

  function next() { setStep((s) => Math.min(s + 1, TOTAL + 1)) }
  function prev() { setStep((s) => Math.max(s - 1, 0)) }

  function pick<K extends keyof Answers>(key: K, value: Answers[K]) {
    setA((prev) => ({ ...prev, [key]: value }))
    setTimeout(next, 150)  // tiny delay so the highlight is visible
  }

  function applyAndFinish() {
    // Compute hidden tabs from answers
    const hidden = new Set<CurView>(['tl', 'week', 'cal', 'habit', 'goal', 'drop', 'stats', 'friends'])
    // Style → primary tabs
    if (a.style === 'time' || a.style === 'all') hidden.delete('tl')
    if (a.style === 'goal' || a.style === 'all') hidden.delete('goal')
    if (a.style === 'drop' || a.style === 'all') hidden.delete('drop')
    // Calendar (week / monthly)
    if (a.calendar === 'both' || a.calendar === 'week') hidden.delete('week')
    if (a.calendar === 'both' || a.calendar === 'month') hidden.delete('cal')
    // Habit
    if (a.habit !== 'none') hidden.delete('habit')
    // Friend
    if (a.friend === 'yes') hidden.delete('friends')
    // Med (medication or cycle either one keeps the tab on)
    if (a.med === 'yes' || a.cycle === 'yes') hidden.delete('stats')
    // Always have at least the timeline tab visible
    if (hidden.size >= 8) hidden.delete('tl')

    localStorage.setItem('ff_hidden_tabs', JSON.stringify(Array.from(hidden)))
    window.dispatchEvent(new CustomEvent('ff-tabs-changed'))

    // Leaderboard preference
    setLeaderboardOn(a.rank === 'yes')

    // Friend visibility — if user picked "no" for friends, set everything to false
    // so the doc reflects "private". Otherwise leave defaults (all true).
    if (a.friend === 'no') {
      setVisibility({ timeline: false, habits: false, sprint: false, xp: false, drop: false })
    }

    // Pick a sensible starting tab
    const order: CurView[] = a.style === 'goal' ? ['goal']
      : a.style === 'drop' ? ['drop']
      : a.style === 'time' ? ['tl']
      : ['tl']
    const firstVisible = order.find((t) => !hidden.has(t)) || 'tl'
    setCurView(firstVisible)

    localStorage.setItem('ff_survey_done', '1')
    onDone()
  }

  // Visible tabs preview for the result screen
  const visibleSummary: string[] = []
  if (a.style === 'time' || a.style === 'all') visibleSummary.push('🕐 일간')
  if (a.calendar === 'both' || a.calendar === 'week') visibleSummary.push('📆 주간')
  if (a.calendar === 'both' || a.calendar === 'month') visibleSummary.push('📅 월간')
  if (a.habit !== 'none') visibleSummary.push('🌱 습관')
  if (a.style === 'goal' || a.style === 'all') visibleSummary.push('🎯 목표')
  if (a.style === 'drop' || a.style === 'all') visibleSummary.push('📦 덤프')
  if (a.med === 'yes' || a.cycle === 'yes') visibleSummary.push('💊 메디')
  if (a.friend === 'yes') visibleSummary.push('👥 친구')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9050, background: 'linear-gradient(135deg, var(--pl), #fff)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Progress + skip */}
        {step > 0 && step <= TOTAL && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{step}/{TOTAL}</span>
            <button onClick={() => { localStorage.setItem('ff_survey_done', '1'); onDone() }} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>건너뛰기</button>
          </div>
        )}

        {step === 0 && <IntroCard onStart={next} onSkip={() => { localStorage.setItem('ff_survey_done', '1'); onDone() }} />}

        {step === 1 && <Q1 value={a.style} onPick={(v) => pick('style', v)} />}
        {step === 2 && <Q2 value={a.calendar} onPick={(v) => pick('calendar', v)} />}
        {step === 3 && <Q3 value={a.habit} onPick={(v) => pick('habit', v)} />}
        {step === 4 && <Q4 value={a.friend} onPick={(v) => pick('friend', v)} />}
        {step === 5 && <Q5 value={a.rank} onPick={(v) => pick('rank', v)} />}
        {step === 6 && <Q6 value={a.med} onPick={(v) => pick('med', v)} />}
        {step === 7 && <Q7 value={a.cycle} onPick={(v) => pick('cycle', v)} />}

        {step === TOTAL + 1 && (
          <ResultCard summary={visibleSummary} onStart={applyAndFinish} answers={a} />
        )}

        {/* Back button */}
        {step > 0 && step <= TOTAL && (
          <button onClick={prev} style={{ marginTop: 'auto', padding: 10, background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start' }}>← 이전</button>
        )}
      </div>
    </div>
  )
}

// ── Cards ────────────────────────────────────────────────────────────

function IntroCard({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 38 }}>🧠</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--pd)' }}>너에게 맞는 Focus Flow</div>
      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
        ADHD는 사람마다 너무 달라.<br />
        어떤 사람은 시간 단위로 짜야 살고<br />
        어떤 사람은 그게 더 막막해.
      </div>
      <div style={{ background: '#fff', padding: 16, borderRadius: 14, fontSize: 12, color: '#666', lineHeight: 1.7 }}>
        ✓ 6개 질문으로 너 상태 파악<br />
        ✓ 탭 / 기능 자동 셋업<br />
        ✓ 끈 기능도 언제든 설정에서 켤 수 있어<br />
        <span style={{ color: 'var(--pink)', fontWeight: 700 }}>⏱ 약 60초</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <button onClick={onStart} style={{ padding: 14, borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px color-mix(in srgb, var(--pink) 40%, transparent)' }}>시작하기 →</button>
        <button onClick={onSkip} style={{ padding: 10, background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>건너뛰고 전체 기능 다 보기</button>
      </div>
    </div>
  )
}

function QShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--pd)', lineHeight: 1.4, marginBottom: sub ? 6 : 18 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#888', marginBottom: 18, lineHeight: 1.6 }}>{sub}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

interface OptProps { active?: boolean; onClick: () => void; emoji: string; label: string; sub?: string; tag?: string }
function OptCard({ active, onClick, emoji, label, sub, tag }: OptProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 14px',
        border: '2px solid ' + (active ? 'var(--pink)' : '#eee'),
        background: active ? 'var(--pl)' : '#fff',
        borderRadius: 14,
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        transition: 'all .15s',
      }}
    >
      <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd)' }}>{label}</div>
          {tag && <span style={{ fontSize: 9, color: 'var(--pink)', background: '#FFF6F8', padding: '2px 6px', borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>{tag}</span>}
        </div>
        {sub && <div style={{ fontSize: 11, color: '#777', marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{sub}</div>}
      </div>
    </button>
  )
}

function Q1({ value, onPick }: { value?: Style; onPick: (v: Style) => void }) {
  return (
    <QShell title="하루를 어떻게 보내?" sub="가장 가까운 거 골라. 정답 없어 — 지금 너의 스타일대로.">
      <OptCard active={value === 'time'} onClick={() => onPick('time')} emoji="🕐" label="시간표대로 가는 게 안정감 있어"
        sub={'"9시 회의 → 10시 산책 → 11시 공부"\n매일 짠 시간대로 따라갈 수 있어\n→ 일간 탭 (시간 블록 시각화)'} />
      <OptCard active={value === 'goal'} onClick={() => onPick('goal')} emoji="📋" label="결과만 정해두는 게 편해" tag="ADHD 추천"
        sub={'"이번주 책 1권, 운동 3번"\n언제 할지는 그날 컨디션 따라\n→ 1주 챌린지 (목표 탭)'} />
      <OptCard active={value === 'drop'} onClick={() => onPick('drop')} emoji="💧" label="즉흥파, 하고 싶은 거부터"
        sub={'"오늘 뭐할지 5분 전에 정함"\n머릿속 떠도는 거 일단 적어두고 손가는 거부터\n→ 덤프 탭 (브레인덤프)'} />
      <OptCard active={value === 'all'} onClick={() => onPick('all')} emoji="🎲" label="모르겠어 / 그날그날 다름"
        sub={'직접 써보고 너 스타일 찾을게\n→ 일간 + 목표 + 덤프 다 켜줌'} />
    </QShell>
  )
}

function Q2({ value, onPick }: { value?: Calendar; onPick: (v: Calendar) => void }) {
  return (
    <QShell title="주간 / 월간 캘린더 보고 싶어?" sub="얼마나 멀리 보고 계획하는 편인지에 따라 골라.">
      <OptCard active={value === 'both'} onClick={() => onPick('both')} emoji="📆" label="둘 다 — 주별 + 월별"
        sub={'주간: 7일 한눈에 (이번주 진행)\n월간: 한 달 색깔로 카테고리 분포\n→ 주간 + 월간 탭 둘 다 ON'} />
      <OptCard active={value === 'month'} onClick={() => onPick('month')} emoji="📅" label="월간만"
        sub={'한 달 단위로만 봐도 충분해\n→ 월간 탭 ON / 주간 탭 OFF'} />
      <OptCard active={value === 'week'} onClick={() => onPick('week')} emoji="📈" label="주간만"
        sub={'이번주 단위로 짜는 게 편해\n→ 주간 탭 ON / 월간 탭 OFF'} />
      <OptCard active={value === 'none'} onClick={() => onPick('none')} emoji="✋" label="둘 다 안 봐"
        sub={'일간만으로 충분 / 캘린더 부담\n→ 주간 + 월간 탭 둘 다 OFF'} />
    </QShell>
  )
}

function Q3({ value, onPick }: { value?: Habit; onPick: (v: Habit) => void }) {
  return (
    <QShell title="매일 같은 시간에 반복하는 거 있어?" sub="예: 아침 약, 스트레칭, 일기, 비타민">
      <OptCard active={value === 'few'} onClick={() => onPick('few')} emoji="🌿" label="1~3개 정도"
        sub={'간단히 추적하고 🔥 스트릭만 보고 싶어\n→ 습관 탭 ON (가벼운 모드)'} />
      <OptCard active={value === 'many'} onClick={() => onPick('many')} emoji="🌳" label="4개 이상"
        sub={'꼼꼼하게 다 챙기고 싶어\n→ 습관 탭 ON (풀 모드)'} />
      <OptCard active={value === 'none'} onClick={() => onPick('none')} emoji="✋" label="아예 없어"
        sub={'매번 다른 게 좋아 / 매일 반복은 부담\n→ 습관 탭 OFF'} />
    </QShell>
  )
}

function Q4({ value, onPick }: { value?: YesNo; onPick: (v: YesNo) => void }) {
  return (
    <QShell title="친구 기능 쓸래?" sub="공유 코드로 친구 추가하고 서로 페이지 보는 기능">
      <OptCard active={value === 'yes'} onClick={() => onPick('yes')} emoji="👯" label="응 — 같이 응원하고 싶어"
        sub={'친구한테 보일 수 있는 것 (각각 토글로 ON/OFF):\n• 1주 챌린지 진행률 / 레벨·XP\n• 오늘 타임라인 / 습관 + 스트릭\n• 덤프 / 컨디션 / 방명록\n• 프사 + 닉네임 + 한줄 소개\n→ 친구 탭 ON'} />
      <OptCard active={value === 'no'} onClick={() => onPick('no')} emoji="🦦" label="혼자가 편해"
        sub={'언제든 설정에서 다시 켤 수 있어\n→ 친구 탭 OFF, 모든 항목 비공개'} />
    </QShell>
  )
}

function Q5({ value, onPick }: { value?: YesNo; onPick: (v: YesNo) => void }) {
  return (
    <QShell title="순위 / 랭킹 보고 싶어?" sub="다른 ADHD인이랑 이번달 XP 비교하는 거">
      <OptCard active={value === 'yes'} onClick={() => onPick('yes')} emoji="🏆" label="응 — 명예의 전당 보고 싶어"
        sub={'• 이번달 Top 10 표시\n• 내 랭크 + 상위 N% 보여줌\n• 5월 1위에게 스타벅스 쿠폰 ☕\n→ 순위 보기 ON'} />
      <OptCard active={value === 'no'} onClick={() => onPick('no')} emoji="🙈" label="아니 — 비교 스트레스"
        sub={'레벨 / XP는 그대로 유지 (혼자 게임)\n→ 순위 OFF'} />
    </QShell>
  )
}

function Q6({ value, onPick }: { value?: YesNo; onPick: (v: YesNo) => void }) {
  return (
    <QShell title="매일 챙겨야 할 약 있어?" sub="정신과 약 / 한약 / 영양제 등 뭐든">
      <OptCard active={value === 'yes'} onClick={() => onPick('yes')} emoji="💊" label="응 — 약 챙겨"
        sub={'메디 탭 기능:\n✓ 매일 복용 체크 (까먹음 방지)\n✓ 효과 지속 시간 시각화\n✓ 컨디션이랑 같이 추적해서 약 효과 분석\n✓ 부작용 / 주의사항 카드 내장'} />
      <OptCard active={value === 'no'} onClick={() => onPick('no')} emoji="🚫" label="아니 — 안 먹어 / 가끔만"
        sub={'언제든 설정에서 켤 수 있어'} />
    </QShell>
  )
}

function Q7({ value, onPick }: { value?: YesNo; onPick: (v: YesNo) => void }) {
  return (
    <QShell title="생리주기 트래킹할래?" sub="예측·기록용. 메디 탭에 같이 들어가.">
      <OptCard active={value === 'yes'} onClick={() => onPick('yes')} emoji="🌙" label="응 — 주기 예측 받고 싶어"
        sub={'✓ 시작/종료일 등록 → 다음 주기 자동 예측\n✓ 생리 / PMS / 평소 단계 표시\n✓ 마감까지 D-N 카운트\n💡 호르몬-주의력 패턴 분석 가능'} />
      <OptCard active={value === 'no'} onClick={() => onPick('no')} emoji="🚫" label="아니 — 필요 없어"
        sub={'언제든 설정에서 켤 수 있어'} />
    </QShell>
  )
}

function ResultCard({ summary, onStart, answers }: { summary: string[]; onStart: () => void; answers: Answers }) {
  const recommendation =
    answers.style === 'goal' ? '"이번주 챌린지 1개"부터 가볍게 시작해봐.\n완벽 노력 ❌ → 1번이라도 +1 누르는 거 ⭕'
    : answers.style === 'time' ? '오늘의 큰 일 1개만 시간 블록으로 등록해봐.\n작게 시작해야 안 부서져.'
    : answers.style === 'drop' ? '머릿속 떠도는 거 5개만 덤프에 던져봐.\n다 끝낼 필요 없어 — 외부에 적는 게 핵심.'
    : '일단 일간 탭에서 오늘 1개 등록해보자.\n뭐든 너 페이스로 ㄱㄱ.'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      <div style={{ fontSize: 30, textAlign: 'center' }}>🎯</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--pd)', textAlign: 'center' }}>너만의 셋업 완료</div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8 }}>너에게 켜진 탭</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {summary.map((s) => (
            <div key={s} style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 99 }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6 }}>추천 시작</div>
        <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{recommendation}</div>
      </div>
      <div style={{ fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
        💡 끈 기능은 설정 ⚙️ 탭 관리에서 언제든 켤 수 있어
      </div>
      <button onClick={onStart} style={{ padding: 14, borderRadius: 12, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px color-mix(in srgb, var(--pink) 40%, transparent)' }}>
        시작하기 🚀
      </button>
    </div>
  )
}
