// Mobile-optimized Service Worker for Squarage Admin PWA
const CACHE_NAME = 'squarage-mobile-v3'; // Increment to force cache update
const urlsToCache = [
  '/manifest.json',
  '/images/favicon.png',
  '/images/logo_main_white_transparent.png'
];

// Install event - cache only essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mobile SW: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Mobile SW: Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('squarage')) {
            console.log('Mobile SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - minimal caching, network-first for everything important
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache these critical paths
  const neverCache = [
    '/api/',
    '/login',
    '/_next/webpack',
    '/_next/static/development',
    '/auth'
  ];
  
  if (neverCache.some(path => url.pathname.includes(path))) {
    // For API routes, ensure credentials are included
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request, { 
          credentials: 'include',
          headers: request.headers
        })
      );
    } else {
      event.respondWith(fetch(request));
    }
    return;
  }

  // For static assets only (images, fonts) - cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return response;
          });
        })
    );
    return;
  }

  // Everything else - network first, NO CACHING for HTML/JS
  event.respondWith(
    fetch(request).catch(() => {
      // Only return cached version if offline
      return caches.match(request);
    })
  );
});

// Listen for messages to clear cache on logout
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('Mobile SW: Cache cleared on logout');
      });
    });
  }
});