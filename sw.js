// AssetTrackPro Field App — service worker
// Minimal by design: this exists so PWABuilder/Bubblewrap recognizes the
// site as a valid installable PWA. It does NOT change your app's existing
// offline sync logic (localStorage queue + Supabase) — that stays as-is.

const CACHE_NAME = "atp-field-shell-v1";
const APP_SHELL = [
  "/field-app"
];

// Cache the app shell on install so the wrapped app can boot even on a
// flaky connection (the field-app's own offline queue handles data sync).
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Clean up old caches on activate.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first for navigation requests (so you always get the latest
// deployed version when online), falling back to the cached shell offline.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/field-app"))
    );
  }
  // All other requests (API calls, Supabase, assets) pass through untouched —
  // your app's existing localStorage/Supabase sync logic owns that behavior.
});
