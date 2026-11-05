const APP_VERSION = '0.1.1';
// The service worker (PLAN §4.5 rule 7; Phase 0 brief, step 9). /deploy raises
// the version on line 1 together with src/version.js, and each version gets its
// own cache.
const CACHE = `vpet-${APP_VERSION}`;

// The app's own files (DECISIONS §3), stored at install. './' is the address
// the app opens at. vendor/ is left out: MediaPipe's files are stored on first
// use, so each device keeps only the wasm variant it actually runs.
const APP_SHELL = [
  './',
  './manifest.webmanifest',
  './src/main.js',
  './src/version.js',
  './src/config.js',
  './src/clock.js',
  './src/events.js',
  './src/storage.js',
  './src/sim/needs.js',
  './src/sim/behaviour.js',
  './src/input/pointer.js',
  './src/render/scene.js',
  './src/render/placeholder.js',
  './src/ui/hud.js',
  './src/ui/devpanel.js',
  './src/ui/errorlog.js',
  './src/input/camera.js',
  './src/input/hands.js',
  './src/input/hands.worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // 'no-cache' makes the browser check with the server, so GitHub Pages'
  // 10-minute browser cache can't put old files into the new version's cache.
  const requests = APP_SHELL.map((url) => new Request(url, { cache: 'no-cache' }));
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(requests))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Other projects on the same github.io address have caches too: only
  // caches whose names start with vpet- are ever deleted.
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith('vpet-') && name !== CACHE)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only GET requests inside the app's folder; the scope URL includes the
  // origin, so this also keeps to same-origin requests.
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const { response, stored } = networkFirst(request);
  event.respondWith(response);
  // Registered now rather than after the fetch: some browsers refuse
  // waitUntil once the event has been handed back.
  event.waitUntil(stored);
});

// Network first, so a deploy shows at once; the cache is the offline fallback.
// Returns the response, plus a promise that settles once a fresh copy is stored.
function networkFirst(request) {
  let finishStoring;
  const stored = new Promise((resolve) => { finishStoring = resolve; });

  const response = (async () => {
    try {
      // Navigations are fetched by URL: older browsers threw when a navigation
      // request was rebuilt with options (Phase 0 brief, pitfalls).
      const fresh = request.mode === 'navigate'
        ? await fetch(request.url, { cache: 'no-cache' })
        : await fetch(request, { cache: 'no-cache' });
      if (fresh.status === 200) {
        const copy = fresh.clone();
        finishStoring(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      } else {
        finishStoring();
      }
      return fresh;
    } catch (error) {
      finishStoring();
      const cache = await caches.open(CACHE);
      const cached = (await cache.match(request))
        ?? (request.mode === 'navigate' ? await cache.match('./') : undefined);
      if (cached) return cached;
      throw error;
    }
  })();

  return { response, stored };
}
