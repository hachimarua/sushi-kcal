const cacheName = 'sushi-kcal-v12';
const assets = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/menu-items.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

const isNetworkFirst = (request) => {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return (
    request.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.webmanifest')
  );
};

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (isNetworkFirst(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(cacheName).then((cache) => cache.put(event.request, copy)));
          }
          return response;
        })
        .catch(() => (
          caches.match(event.request)
            .then((cached) => cached || caches.match('./index.html'))
            .then((fallback) => fallback || Response.error())
        )),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
