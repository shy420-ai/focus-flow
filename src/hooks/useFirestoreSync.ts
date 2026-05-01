import { useEffect } from 'react'
import { useAppStore } from '../store/AppStore'
import { startSync, stopSync } from '../lib/syncManager'
import { bumpLastActive } from '../lib/profileSync'

// Import stores to ensure their registerCollect/registerHydrate calls run
import '../store/HabitStore'
import '../store/DropStore'
import '../store/GoalStore'
import '../store/MedStore'
import '../components/dev/SprintBoard'
import '../components/layout/ViewTabs'
import '../lib/profileSync'
import '../lib/avatar'

export function useFirestoreSync(): void {
  const uid = useAppStore((s) => s.uid)
  const skipLogin = useAppStore((s) => s.skipLogin)

  useEffect(() => {
    if (uid && !skipLogin) {
      startSync(uid)
      bumpLastActive()
      return () => stopSync()
    }
    return undefined
  }, [uid, skipLogin])
}
