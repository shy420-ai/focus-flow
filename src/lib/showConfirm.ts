let _resolve: ((v: boolean) => void) | null = null

export function showConfirm(msg: string): Promise<boolean> {
  return new Promise((resolve) => {
    _resolve = resolve
    window.dispatchEvent(new CustomEvent('ff-confirm', { detail: msg }))
  })
}

export function confirmResolve(result: boolean) {
  _resolve?.(result)
  _resolve = null
}
