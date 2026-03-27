const CACHE_NAME = 'deepgame-coaching-os-v6'
const ASSET_MANIFEST_URL = '/asset-manifest.json'
const CORE_ASSETS = [
  '/',
  '/index.html',
  ASSET_MANIFEST_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/deepgame-logo.svg',
  '/deepgame-mark.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/engines/stockfish/stockfish-lite.js',
  '/engines/stockfish/stockfish-lite.wasm',
]

function isCacheableRequest(request) {
  const url = new URL(request.url)
  return url.origin === self.location.origin
}

function normalizeAssetPath(assetPath) {
  if (!assetPath) {
    return null
  }

  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`
}

async function matchCached(cache, request) {
  const url = new URL(request.url)
  const candidates = [
    request,
    request.url,
    `${url.pathname}${url.search}`,
    url.pathname,
  ]

  for (const candidate of candidates) {
    const response = await cache.match(candidate)
    if (response) {
      return response
    }
  }

  return null
}

async function getBuildAssets() {
  try {
    const response = await fetch(ASSET_MANIFEST_URL, { cache: 'no-cache' })
    if (!response.ok) {
      return []
    }

    const manifest = await response.json()
    const assets = new Set([ASSET_MANIFEST_URL])

    for (const entry of Object.values(manifest)) {
      if (!entry || typeof entry !== 'object') {
        continue
      }

      const file = normalizeAssetPath(entry.file)
      if (file) {
        assets.add(file)
      }

      for (const css of entry.css ?? []) {
        const path = normalizeAssetPath(css)
        if (path) {
          assets.add(path)
        }
      }

      for (const asset of entry.assets ?? []) {
        const path = normalizeAssetPath(asset)
        if (path) {
          assets.add(path)
        }
      }
    }

    return [...assets]
  } catch {
    return []
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const buildAssets = await getBuildAssets()
      const assets = [...new Set([...CORE_ASSETS, ...buildAssets])]
      await cache.addAll(assets)
    })(),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  if (!isCacheableRequest(request)) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          const cached = await matchCached(cache, request)
          return cached ?? caches.match('/index.html')
        }),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await matchCached(cache, request)
      if (cached) {
        return cached
      }

      try {
        const response = await fetch(request)
        if (response.ok) {
          const copy = response.clone()
          cache.put(request, copy)
        }
        return response
      } catch {
        return cached ?? Response.error()
      }
    }),
  )
})
