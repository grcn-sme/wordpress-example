// using Workbox library
importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);

workbox.setConfig({
    debug: false
});

workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.CacheFirst({
        cacheName: 'pages-cache',
    })
);

// offline assets loading strategy
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst()
);

// offline assets loading strategy
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate()
);
