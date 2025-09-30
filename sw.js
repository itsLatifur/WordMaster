/* Service Worker for WordsMaster */
const CACHE_VERSION = "2025-10-01"; // bump on deploys
const CACHE_NAME = `wm-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/animations.css",
  "/js/utils.js",
  "/js/words.js",
  "/js/audioManager.js",
  "/js/effects.js",
  "/js/game.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) =>
            k === CACHE_NAME ? Promise.resolve() : caches.delete(k)
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Network-first for HTML (ensures latest shell), cache fallback
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/index.html", resClone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Strategy per type
  const dest = req.destination;

  // Network-first for CSS and JS to avoid stale themes/scripts
  if (dest === "style" || dest === "script") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (
            req.method === "GET" &&
            res.ok &&
            new URL(req.url).origin === self.location.origin
          ) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for images/audio/fonts and other static content
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (
              req.method === "GET" &&
              res.ok &&
              new URL(req.url).origin === self.location.origin
            ) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
