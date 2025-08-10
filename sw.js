// sw.js – cache-first for static assets, network-first for navigations (SPA-friendly)
const CACHE = 'chem-bilan-v1';

// Scope-aware base (works for root sites and /repo/ project sites)
const BASE = self.registration.scope; // e.g., https://user.github.io/ or https://user.github.io/repo/
const INDEX_URL = new URL('./index.html', BASE).href;
const urlsToCache = [
  BASE,           // "./" — helpful on some hosts
  INDEX_URL,
  new URL('./molecule-bg.js', BASE).href
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (evt) => {
  const req = evt.request;

  // Navigations: network first, fall back to cached index for offline SPA
  if (req.mode === 'navigate') {
    evt.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(INDEX_URL, copy));
        return res;
      }).catch(() => caches.match(INDEX_URL))
    );
    return;
  }

  // Other requests: cache-first, then network (and cache it)
  evt.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
