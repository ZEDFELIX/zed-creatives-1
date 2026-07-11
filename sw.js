const CACHE_NAME = 'zed-creatives-v2';
const APP_SHELL = [
  'index.html','about.html','services.html','portfolio.html','shop.html',
  'cart.html','contact.html','login.html',
  'style.css','app.js','logo.png','icon-192.png','icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
