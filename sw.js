/* Bitacora Agricola - Service Worker (offline app shell) */
var CACHE = 'bitacora-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/huerto-invierno.jpg',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png',
  './img/apple-touch-icon.png',
  './fonts/Outfit-Regular.ttf',
  './fonts/Outfit-Bold.ttf',
  './fonts/JetBrainsMono-Regular.ttf',
  './fonts/JetBrainsMono-Bold.ttf'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // APIs externas siempre a la red

  if (e.request.mode === 'navigate') {
    // Network-first: la app nueva siempre llega; cache como respaldo offline
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function(c) { c.put('./index.html', copia); });
        return resp;
      }).catch(function() { return caches.match('./index.html'); })
    );
    return;
  }

  // Cache-first para estaticos (fuentes, imagenes)
  e.respondWith(
    caches.match(e.request).then(function(hit) {
      return hit || fetch(e.request).then(function(resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copia); });
        return resp;
      });
    })
  );
});
