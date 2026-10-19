// Caches the app shell so Inventory Companion opens without a connection. Data calls to Supabase are never cached.
const C = 'inventory-companion-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  const keep = u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net';
  if (!keep) return;
  const store = res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; };
  if (r.mode === 'navigate') {            // pages: network first, so updates arrive; cache when offline
    e.respondWith(fetch(r).then(store).catch(() => caches.match('./index.html')));
  } else {                                // assets and the supabase library: cache first
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(store)));
  }
});
