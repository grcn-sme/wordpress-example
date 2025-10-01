// using Workbox library
importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);

// offline assets loading strategy
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst()
);

// offline assets loading strategy
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script',
    new workbox.strategies.NetworkFirst()
);
