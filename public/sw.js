const CACHE = 'ff-react-v5'
const BASE = new URL(self.registration.scope).pathname

const STATIC = [
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'tree.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Network-first for HTML/JS/CSS so deploys land on the next refresh.
// Cache-first only for the small STATIC asset list (icons/manifest/png).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = e.request.url
  if (url.includes('firestore') || url.includes('googleapis')) return

  const isStatic = STATIC.some((path) => url.endsWith(path))

  if (isStatic) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Network-first with cache fallback for everything else (HTML/JS/CSS)
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone))
      }
      return res
    }).catch(() => caches.match(e.request).then((cached) => cached || Response.error()))
  )
})
