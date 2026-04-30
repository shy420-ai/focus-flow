import { useEffect, useRef } from 'react'

// Pushes a fresh history entry while `open` is true so that the device's
// back button closes the modal/sheet instead of exiting the PWA.
//
// IMPORTANT: only `open` is in the dep array. The effect captures onClose
// via a ref, otherwise every parent re-render (which gives a new onClose
// function reference) would tear down + push another history entry — and
// the cleanup's history.back() triggers popstate which closes the modal.
export function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const tag = { ffModal: Date.now() + Math.random() }
    history.pushState(tag, '')

    function onPop() {
      onCloseRef.current()
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
  }, [open])
}
