// WeebTrax Service Worker — app-shell caching for PWA installability.
// Audio and video files are intentionally bypassed (they stream from the server).
const CACHE = 'wt-shell-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Remove old cache versions on activation
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never intercept audio/video streams — they need byte-range requests to work correctly
  if (
    url.pathname.startsWith('/public/assets/mixes/audio/') ||
    url.pathname.startsWith('/public/assets/scenes/videos/')
  ) return;

  // Network-first with cache fallback: always try the network so updates land immediately,
  // fall back to the cached version when offline.
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
