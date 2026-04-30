import { useEffect, useRef } from 'react'

// Pushes a fresh history entry while `open` is true so that the device's
// back button closes the modal/sheet instead of exiting the PWA.
//
// Robustness notes:
// - onClose is captured via ref so re-renders don't tear down the effect.
// - We arm the popstate listener after a short delay so any popstate fired
//   from a preceding history.back() (e.g. React StrictMode mount→unmount→mount
//   or a sibling modal) cannot immediately fire onClose on this fresh modal.
// - Cleanup leaves the pushed state in place. The browser collapses our
//   pushed state into the next real back navigation, so we don't fight it
//   with our own history.back() — that's what was firing spurious popstate
//   into a freshly mounted listener and closing modals on open.
export function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    history.pushState({ ffModal: Date.now() + Math.random() }, '')

    let armed = false
    const armTimer = setTimeout(() => { armed = true }, 80)

    function onPop() {
      if (!armed) return
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      clearTimeout(armTimer)
      window.removeEventListener('popstate', onPop)
    }
  }, [open])
}
