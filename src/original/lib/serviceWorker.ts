/**
 * Service Worker Registration and Communication Utility
 * Handles SW registration, updates, and image precaching via postMessage
 */

type ProgressCallback = (done: number, total: number, failed: number) => void;
type UpdateCallback = () => void;

let swRegistration: ServiceWorkerRegistration | null = null;
let onUpdateAvailable: UpdateCallback | null = null;

/**
 * Register the Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[SW Client] Service Workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    swRegistration = registration;
    console.log("[SW Client] Service Worker registered:", registration.scope);

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[SW Client] New version available");
            onUpdateAvailable?.();
          }
        });
      }
    });

    // Reload on controller change (after update)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        console.log("[SW Client] Controller changed, reloading...");
        window.location.reload();
      }
    });

    return registration;
  } catch (error) {
    console.error("[SW Client] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Set callback for when a new SW version is available
 */
export function onSWUpdateAvailable(callback: UpdateCallback): void {
  onUpdateAvailable = callback;
}

/**
 * Skip waiting and activate new Service Worker
 */
export function skipWaiting(): void {
  const waiting = swRegistration?.waiting;

  if (waiting) {
    waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

/**
 * Precache images via Service Worker
 * Returns a promise that resolves when precaching is complete
 */
export function precacheImages(
  urls: string[],
  onProgress?: ProgressCallback,
): Promise<{ success: number; failed: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      // SW not active yet, fall back to direct caching
      console.log("[SW Client] No active SW, using fallback caching");
      fallbackCacheImages(urls, onProgress).then(resolve).catch(reject);
      return;
    }

    // Set up message listener for progress updates
    const messageHandler = (event: MessageEvent) => {
      const { type, done, total, failed, success } = event.data || {};

      if (type === "PRECACHE_PROGRESS") {
        onProgress?.(done, total, failed);
      }

      if (type === "PRECACHE_COMPLETE") {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        resolve({ success, failed });
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);

    // Send precache request to SW
    navigator.serviceWorker.controller.postMessage({
      type: "PRECACHE_IMAGES",
      urls,
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        reject(new Error("Precaching timeout"));
      },
      5 * 60 * 1000,
    );
  });
}

/**
 * Fallback: Cache images directly using Cache API
 * Used when Service Worker is not yet active
 */
async function fallbackCacheImages(
  urls: string[],
  onProgress?: ProgressCallback,
): Promise<{ success: number; failed: number }> {
  const cacheName = "images-v1";
  const cache = await caches.open(cacheName);

  let success = 0;
  let failed = 0;
  const total = urls.length;

  // Check already cached
  const uncachedUrls: string[] = [];
  for (const url of urls) {
    const cached = await cache.match(url);
    if (cached) {
      success++;
    } else {
      uncachedUrls.push(url);
    }
  }

  onProgress?.(success, total, failed);

  // Download in batches
  const batchSize = 10;
  for (let i = 0; i < uncachedUrls.length; i += batchSize) {
    const batch = uncachedUrls.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          await cache.put(url, response);
          return true;
        }
        throw new Error(`HTTP ${response.status}`);
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    onProgress?.(success + failed, total, failed);
  }

  return { success, failed };
}

/**
 * Get cache status from Service Worker
 */
export async function getCacheStatus(): Promise<{
  images: number;
  static: number;
  version: string;
} | null> {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS") {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        resolve({
          images: event.data.images,
          static: event.data.static,
          version: event.data.version,
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);
    navigator.serviceWorker.controller.postMessage({ type: "GET_CACHE_STATUS" });

    // Timeout after 5 seconds
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", messageHandler);
      resolve(null);
    }, 5000);
  });
}

/**
 * Clear all caches managed by the app
 */
export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter(
        (name) =>
          name.startsWith("static-") ||
          name.startsWith("images-") ||
          name.startsWith("api-") ||
          name.startsWith("pokemon-"),
      )
      .map((name) => caches.delete(name)),
  );

  console.log("[SW Client] All caches cleared");
}

/**
 * Check if notifications are supported
 */
export function notificationsSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificationsSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("[SW Client] Failed to request notification permission:", error);
    return "denied";
  }
}

/**
 * Show a local notification (for testing or manual triggers)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions,
): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
    return true;
  } catch (error) {
    console.error("[SW Client] Failed to show notification:", error);
    return false;
  }
}
