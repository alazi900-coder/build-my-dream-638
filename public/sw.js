// Production-Ready Service Worker for Pokemon Shield Guide
// PWA Offline Cold-Start Support with Proper Cache Management

// ============================================
// CACHE CONFIGURATION
// ============================================

// Versioned cache names for clean updates
const APP_SHELL_CACHE = "app-shell-v1";
const ASSETS_CACHE = "assets-v1";
const IMAGES_CACHE = "images-v1";
const API_DATA_CACHE = "api-data-v1";
const AUDIO_CACHE = "audio-v1";
const EMULATOR_CACHE = "emulator-cores-v1";

// All current caches (for cleanup)
const CURRENT_CACHES = [
  APP_SHELL_CACHE,
  ASSETS_CACHE,
  IMAGES_CACHE,
  API_DATA_CACHE,
  AUDIO_CACHE,
  EMULATOR_CACHE,
];

// Cache size limits
const MAX_IMAGE_CACHE_ENTRIES = 2000;
const MAX_API_CACHE_ENTRIES = 200;
const MAX_ASSETS_CACHE_ENTRIES = 300;
const MAX_AUDIO_CACHE_ENTRIES = 500;

// App shell files to precache on install (minimal for fast install)
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

// Default notification options
const DEFAULT_NOTIFICATION = {
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  vibrate: [100, 50, 100],
  tag: "pokemon-guide-update",
  renotify: true,
};

// Image URL patterns for Cache First strategy
const IMAGE_PATTERNS = [
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//i,
  /^https:\/\/play\.pokemonshowdown\.com\/sprites\//i,
  /^https:\/\/images\.unsplash\.com\//i,
  /\.(png|jpg|jpeg|webp|gif|svg)$/i,
];

// Audio URL patterns
const AUDIO_PATTERNS = [
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/cries\//i,
  /\.(mp3|ogg|wav)$/i,
];

// Emulator CDN patterns (nostalgist cores)
const EMULATOR_PATTERNS = [
  /cdn\.jsdelivr\.net.*nostalgist/i,
  /cdn\.jsdelivr\.net.*retroarch/i,
  /cdn\.jsdelivr\.net.*libretro/i,
  /cdn\.jsdelivr\.net.*mgba/i,
];

// API URL patterns for Network First (REST data only - NO AUTH!)
const API_DATA_PATTERNS = [/supabase.*\/rest\//i];

// NEVER cache these patterns (security-sensitive)
const NEVER_CACHE_PATTERNS = [
  /\/auth\//i, // All auth endpoints
  /supabase.*\/auth\//i, // Supabase auth specifically
  /\/token/i, // Token endpoints
  /\/session/i, // Session endpoints
];

// ============================================
// CACHE MANAGEMENT UTILITIES
// ============================================

/**
 * Check if URL should never be cached (auth, tokens, etc.)
 */
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if URL matches any pattern in the list
 */
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

/**
 * Trim cache to maximum entries, removing oldest first
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxEntries) {
      const toDelete = keys.length - maxEntries;
      console.log(`[SW] Trimming ${toDelete} entries from ${cacheName}`);

      const deletePromises = keys.slice(0, toDelete).map((key) => cache.delete(key));
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error(`[SW] Error trimming cache ${cacheName}:`, error);
  }
}

/**
 * Get cache size in bytes (approximate)
 */
async function getCacheSizeBytes(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const key of keys.slice(0, 100)) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }

    if (keys.length > 100) {
      totalSize = Math.round(totalSize * (keys.length / 100));
    }

    return totalSize;
  } catch (error) {
    console.error(`[SW] Error calculating cache size:`, error);
    return 0;
  }
}

// ============================================
// INSTALL EVENT
// ============================================

self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log("[SW] Precaching app shell");
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log("[SW] App shell cached, skipping waiting");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Failed to cache app shell:", error);
      }),
  );
});

// ============================================
// ACTIVATE EVENT - Clean up old caches
// ============================================

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete any cache not in our current list
              return !CURRENT_CACHES.includes(name);
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      }),
  );
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache First strategy - for images and static assets
 */
async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }

    return response;
  } catch (error) {
    console.error("[SW] Cache First fetch failed:", error);
    throw error;
  }
}

/**
 * Network First strategy - for API data
 */
async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed, trying cache for:", request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

