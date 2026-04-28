import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/AppStore'
import type { CurView } from '../../store/AppStore'

interface OnboardingStep {
  title: string
  desc: string
  sel?: string
  tab?: CurView
}

const STEPS: OnboardingStep[] = [
  {
    title: '👋 Welcome to Focus Flow!',
    desc: 'ADHD 뇌과학 기반으로 설계된 집중 플래너야.\n각 기능이 왜 이렇게 만들어졌는지, 직접 체험하면서 알려줄게!',
    sel: '.header',
  },
  {
    title: '⏰ 일간 타임라인',
    desc: '하루를 시간 블록으로 시각화해서 관리해.\n\n📚 Time Blocking (Cal Newport)\nADHD는 시간 감각이 약한 "Time Blindness"가 있어서, 눈에 보이는 시간 구조가 필수!\n\n💡 블록을 드래그해서 시간을 옮길 수도 있어!',
    sel: '.tl-wrap',
    tab: 'tl',
  },
  {
    title: '➕ 빠른 입력',
    desc: '오른쪽 하단 + 버튼으로 블록을 추가해!\n\n📚 인지 부하 감소\n입력 단계가 적을수록 ADHD가 행동을 시작하기 쉬워져.\n\n💡 카테고리도 설정할 수 있어!',
    sel: '.fab',
    tab: 'tl',
  },
  {
    title: '📆 날짜 이동',
    desc: '날짜 탭에서 원하는 날짜를 선택하거나\n◀▶ 버튼으로 이전/다음 날짜로 이동할 수 있어!',
    sel: '.date-tabs',
    tab: 'tl',
  },
  {
    title: '🔄 탭 전환',
    desc: '여기서 다양한 뷰를 전환할 수 있어.\n\n💡 ⚙ 설정에서 탭 관리로 안 쓰는 탭을 숨길 수 있어!\n\n📚 개인화 (Personalization)\n자기한테 맞는 환경을 만들면 도구 사용 지속률이 올라가!',
    sel: '.view-tabs',
  },
  {
    title: '📅 월간 캘린더',
    desc: '한 달을 한눈에! 카테고리별 필터도 가능해.\n\n🏃‍♀️ 상단 프로그레스바: 올해의 몇%를 왔는지 보여줘!\n\n📚 Goal Gradient Effect\n목표에 가까워질수록 동기가 높아지는 효과!',
    sel: '.cal-wrap',
    tab: 'cal',
  },
  {
    title: '🌱 66일 습관 챌린지',
    desc: '과학적으로 검증된 66일 습관 형성 시스템!\n\n📚 Habit Formation (Lally et al., 2010)\n평균 66일이면 행동이 자동화돼.\n\n🌳 습관을 달성할 때마다 나무에 열매가 하나씩 열려!\n매일 체크하면 꽃이 자라나는 걸 보면서 동기부여!',
    sel: '.habit-wrap',
    tab: 'habit',
  },
  {
    title: '🎯 목표 트리 (역산 계획법)',
    desc: '연간 목표를 분기→할 일로 쪼개는 트리 구조!\n\n예시:\n🎯 유튜브 구독자 1만\n├ Q1: 채널 세팅 + 영상 10개\n├ Q2: 구독자 2000명 (쇼츠 주3회)\n└ Q4: 1만 돌파!\n\n📚 역산 계획법 (Park et al., 2017)\n끝에서 거꾸로 쪼개면 "지금 뭐 해야 하는지"가 명확해져.',
    sel: '.tl-wrap',
    tab: 'goal',
  },
  {
    title: '🧠 드롭 (언젠가 할 것)',
    desc: '지금 당장은 아니지만 머릿속을 떠도는 것들을 여기에!\n\n📚 Cognitive Offloading (Risko & Gilbert, 2016)\n머릿속 할 일을 외부에 꺼내놓으면 작업기억 부담이 줄어들어.',
    sel: '.drop-wrap',
    tab: 'drop',
  },
  {
    title: '⚙️ 설정',
    desc: '헤더의 ⚙ 버튼을 터치하면 설정이 열려!\n\n🎨 테마 — 5가지 컬러 테마\n👥 친구 — 공유 코드로 친구 추가\n⏰ 타임라인 범위 — 시작/끝 시간 조절\n📑 탭 관리 — 안 쓰는 탭 숨기기\n🌙 생리주기 — PMS 예측\n🔮 생일 — 사주 일간 운세',
    sel: '.header',
    tab: 'tl',
  },
  {
    title: '🎉 준비 완료!',
    desc: 'Focus Flow의 모든 기능은 ADHD 연구에 기반해서 설계됐어.\n\n핵심 원칙:\n🧠 시각화 — 보이지 않으면 존재하지 않아\n✂️ 쪼개기 — 작을수록 시작하기 쉬워\n🎯 제한 — 적을수록 집중하기 좋아\n💪 피드백 — 작은 성취도 눈에 보이게\n\n지금 바로 시작해봐!',
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

  const step = STEPS[idx]
  const isLast = idx === STEPS.length - 1

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
            {idx + 1}/{STEPS.length}
          </span>
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 14, maxHeight: '35vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
          {step.desc}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {STEPS.map((_, i) => (
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
