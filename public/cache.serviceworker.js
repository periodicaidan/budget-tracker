const STATIC_CACHE_NAME = 'budget-static-cache-v1';
const DATA_CACHE_NAME = 'budget-data-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/index.js',
    '/manifest.webmanifest',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

self.addEventListener('install', (_e) => {
    caches.open(STATIC_CACHE_NAME)
        .then(cache => {
            cache.addAll(urlsToCache);
        });
    
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    // Delete old caches
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(
                keys.map(key => {
                    if (key !== STATIC_CACHE_NAME && key !== DATA_CACHE_NAME)
                        return caches.delete(key);
                })
            )
        )
    );

    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then(cache => 
                    fetch(e.request)
                        .then(res => {
                            if (res.status === 200)
                                cache.put(e.request.url, res.clone());
                            
                            return res;
                        })
                        .catch(err => cache.match(e.request))
                )
                .catch(console.error)
        );

        return;
    }

    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});