import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '../../store/AppStore'
import type { CurView } from '../../store/AppStore'
import { isLeaderboardOn } from '../../lib/leaderboardPref'
import { SurveyWizard } from './SurveyWizard'

interface OnboardingStep {
  title: string
  desc: string
  sel?: string
  tab?: CurView
  // Step is shown only if the predicate passes; null/missing = always shown.
  requires?: 'tab' | 'leaderboard' | 'friends-tab' | 'med-tab'
}

function loadHiddenTabs(): Set<CurView> {
  try {
    const arr = JSON.parse(localStorage.getItem('ff_hidden_tabs') || '[]') as CurView[]
    return new Set(arr)
  } catch { return new Set() }
}

const STEPS: OnboardingStep[] = [
  {
    title: '👋 Focus Flow에 온 걸 환영!',
    desc: 'ADHD 뇌에 맞춰 설계한 플래너야.\n시작하기 전에 핵심 기능 같이 둘러보자 — 1분이면 끝나.\n\n📚 ADHD 뇌의 핵심 결핍\n시간 감각, 작업기억, 도파민 분비 — 이걸 외부 도구로 보완하는 게 목표야.',
    sel: '.header',
  },
  {
    title: '⏰ 일간 타임라인',
    desc: '하루를 시간 블록으로 눈에 보이게 만드는 곳.\n\n📚 Time Blocking (Cal Newport)\nADHD가 약한 "Time Blindness"는 시간 구조가 보이면 즉각 완화돼.\n\n💡 블록을 드래그하면 시간 이동, 우상단 ↻로 새로고침.',
    sel: '.tl-wrap',
    tab: 'tl',
    requires: 'tab',
  },
  {
    title: '➕ 빠른 입력',
    desc: '오른쪽 아래 토마토 🍅 (포모도로) 옆 + 버튼으로 블록 추가.\n\n📚 인지 부하 감소\n입력 단계가 적을수록 ADHD가 시작하기 쉬워. 한 탭으로 끝내야 해.',
    sel: '.fab',
    tab: 'tl',
    requires: 'tab',
  },
  {
    title: '📆 날짜 이동',
    desc: '◀▶ 또는 날짜를 직접 누르면 다른 날로 이동.\n공휴일은 빨간색으로 표시돼.\n\n💡 한국 공휴일 자동 반영 (대체공휴일 포함)',
    sel: '.date-tabs',
    tab: 'tl',
    requires: 'tab',
  },
  {
    title: '🔄 탭 바 — 너만의 구성',
    desc: '아래 탭들 길게 눌러 드래그하면 순서 바꿀 수 있어.\n설정 ⚙️에서 안 쓰는 탭은 숨기기 가능 (일간 포함).\n\n📚 개인화 (Personalization)\n자기 환경을 만든 사용자가 도구를 더 오래 써.',
    sel: '.view-tabs',
  },
  {
    title: '📅 월간 캘린더',
    desc: '한 달을 한눈에 — 어느 날 무슨 카테고리 일했는지 색으로 보여.\n맨 위 막대는 올해 진행률.\n\n📚 Goal Gradient Effect\n목표에 가까워질수록 동기 올라가는 심리 효과.',
    sel: '.cal-wrap',
    tab: 'cal',
    requires: 'tab',
  },
  {
    title: '🌱 습관 + 🔥 스트릭',
    desc: '매일 체크할 습관 등록 → 연속일 (스트릭) 카운트.\n7일 넘기면 빨갛게 강조돼서 끊기 아까워짐.\n\n📚 Habit Formation (Lally et al., 2010)\n평균 66일이면 행동이 자동화. 스트릭은 그 가속기.',
    sel: '.habit-wrap',
    tab: 'habit',
    requires: 'tab',
  },
  {
    title: '🎯 1주 챌린지 (목표 탭)',
    desc: '한 번에 최대 3개 목표를 7일 안에 달성.\n예: "운동 10회", "책 3권", "인스타 7개" — 양/단위/현재로 추적.\n\n+1 누를 때마다 +5 XP, 목표 채우면 +50 XP 보너스.\n달성 누르면 일간 탭이랑 똑같은 축하 팝업 떠 (랜덤 200+ 메시지!) 🎉\n\n📚 Sprint Goals (Doerr, OKR)\n짧은 사이클이 ADHD에 맞아. 1년은 멀고 1주는 손에 잡혀.',
    sel: '.tl-wrap',
    tab: 'goal',
    requires: 'tab',
  },
  {
    title: '🎮 레벨 / XP 시스템',
    desc: '모든 행동에 XP가 쌓이고 레벨업해.\n• 챌린지 +1: 5 XP\n• 챌린지 목표 달성: 50 XP 보너스\n• 1주 챌린지 마무리: 100 XP\n\n📚 Variable Reward (Skinner)\n예측 불가능한 보상이 도파민 가장 강하게 분비시켜. ADHD 뇌엔 진짜로 효과 있어.',
    sel: '.tl-wrap',
    tab: 'goal',
    requires: 'tab',
  },
  {
    title: '🏆 순위 (월간 리더보드)',
    desc: '같은 앱 쓰는 다른 ADHD인들이랑 이번달 XP 경쟁.\n명예의 전당 Top 10에 너 닉넴 + 아바타 떠.\n\n💡 5월 1위에게 스타벅스 쿠폰 쏨 ☕\n끝까지 가보자고 🔥\n\n📚 Social Comparison\n친구 보면 도파민이 흥분돼서 행동 시작 쉬워짐.',
    sel: '.tl-wrap',
    tab: 'goal',
    requires: 'leaderboard',
  },
  {
    title: '👥 친구 탭',
    desc: '코드로 친구 추가 → 위쪽 동그란 아바타 줄 → 탭마다 친구 화면 확인.\n친구의 챌린지/XP/습관/덤프/타임라인 다 보여 (공개 설정에 따라).\n\n💡 친구 아바타 길게 누르면 삭제\n💡 "나" 탭에서 내 화면을 친구 시점으로 미리보기\n\n📚 Body Doubling\n친구가 보이면 ADHD 뇌가 외로움 덜 느끼고 시작 쉬워짐.',
    sel: '.view-tabs',
    tab: 'friends',
    requires: 'friends-tab',
  },
  {
    title: '💌 방명록 (받은 응원)',
    desc: '친구가 너 페이지에서 응원 한 마디 남기면 여기 떠.\n안 읽은 글 있으면 ⚙️ 아이콘에 빨간 숫자 뱃지 붙음.\n\n💡 친구 페이지 들어가서 너도 응원 남기기 가능',
    sel: '.tl-wrap',
    tab: 'friends',
    requires: 'friends-tab',
  },
  {
    title: '📦 덤프 (언젠가 할 것)',
    desc: '지금 당장 안 할 거지만 머릿속에서 떠다니는 것들 — 여기 던져둬.\n\n📚 Cognitive Offloading (Risko & Gilbert, 2016)\n머릿속 → 외부로 옮기면 작업기억 부담 즉시 줄어. ADHD엔 약물 다음으로 효과 큰 도구.',
    sel: '.drop-wrap',
    tab: 'drop',
    requires: 'tab',
  },
  {
    title: '💊 메디 (약/생리주기)',
    desc: '약 복용 기록 + 생리주기 트래킹.\n약 빠른 선택에 ADHD 약(콘서타/메디키넷 등) + 항우울/항불안/수면제까지 가나다순 정리됨.\n\n📚 ADHD + 호르몬\n에스트로겐 떨어지면 ADHD 증상 악화. 주기 추적하면 PMS-주의력 패턴 보여.',
    sel: '.tl-wrap',
    tab: 'stats',
    requires: 'med-tab',
  },
  {
    title: '⚙️ 설정창에서 너 꾸미기',
    desc: '헤더 ⚙️ 누르면 다 모여있어:\n📷 프사 — 사진 업로드 + 줌/위치 조정\n✏️ 닉네임 + 한줄 소개\n🐰 이모지 아바타 (사진 안 쓸 때)\n👁 친구에게 공개할 항목 5개 토글\n🎨 테마 / 🌙 생리주기 / 📑 탭 관리\n\n💡 닉네임/프사는 순위창과 친구탭에 표시돼',
    sel: '.header',
  },
  {
    title: '🎉 준비 끝!',
    desc: 'ADHD 친화 4원칙 기억해줘:\n\n👁 시각화 — 안 보이면 존재 안 함\n✂️ 쪼개기 — 작을수록 시작하기 쉬워\n🎯 제한 — 적을수록 집중\n💪 피드백 — 작은 성취도 즉시 보상\n\n중요: 못해도 자책 ❌ — 체크 안 한 날도 정상이야.\n시작은 1주 챌린지 1개부터 가볍게 🚀',
    sel: '.header',
  },
]

