// Service Worker for Squarage Admin Dashboard
// Handles push notifications and notification clicks

const CACHE_VERSION = 'v1.0.0'

// Handle push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received')
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data')
    return
  }

  let data
  try {
    data = event.data.json()
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e)
    return
  }

  const { title, message, type, relatedId, notificationId } = data
  
  // Notification options
  const options = {
    body: message,
    icon: '/images/favicon.png',
    badge: '/images/favicon.png',
    vibrate: [200, 100, 200],
    tag: relatedId ? `task:${relatedId}` : `notification:${notificationId}`,
    requireInteraction: false,
    renotify: true,
    data: {
      type,
      relatedId,
      notificationId,
      dateOfArrival: Date.now()
    },
    actions: []
  }

  // Add action buttons based on notification type
  if (type === 'task_assigned' || type === 'task_due') {
    options.actions = [
      {
        action: 'view',
        title: 'View Task',
        icon: '/images/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/images/dismiss-icon.png'
      }
    ]
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received')
  
  event.notification.close()
  
  const data = event.notification.data
  let targetUrl = '/'
  
  // Determine target URL based on notification type
  if (data.relatedId) {
    targetUrl = `/todo#${data.relatedId}`
  }
  
  // Handle action buttons
  if (event.action === 'view' && data.relatedId) {
    targetUrl = `/todo#${data.relatedId}`
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    return
  }
  
  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.focus()
            return client.navigate(targetUrl)
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// Handle push subscription changes (e.g., when subscription expires)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed')
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription.options.applicationServerKey
    })
    .then(function(subscription) {
      // Send new subscription to server
      return fetch('/api/notifications/resubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription.endpoint,
          newSubscription: subscription.toJSON()
        })
      })
    })
  )
})

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activated')
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName.startsWith('squarage-') && cacheName !== `squarage-${CACHE_VERSION}`) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all clients immediately
  return self.clients.claim()
})

// Handle messages from the client
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[Service Worker] Clearing cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
      })
    )
  }
})

// Minimal offline support for critical assets
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip API and auth routes
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/auth/')) {
    return
  }
  
  // For navigation requests, try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        // Return offline page if available
        return caches.match('/offline.html')
      })
    )
    return
  }
})

console.log('[Service Worker] Loaded successfully')