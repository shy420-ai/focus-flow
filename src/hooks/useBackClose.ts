import { useEffect } from 'react'

// Pushes a fresh history entry while `open` is true so that the device's
// back button closes the modal/sheet instead of exiting the PWA.
export function useBackClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const tag = { ffModal: Date.now() + Math.random() }
    history.pushState(tag, '')

    function onPop() {
      onClose()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      // If our entry is still on top (closed via UI, not back button), pop it.
      const cur = history.state as { ffModal?: number } | null
      if (cur && cur.ffModal === tag.ffModal) {
        history.back()
      }
    }
  }, [open, onClose])
}
