import { useState, useEffect } from 'react'
import { AuthGate } from './components/auth/AuthGate'
import { Header } from './components/layout/Header'
import { DateNav } from './components/layout/DateNav'
import { ViewTabs } from './components/layout/ViewTabs'
import { TimelineView } from './components/timeline/TimelineView'
import { CalendarView } from './components/calendar/CalendarView'
import { HabitView } from './components/habit/HabitView'
import { GoalsView } from './components/goal/GoalsView'
import { DropsView } from './components/drop/DropsView'
import { WeekView } from './components/week/WeekView'
import { PomoFab } from './components/pomo/PomoFab'
import { StatsView } from './components/stats/StatsView'
import { FriendsPanel } from './components/friends/FriendsPanel'
import { MoodView } from './components/mood/MoodView'
import { TipsView } from './components/tips/TipsView'
import { SurveyWizard } from './components/onboarding/SurveyWizard'
import { MiniToast } from './components/ui/MiniToast'
import { ConfirmModal } from './components/ui/ConfirmModal'
import { PromptModal } from './components/ui/PromptModal'
import { DoneToast } from './components/timeline/DoneToast'
import { MoodAnnouncement } from './components/ui/MoodAnnouncement'
import { TipsAnnouncement } from './components/ui/TipsAnnouncement'
import { Confetti } from './components/ui/Confetti'
import { useAppStore } from './store/AppStore'
import { addDays, logicalTodayStr } from './lib/date'
import { useAuthState } from './hooks/useAuthState'
import { useFirestoreSync } from './hooks/useFirestoreSync'
import { installFriendCodeDebug } from './lib/debugFriendCodes'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

function loadHiddenTabs(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem('ff_hidden_tabs') || '[]') as string[]
    return new Set(arr)
  } catch { return new Set() }
}

function useTimelineHidden(): boolean {
  const [hidden, setHidden] = useState(() => loadHiddenTabs().has('tl'))
  useEffect(() => {
    function refresh() { setHidden(loadHiddenTabs().has('tl')) }
    window.addEventListener('ff-tabs-changed', refresh)
    return () => window.removeEventListener('ff-tabs-changed', refresh)
  }, [])
  return hidden
}

function AppContent() {
  const curView = useAppStore((s) => s.curView)
  const isDesktop = useIsDesktop()
  // Wizard runs once. ff_survey_done covers new flow; ff_onboarded covers
  // legacy users who finished the old tour and shouldn't see the wizard.
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('ff_survey_done') && !localStorage.getItem('ff_onboarded')
  )
  const [doneToast, setDoneToast] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    window.__ffShowOnboarding = () => setShowOnboarding(true)
    installFriendCodeDebug()
  }, [setShowOnboarding])

  // Roll curDate over to the new logical day (4 AM cutoff). ADHD users
  // often stay up past midnight and still consider it "the same day" —
  // see logicalTodayStr() in lib/date.
  useEffect(() => {
    function check() {
      const target = logicalTodayStr()
      const state = useAppStore.getState()
      const cur = state.curDate
      if (cur === target) return
      const prev = addDays(target, -1)
      if (cur === prev) state.setCurDate(target)
    }
    const id = setInterval(check, 60_000)
    function onVis() { if (!document.hidden) check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  useEffect(() => {
    function onBlockDone(e: Event) {
      setDoneToast((e as CustomEvent<string>).detail)
      setShowConfetti(true)
    }
    window.addEventListener('ff-block-done', onBlockDone)
    return () => window.removeEventListener('ff-block-done', onBlockDone)
  }, [])

  // Right panel view on desktop: show cal when on timeline tab, otherwise the active tab
  const rightView = curView === 'tl' ? 'cal' : curView

  // If the user hid 'tl' (via survey or settings) the desktop split layout
  // would still pin the timeline on the left. Fall through to the mobile-
  // style single-pane layout in that case so 일간 actually disappears.
  const tlHidden = useTimelineHidden()

  // If curView points at a hidden tab (because the user just hid it or the
  // wizard removed it), auto-switch to the first visible tab so they don't
  // get stranded on a view they can't navigate to.
  useEffect(() => {
    const hidden = loadHiddenTabs()
    if (!hidden.has(curView)) return
    const order: Array<typeof curView> = ['tl','week','cal','habit','goal','drop','stats','friends']
    const fallback = order.find((t) => !hidden.has(t))
    if (fallback && fallback !== curView) {
      useAppStore.getState().setCurView(fallback)
    }
  }, [curView])

  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Header />
        <ViewTabs />
      </div>
      {isDesktop && curView !== 'week' && !tlHidden ? (
        <div className="desktop-layout">
          <div className="desktop-left">
            <DateNav />
            <TimelineView />
          </div>
          <div className="desktop-right">
            {rightView === 'cal' && <CalendarView />}
            {rightView === 'habit' && <HabitView />}
            {rightView === 'goal' && <GoalsView />}
            {rightView === 'drop' && <DropsView />}
            {rightView === 'stats' && <StatsView />}
            {rightView === 'friends' && <FriendsPanel embedded />}
          </div>
        </div>
      ) : isDesktop && curView === 'week' ? (
        <div className="desktop-week">
          <WeekView />
        </div>
      ) : (
        <>
          {curView === 'tl' && <DateNav />}
          {curView === 'tl' && <TimelineView />}
          {curView === 'week' && <WeekView />}
          {curView === 'habit' && <HabitView />}
          {curView === 'goal' && <GoalsView />}
          {curView === 'drop' && <DropsView />}
          {curView === 'cal' && <CalendarView />}
          {curView === 'stats' && <StatsView />}
          {curView === 'friends' && <FriendsPanel embedded />}
          {curView === 'mood' && <MoodView />}
          {curView === 'tips' && <TipsView />}
        </>
      )}
      <PomoFab />
      {showOnboarding && <SurveyWizard onDone={() => { localStorage.setItem('ff_onboarded', '1'); setShowOnboarding(false) }} />}
      <MiniToast />
      <ConfirmModal />
      <PromptModal />
      {doneToast !== null && <DoneToast blockId={doneToast} onClose={() => setDoneToast(null)} />}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <MoodAnnouncement />
      <TipsAnnouncement />
    </>
  )
}

export default function App() {
  useAuthState()
  useFirestoreSync()

  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  )
}
