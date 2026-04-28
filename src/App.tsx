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

function AppContent() {
  const curView = useAppStore((s) => s.curView)
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

  return (
    <>
      <Header />
      <ViewTabs />
      {curView === 'tl' && <DateNav />}
      {curView === 'tl' && <TimelineView />}
      {curView === 'week' && <WeekView />}
      {curView === 'habit' && <HabitView />}
      {curView === 'goal' && <GoalsView />}
      {curView === 'drop' && <DropsView />}
      {curView === 'cal' && <CalendarView />}
      {curView === 'stats' && <StatsView />}
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
