// Minimal offline cache for the Step Planner PWA.
// Paths are resolved relative to the SW's own location so this works under any
// base path (e.g. GitHub Pages "/steps-planner/").
const CACHE = "steps-v1";
const SHELL = new URL("./index.html", self.location).href;
const ASSETS = [
  new URL("./", self.location).href,
  SHELL,
  new URL("./walk.svg", self.location).href,
  new URL("./manifest.webmanifest", self.location).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navigations: try network, fall back to cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL))
    );
    return;
  }

  // Other same-origin GETs: cache-first, then network (and cache it).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && new URL(request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
