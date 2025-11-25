/**
 * Service Worker for Daily Budget Tracker PWA
 * Implements offline-first caching strategy
 */

const CACHE_NAME = 'budget-tracker-v1';
const DATA_CACHE_NAME = 'budget-tracker-data-v1';

// Files to cache immediately on install
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/components.css',
  '/styles/utilities.css',
  '/js/app.js',
  '/js/state/BudgetStore.js',
  '/js/features/Dashboard.js',
  '/js/features/IncomeSetup.js',
  '/js/features/ExpenseForm.js',
  '/js/features/InitialExpensesForm.js',
  '/js/features/InitialExpensesList.js',
  '/js/features/EndOfDay.js',
  '/js/features/SavingsFund.js',
  '/js/features/ExpenseHistory.js',
  '/js/features/PayPeriodManager.js',
  '/js/features/DataManager.js',
  '/js/models/Expense.js',
  '/js/utils/dateUtils.js',
  '/js/utils/formatters.js',
  '/js/utils/validation.js',
  '/manifest.json'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Error caching files:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 * Strategy: Cache-first for static assets, Network-first for data
 */
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API/data requests with network-first strategy
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.status === 200) {
            return caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request.url, response.clone());
                return response;
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Return cached version
          return response;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[ServiceWorker] Fetch failed:', error);

            // Return offline fallback page if available
            return caches.match('/index.html');
          });
      })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.payload))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((keyList) => {
          return Promise.all(
            keyList.map((key) => caches.delete(key))
          );
        })
        .then(() => {
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_CLEARED'
            });
          });
        })
    );
  }
});

/**
 * Background sync event - handle background data sync
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);

  if (event.tag === 'sync-expenses') {
    event.waitUntil(
      // Sync expenses when back online
      syncExpenses()
    );
  }
});

/**
 * Sync expenses with server (placeholder for future implementation)
 */
async function syncExpenses() {
  try {
    console.log('[ServiceWorker] Syncing expenses...');
    // Future implementation: sync with backend
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    throw error;
  }
}

/**
 * Push notification event - handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Daily Budget Tracker';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: false,
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click event - handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === event.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data);
        }
      })
  );
});

console.log('[ServiceWorker] Loaded');
