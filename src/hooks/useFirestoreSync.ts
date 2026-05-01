import { useEffect } from 'react'
import { useAppStore } from '../store/AppStore'
import { startSync, stopSync, flushSync } from '../lib/syncManager'
import { bumpLastActive, setMyUid } from '../lib/profileSync'

// Import stores to ensure their registerCollect/registerHydrate calls run
import '../store/HabitStore'
import '../store/DropStore'
import '../store/GoalStore'
import '../store/MedStore'
import '../components/dev/SprintBoard'
import '../components/layout/ViewTabs'
import '../lib/profileSync'
import '../lib/avatar'
import '../lib/bio'

export function useFirestoreSync(): void {
  const uid = useAppStore((s) => s.uid)
  const skipLogin = useAppStore((s) => s.skipLogin)

  useEffect(() => {
    if (uid && !skipLogin) {
      setMyUid(uid)
      startSync(uid)
      bumpLastActive()
      // Push profile + shareCode immediately on sign-in so friends can find
      // me by code without me having to open the friends tab first.
      flushSync().catch(() => { /* offline ok */ })
      return () => {
        setMyUid(null)
        stopSync()
      }
    }
    return undefined
  }, [uid, skipLogin])
}