/**
 * Stale While Revalidate strategy - for Vite assets
 */
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// ============================================
// FETCH EVENT - Main request handler
// ============================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // NEVER cache auth-related requests (security!)
  if (shouldNeverCache(url.href)) {
    return;
  }

  // ========== NAVIGATION REQUESTS ==========
  // Network First with SPA fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);

          // Cache successful navigation responses
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put("/index.html", networkResponse.clone());

          return networkResponse;
        } catch (error) {
          // Offline - return cached index.html for SPA routing
          console.log("[SW] Navigation failed, serving cached index.html");
          const cachedPage = await caches.match("/index.html");

          if (cachedPage) {
            return cachedPage;
          }

          // Ultimate fallback
          return new Response("App is offline. Please connect to the internet.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  // ========== VITE BUILD ASSETS (/assets/*.js, /assets/*.css) ==========
  // Stale While Revalidate - critical for offline cold-start
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE, MAX_ASSETS_CACHE_ENTRIES));
    return;
  }

  // ========== IMAGES ==========
  // Cache First for all images
  if (matchesPattern(url.href, IMAGE_PATTERNS)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES));
    return;
  }

  // ========== AUDIO ==========
  // Cache First for audio files
  if (matchesPattern(url.href, AUDIO_PATTERNS)) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE, MAX_AUDIO_CACHE_ENTRIES));
    return;
  }

  // ========== EMULATOR CORES (jsdelivr CDN) ==========
  // Cache First for emulator core files
  if (matchesPattern(url.href, EMULATOR_PATTERNS)) {
    event.respondWith(cacheFirst(request, EMULATOR_CACHE, 50));
    return;
  }

  // ========== API DATA (REST only, no auth) ==========
  // Network First for API data
  if (matchesPattern(url.href, API_DATA_PATTERNS)) {
    event.respondWith(networkFirst(request, API_DATA_CACHE, MAX_API_CACHE_ENTRIES));
    return;
  }

  // ========== OTHER STATIC ASSETS (fonts, etc.) ==========
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE, MAX_ASSETS_CACHE_ENTRIES));
    return;
  }

  // ========== DEFAULT: Network with cache fallback ==========
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ============================================
// MESSAGE HANDLER
// ============================================

self.addEventListener("message", (event) => {
  const { type, urls } = event.data || {};

  if (type === "PRECACHE_IMAGES" && Array.isArray(urls)) {
    console.log(`[SW] Precaching ${urls.length} images...`);
    event.waitUntil(precacheImages(urls, event.source));
  }

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (type === "GET_CACHE_STATUS") {
    getCacheStatus().then((status) => {
      event.source.postMessage({
        type: "CACHE_STATUS",
        ...status,
      });
    });
  }

  if (type === "TRIM_CACHES") {
    event.waitUntil(
      Promise.all([
        trimCache(IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES),
        trimCache(API_DATA_CACHE, MAX_API_CACHE_ENTRIES),
        trimCache(ASSETS_CACHE, MAX_ASSETS_CACHE_ENTRIES),
        trimCache(AUDIO_CACHE, MAX_AUDIO_CACHE_ENTRIES),
      ]).then(() => {
        if (event.source) {
          event.source.postMessage({ type: "CACHES_TRIMMED" });
        }
      }),
    );
  }
});

// ============================================
// PRECACHING
// ============================================

async function precacheImages(urls, client) {
  const cache = await caches.open(IMAGES_CACHE);
  const total = urls.length;
  let done = 0;
  let failed = 0;

  // Check which URLs are already cached
  const uncachedUrls = [];
  for (const url of urls) {
    const cached = await cache.match(url);
    if (cached) {
      done++;
    } else {
      uncachedUrls.push(url);
    }
  }

  // Report initial progress
  if (client) {
    client.postMessage({
      type: "PRECACHE_PROGRESS",
      done,
      total,
      failed,
    });
  }

  // Download uncached images in batches
  const batchSize = 10;
  for (let i = 0; i < uncachedUrls.length; i += batchSize) {
    const batch = uncachedUrls.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const response = await fetch(url, { mode: "cors" });
          if (response.ok) {
            await cache.put(url, response);
            return true;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${url}`, error);
          throw error;
        }
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        done++;
      } else {
        done++;
        failed++;
      }
    }

    // Report progress
    if (client) {
      client.postMessage({
        type: "PRECACHE_PROGRESS",
        done,
        total,
        failed,
      });
    }
  }

  // Trim cache after bulk precaching
  await trimCache(IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES);

  // Report completion
  if (client) {
    client.postMessage({
      type: "PRECACHE_COMPLETE",
      success: done - failed,
      failed,
      total,
    });
  }

  console.log(`[SW] Precaching complete: ${done - failed} success, ${failed} failed`);
}

// ============================================
// CACHE STATUS
// ============================================

async function getCacheStatus() {
  const imageCache = await caches.open(IMAGES_CACHE);
  const imageKeys = await imageCache.keys();

  const assetsCache = await caches.open(ASSETS_CACHE);
  const assetsKeys = await assetsCache.keys();

  const apiCache = await caches.open(API_DATA_CACHE);
  const apiKeys = await apiCache.keys();

  const audioCache = await caches.open(AUDIO_CACHE);
  const audioKeys = await audioCache.keys();

  const appShellCache = await caches.open(APP_SHELL_CACHE);
  const appShellKeys = await appShellCache.keys();

  return {
    images: imageKeys.length,
    assets: assetsKeys.length,
    api: apiKeys.length,
    audio: audioKeys.length,
    appShell: appShellKeys.length,
    version: "v1",
    limits: {
      images: MAX_IMAGE_CACHE_ENTRIES,
      assets: MAX_ASSETS_CACHE_ENTRIES,
      api: MAX_API_CACHE_ENTRIES,
      audio: MAX_AUDIO_CACHE_ENTRIES,
    },
  };
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  let data = {
    title: "Pokémon Guide",
    body: "New update available!",
    url: "/",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    ...DEFAULT_NOTIFICATION,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

console.log("[SW] Service Worker loaded - PWA Offline Ready");
