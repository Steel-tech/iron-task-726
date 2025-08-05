/**
 * FSW Iron Task Service Worker
 * Enhanced offline capabilities and background sync
 */

const CACHE_NAME = 'fsw-iron-task-v2'
const CORE_URLS = [
  '/',
  '/dashboard',
  '/dashboard/upload',
  '/login'
]

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(CORE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - implement cache-first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({
            error: 'Offline',
            message: 'Request will be processed when connection is restored'
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }

  // Handle page requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache error responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cache successful responses
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>FSW Iron Task - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-container { max-width: 400px; margin: 0 auto; }
                    .offline-icon { font-size: 64px; margin-bottom: 20px; }
                    .offline-title { color: #333; margin-bottom: 10px; }
                    .offline-message { color: #666; margin-bottom: 30px; }
                    .retry-button { 
                      background: #007bff; color: white; border: none; 
                      padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1 class="offline-title">You're Offline</h1>
                    <p class="offline-message">
                      No internet connection available. Your work will be saved locally 
                      and synced when connection is restored.
                    </p>
                    <button class="retry-button" onclick="window.location.reload()">
                      Try Again
                    </button>
                  </div>
                </body>
                </html>
              `, {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'text/html' }
              })
            }
            
            return new Response('', { status: 503 })
          })
      })
  )
})

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-uploads') {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  try {
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'sync-uploads'
      })
    })
  } catch (error) {
    // Silent failure for background sync
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const options = {
    body: 'You have new updates in your construction project',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: { url: '/dashboard' },
    actions: [
      { action: 'open', title: 'View Updates' },
      { action: 'close', title: 'Dismiss' }
    ]
  }

  try {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data.url = data.url || options.data.url
  } catch (e) {
    // Use default options if parsing fails
  }

  event.waitUntil(
    self.registration.showNotification('FSW Iron Task', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // Check if window is already open
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})