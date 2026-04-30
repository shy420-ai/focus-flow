let _resolve: ((v: string | null) => void) | null = null

export interface PromptRequest {
  msg: string
  defaultValue?: string
  placeholder?: string
}

export function showPrompt(req: string | PromptRequest, defaultValue?: string): Promise<string | null> {
  return new Promise((resolve) => {
    _resolve = resolve
    const detail: PromptRequest = typeof req === 'string'
      ? { msg: req, defaultValue }
      : req
    window.dispatchEvent(new CustomEvent('ff-prompt', { detail }))
  })
}

export function promptResolve(value: string | null) {
  _resolve?.(value)
  _resolve = null
}
