const CACHE_NAME = "naravo-story-video-v1";
const DB_NAME = "naravo-story-video-db";
const DB_STORE = "video-blobs";
const DEFAULT_OBJECT_URL_TTL_MS = 30 * 60 * 1000;
const OBJECT_URL_CACHE_CLEANUP_THROTTLE_MS = 30 * 1000;

type MediaKind = "video" | "audio";
type ObjectUrlCacheEntry = {
  objectUrl: string;
  expiresAt: number;
};

const sessionObjectUrlCache = new Map<string, ObjectUrlCacheEntry>();
let lastObjectUrlCleanupAt = 0;

function getContentType(kind: MediaKind) {
  return kind === "audio" ? "audio/mpeg" : "video/mp4";
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function idbGet(key: string) {
  const db = await openDb();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error ?? new Error("Failed to read IndexedDB"));
    tx.oncomplete = () => db.close();
  });
}

async function idbPut(key: string, blob: Blob) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("Failed to write IndexedDB"));
    tx.oncomplete = () => db.close();
  });
}

function isPartialResponse(response: Response) {
  return response.status === 206 || Boolean(response.headers.get("content-range"));
}

function cleanupExpiredObjectUrls(now = Date.now()) {
  if (now - lastObjectUrlCleanupAt < OBJECT_URL_CACHE_CLEANUP_THROTTLE_MS) return;
  lastObjectUrlCleanupAt = now;

  for (const [cacheKey, entry] of sessionObjectUrlCache.entries()) {
    if (entry.expiresAt > now) continue;
    try {
      URL.revokeObjectURL(entry.objectUrl);
    } catch {
      // ignore revoke failures
    }
    sessionObjectUrlCache.delete(cacheKey);
  }
}

function getObjectUrlCacheKey(kind: MediaKind, url: string) {
  return `${kind}:${url}`;
}

export async function resolveCachedMediaUrl(
  url: string,
  {
    kind = "video",
    signal,
    cacheToObjectUrl = true,
    objectUrlTtlMs = DEFAULT_OBJECT_URL_TTL_MS
  }: {
    kind?: MediaKind;
    signal?: AbortSignal;
    cacheToObjectUrl?: boolean;
    objectUrlTtlMs?: number;
  } = {}
) {
  if (typeof window === "undefined") return url;
  if (!cacheToObjectUrl) return url;
  const now = Date.now();
  cleanupExpiredObjectUrls(now);

  const cacheKey = getObjectUrlCacheKey(kind, url);
  const cachedObjectUrlEntry = sessionObjectUrlCache.get(cacheKey);
  if (cachedObjectUrlEntry && cachedObjectUrlEntry.expiresAt > now) {
    return cachedObjectUrlEntry.objectUrl;
  }

  const requestInit: RequestInit = {
    mode: "cors",
    credentials: "omit",
    signal,
    headers: {
      "Content-Type": getContentType(kind)
    }
  };

  try {
    let blob: Blob | null = null;

    if ("caches" in window && window.isSecureContext) {
      const cache = await window.caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        if (isPartialResponse(cached)) {
          await cache.delete(url);
        } else {
          blob = await cached.blob();
          void idbPut(url, blob).catch(() => undefined);
        }
      }

      if (!blob) {
        const fromIdb = await idbGet(url).catch(() => null);
        if (fromIdb) {
          blob = fromIdb;
        } else {
          const resp = await fetch(url, requestInit);
          if (!resp.ok) throw new Error(`Failed to fetch media: ${resp.status}`);
          if (isPartialResponse(resp)) throw new Error("Partial response");
          await cache.put(url, resp.clone());
          blob = await resp.blob();
          void idbPut(url, blob).catch(() => undefined);
        }
      }
    } else {
      const fromIdb = await idbGet(url).catch(() => null);
      if (fromIdb) {
        blob = fromIdb;
      } else {
        const resp = await fetch(url, requestInit);
        if (!resp.ok) throw new Error(`Failed to fetch media: ${resp.status}`);
        if (isPartialResponse(resp)) throw new Error("Partial response");
        blob = await resp.blob();
        void idbPut(url, blob).catch(() => undefined);
      }
    }

    if (!blob) return url;
    const objectUrl = URL.createObjectURL(blob);
    const previousEntry = sessionObjectUrlCache.get(cacheKey);
    if (previousEntry && previousEntry.objectUrl !== objectUrl) {
      try {
        URL.revokeObjectURL(previousEntry.objectUrl);
      } catch {
        // ignore revoke failures
      }
    }
    sessionObjectUrlCache.set(cacheKey, {
      objectUrl,
      expiresAt: Date.now() + Math.max(5_000, objectUrlTtlMs)
    });
    return objectUrl;
  } catch {
    return url;
  }
}

/** Warm decoder / buffer for a URL so swapping a visible <video src> is less likely to black-frame. */
export function warmupVideoUrl(
  src: string,
  { timeoutMs = 14000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<void> {
  if (typeof window === "undefined" || !src) return Promise.resolve();

  return new Promise(resolve => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener("canplaythrough", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onReady);
      window.clearTimeout(tid);
      signal?.removeEventListener("abort", onAbort);
      v.removeAttribute("src");
      v.load();
      resolve();
    };

    const onReady = () => finish();
    const onAbort = () => finish();

    v.addEventListener("canplaythrough", onReady);
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("error", onReady);
    const tid = window.setTimeout(finish, timeoutMs);
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    v.src = src;
    v.load();
  });
}
