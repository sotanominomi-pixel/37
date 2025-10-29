const CACHE_NAME='nclock-v5';
const urlsToCache=['./','./index.html','./style.css','./script.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache))); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
