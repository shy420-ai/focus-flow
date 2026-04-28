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
import { Onboarding } from './components/onboarding/Onboarding'
import { MiniToast } from './components/ui/MiniToast'
import { ConfirmModal } from './components/ui/ConfirmModal'
import { DoneToast } from './components/timeline/DoneToast'
import { Confetti } from './components/ui/Confetti'
import { useAppStore } from './store/AppStore'
import { useAuthState } from './hooks/useAuthState'
import { useFirestoreSync } from './hooks/useFirestoreSync'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

function AppContent() {
  const curView = useAppStore((s) => s.curView)
  const isDesktop = useIsDesktop()
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('ff_onboarded'))
  const [doneToast, setDoneToast] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    window.__ffShowOnboarding = () => setShowOnboarding(true)
  }, [setShowOnboarding])

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

  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Header />
        <ViewTabs />
      </div>
      {isDesktop && curView !== 'week' ? (
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
        </>
      )}
      <PomoFab />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <MiniToast />
      <ConfirmModal />
      {doneToast !== null && <DoneToast blockId={doneToast} onClose={() => setDoneToast(null)} />}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
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
