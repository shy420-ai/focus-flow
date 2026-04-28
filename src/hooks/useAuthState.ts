import { useEffect } from 'react'
import { onAuthChange } from '../lib/auth'
import { useAppStore } from '../store/AppStore'

export function useAuthState(): void {
  const setUID = useAppStore((s) => s.setUID)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUID(user.uid, user.displayName)
      } else {
        setUID(null)
      }
    })
    return unsubscribe
  }, [setUID])
}