interface Props {
  onDone: () => void
}

export function Onboarding({ onDone }: Props) {
  const setCurView = useAppStore((s) => s.setCurView)
  const [idx, setIdx] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  // Phase: 'survey' for first-run users, 'tour' after answers applied.
  // Existing users (ff_survey_done already set) skip straight to the tour.
  const [phase, setPhase] = useState<'survey' | 'tour'>(
    () => localStorage.getItem('ff_survey_done') ? 'tour' : 'survey'
  )

  // Filter steps based on what the user enabled in the survey wizard.
  // Recomputed when phase flips so just-applied answers take effect.
  const steps = useMemo(() => {
    const hidden = loadHiddenTabs()
    const lbOn = isLeaderboardOn()
    return STEPS.filter((s) => {
      if (!s.requires) return true
      if (s.requires === 'tab') return s.tab ? !hidden.has(s.tab) : true
      if (s.requires === 'leaderboard') return lbOn
      if (s.requires === 'friends-tab') return !hidden.has('friends')
      if (s.requires === 'med-tab') return !hidden.has('stats')
      return true
    })
  }, [phase])

  const step = steps[idx]
  const isLast = idx === steps.length - 1

  const applyStep = useCallback((s: OnboardingStep) => {
    if (s.tab) setCurView(s.tab)
    setTimeout(() => {
      if (s.sel) {
        const el = document.querySelector(s.sel)
        if (el) {
          setTargetRect(el.getBoundingClientRect())
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          setTargetRect(null)
        }
      }
    }, s.tab ? 400 : 50)
  }, [setCurView])

  useEffect(() => {
    applyStep(step)
  }, [idx, step, applyStep])

  function next() {
    if (isLast) { done() } else { setIdx((i) => i + 1) }
  }

  function prev() {
    if (idx > 0) setIdx((i) => i - 1)
  }

  function done() {
    localStorage.setItem('ff_onboarded', '1')
    onDone()
  }

  const padding = 8
  const highlight = targetRect ? {
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  } : null

  const tipOnTop = targetRect && targetRect.top > window.innerHeight / 2

  // Phase 1 — survey wizard. When the user finishes (or skips), flip to
  // the tour phase so the highlighted walk-through picks up immediately.
  if (phase === 'survey') {
    return (
      <SurveyWizard onDone={() => setPhase('tour')} />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9001 }}>
      {/* Dim overlay */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
        onClick={next}
      />

      {/* Highlight cutout */}
      {highlight && (
        <div
          style={{
            position: 'absolute',
            left: highlight.left,
            top: highlight.top,
            width: highlight.width,
            height: highlight.height,
            borderRadius: 12,
            boxShadow: '0 0 0 4px var(--pink), 0 0 0 9999px rgba(0,0,0,.45)',
            pointerEvents: 'none',
            zIndex: 9002,
          }}
        />
      )}

      {/* Tip card */}
      <div
        style={{
          position: 'fixed',
          ...(tipOnTop
            ? { bottom: 16 }
            : { top: 8 }),
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 24px)',
          maxWidth: 340,
          background: '#fff',
          borderRadius: 18,
          padding: '18px 20px',
          zIndex: 9003,
          boxShadow: '0 8px 30px rgba(0,0,0,.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pd)' }}>{step.title}</div>
          <span style={{ fontSize: 10, color: '#bbb', background: '#f5f5f5', padding: '2px 8px', borderRadius: 99 }}>
            {idx + 1}/{steps.length}
          </span>
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 14, maxHeight: '35vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
          {step.desc}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === idx ? 'var(--pink)' : i < idx ? 'var(--pm)' : '#e0e0e0',
                transition: 'width .2s',
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          {idx > 0 && (
            <button
              onClick={prev}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--pl)', background: '#fff', color: 'var(--pd)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >←</button>
          )}
          <span onClick={done} style={{ fontSize: 11, color: '#aaa', cursor: 'pointer', padding: '8px 4px' }}>건너뛰기</span>
          <button
            onClick={next}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >{isLast ? '시작! 🚀' : '다음 →'}</button>
        </div>
      </div>
    </div>
  )
}
