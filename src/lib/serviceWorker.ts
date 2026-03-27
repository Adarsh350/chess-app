const CACHE_NAME = 'deepgame-coaching-os-v6'
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/deepgame-logo.svg',
  '/deepgame-mark.svg',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/engines/stockfish/stockfish-lite.js',
  '/engines/stockfish/stockfish-lite.wasm',
]

function sameOriginPath(input: string) {
  try {
    const url = new URL(input, window.location.origin)
    if (url.origin !== window.location.origin) {
      return null
    }
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

async function warmOfflineCache() {
  if (!('caches' in window)) {
    return
  }

  const cache = await caches.open(CACHE_NAME)
  const urls = new Set<string>(STATIC_URLS)

  for (const entry of performance.getEntriesByType('resource')) {
    const url = sameOriginPath(entry.name)
    if (url) {
      urls.add(url)
    }
  }

  for (const element of document.querySelectorAll<HTMLLinkElement | HTMLScriptElement | HTMLImageElement>('link[href], script[src], img[src]')) {
    const source =
      element instanceof HTMLLinkElement ? element.href : element instanceof HTMLScriptElement ? element.src : element.src
    const url = sameOriginPath(source)
    if (url) {
      urls.add(url)
    }
  }

  await Promise.all(
    [...urls].map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' })
        if (response.ok) {
          await cache.put(url, response.clone())
        }
      } catch {
        // Ignore warmup misses; the service worker still handles runtime caching later.
      }
    }),
  )
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(async () => {
        await navigator.serviceWorker.ready
        await warmOfflineCache()
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error)
      })
  })
}
