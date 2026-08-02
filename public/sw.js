const CACHE_NAME = "tabmonitor-pwa-v2";

/* ═══════════════════════════════════════════════════════════════════
 *  Static Assets — only cache truly static files at install time.
 *  DO NOT cache dynamic Next.js routes here (they require auth
 *  and will fail during SW install phase).
 * ═══════════════════════════════════════════════════════════════════ */
const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png"
];

/* ── Install: cache only static assets ────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ── Activate: clean up old caches ────────────────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch: Network-First with Runtime Cache ──────────────────────
 *
 *  Strategy:
 *    1. Always try network first (fresh data)
 *    2. On success: cache the response for offline use (runtime cache)
 *    3. On failure: fall back to cached version
 *    4. For HTML navigations: fall back to cached /pic/dashboard
 *
 *  This avoids pre-caching dynamic auth-gated routes that would
 *  fail during SW install phase.
 * ─────────────────────────────────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API calls and external requests from caching
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful same-origin responses at runtime
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // For HTML navigations, fall back to cached dashboard
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/pic/dashboard");
          }
        });
      })
  );
});
