import type { ReactNode } from 'react'
import { useAppStore } from '../../store/AppStore'
import { LoginOverlay } from './LoginOverlay'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const uid = useAppStore((s) => s.uid)
  const skipLogin = useAppStore((s) => s.skipLogin)

  if (!uid && !skipLogin) {
    return <LoginOverlay />
  }

  return <>{children}</>
}
