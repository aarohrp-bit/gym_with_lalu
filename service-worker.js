/* Gym with Lalu — App Shell + Image Service Worker */
const CACHE_NAME = "gym-with-lalu-v8";

// Paths are RELATIVE so they resolve correctly whether the app is served from "/"
// (local dev) or from a subpath like "/gym_with_lalu/" (GitHub Pages). Relative URLs
// resolve against this service worker's location (the app's scope directory).
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./dumbbell.svg",
  "./icon-192.png",
  "./icon-512.png"
];
const INDEX_URL = new URL("./index.html", self.location).href;

// All exercise/mini-exercise images (precached so the whole app works offline
// after a single online visit — even images you haven't viewed yet).
const IMAGE_KEYS = [
  "9fyk93","9iuckc","404cvl","a6wp6i","v97wkz","vsiqo2","buv80r","tmw1sa",
  "5on1f5","9pkptv","84o2ln","jb9rjh","qg7j95","ywwdk0","ohl056",
  "4so763","8i68io","c38ld4","ooynug","r01yrl","yzsm4o","f1oxlu","ar7ouu",
  "7zxxhr","8wi16v","667orr","776lsc","dt1er2","dymt99","gt869g","mc6wa9","hxq6im",
  "c8pe80","kbbgn1","l7cfjs","mcrft","qwroa8","ttyp6k","maiyp4","qtit34",
  "3a60p3","56it57","854lqt","i1ugm6","i1uxdd","ke1x4g","n6ecfw","iywvua",
  "9y024a","af051o","knipph","lh8t4i","wv5sk7","z6n3ow",
  "2pvxjw","5tbvis","iv79uj","xji55x","ogoyiy","g1qhqp"
];
const IMAGE_URLS = IMAGE_KEYS.map((k) => `./exercises/${k}.webp`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // App shell must succeed.
      await cache.addAll(APP_SHELL);
      // Images are best-effort — a single 404 must not abort the install.
      await Promise.allSettled(
        IMAGE_URLS.map((url) =>
          fetch(url, { cache: "reload" })
            .then((res) => (res && res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for the app shell + app code so a new deploy is never trapped behind a
// stale cache (CRA dev serves an UN-hashed /static/js/bundle.js, which a cache-first SW
// would pin forever). Cache-first for images, which are immutable and keyed by id.
const isShellOrCode = (url, req) =>
  req.mode === "navigate" ||
  url.pathname.endsWith("/") ||
  url.pathname.endsWith("/index.html") ||
  url.pathname.includes("/static/") ||
  url.pathname.endsWith(".js") ||
  url.pathname.endsWith(".css");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Don't intercept cross-origin (e.g. fonts CDN — handled by the browser cache).
  if (url.origin !== self.location.origin) return;

  if (isShellOrCode(url, req)) {
    // Network-first: always try fresh code, fall back to cache offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(INDEX_URL))
        )
    );
    return;
  }

  // Cache-first for everything else (images, manifest, icon).
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
