const CACHE_NAME = "campus-connect-v1";
const STATIC_ASSETS = [
    "/",
    "/brand/logo.png",
    "/brand/maskable.png",
    "/icons/icon-192.svg",
    "/icons/icon-512.svg",
];

// Install — pre-cache the shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first, fallback to cache
self.addEventListener("fetch", (event) => {
    // Only intercept GET requests
    if (event.request.method !== "GET") return;

    // Ignore cross-origin requests like Supabase storage and Firebase
    // letting the browser handle them natively to prevent FetchEvent promise rejections.
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful, same-origin responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(async () => {
                const cachedRes = await caches.match(event.request);
                if (cachedRes) return cachedRes;

                // Return generic offline response instead of undefined to prevent promise rejections
                return new Response("Network error occurred. You are offline.", {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' },
                });
            })
    );
});
