// Service Worker for Squarage Admin PWA
const CACHE_NAME = 'squarage-admin-v3'; // Increment to force cache update
const urlsToCache = [
  '/manifest.json',
  '/images/favicon.png',
  '/images/logo_main_white_transparent.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for these paths - they need to always go to network
  const skipCache = [
    '/api/',  // Skip ALL API routes to prevent authentication issues
    '/login',
    '/_next/webpack-hmr',
    '/_next/static/development'
  ];
  
  if (skipCache.some(path => url.pathname.startsWith(path))) {
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

  // Network-first strategy for HTML pages only (API calls are already handled above)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then(response => {
            if (response) return response;
            // Return offline page if available
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts, css, js)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
            // Check if valid response
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
        .catch((error) => {
          console.error('Fetch failed:', error);
        })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync for offline data submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncTodos());
  }
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales());
  }
});

async function syncTodos() {
  try {
    // Get queued todos from IndexedDB and sync with server
    console.log('Syncing todos with server...');
    // Implementation would go here when offline support is added
  } catch (error) {
    console.error('Todo sync failed:', error);
  }
}

async function syncSales() {
  try {
    // Get queued sales from IndexedDB and sync with server
    console.log('Syncing sales with server...');
    // Implementation would go here when offline support is added
  } catch (error) {
    console.error('Sales sync failed:', error);
  }
}

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/images/favicon.png',
    badge: '/images/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Squarage Admin', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});