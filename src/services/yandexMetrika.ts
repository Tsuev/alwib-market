const METRIKA_ID = 110026659

type YmFn = (id: number, method: string, ...args: unknown[]) => void

declare global {
  interface Window {
    ym?: YmFn
  }
}

function getYm(): YmFn | null {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') {
    return null
  }

  return window.ym
}

export function trackPageView(url: string, referrer?: string): void {
  const ym = getYm()

  if (!ym) {
    return
  }

  ym(METRIKA_ID, 'hit', url, {
    referer: referrer,
  })
}
