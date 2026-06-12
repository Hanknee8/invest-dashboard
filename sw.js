const CACHE_NAME = 'qclaw-v1';
const ASSETS = ['./index.html', './data.json', './state.json', './history.json', './news.json', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // For data files: network first, fallback to cache
  if (['data.json', 'state.json', 'history.json', 'news.json'].includes(url.pathname.split('/').pop())) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // For other files: cache first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
        const clone = nr.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return nr;
      }))
    );
  }
});
