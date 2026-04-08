const CACHE_NAME = 'naravo-story-video-v1';
const DB_NAME = 'naravo-story-video-db';
const DB_STORE = 'video-blobs';

type MediaKind = 'video' | 'audio';

function getContentType(kind: MediaKind) {
  return kind === 'audio' ? 'audio/mpeg' : 'video/mp4';
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
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function idbGet(key: string) {
  const db = await openDb();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error ?? new Error('Failed to read IndexedDB'));
    tx.oncomplete = () => db.close();
  });
}

async function idbPut(key: string, blob: Blob) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const req = store.put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to write IndexedDB'));
    tx.oncomplete = () => db.close();
  });
}

function isPartialResponse(response: Response) {
  return response.status === 206 || Boolean(response.headers.get('content-range'));
}

export async function resolveCachedMediaUrl(
  url: string,
  {
    kind = 'video',
    signal,
    cacheToObjectUrl = true,
  }: {
    kind?: MediaKind;
    signal?: AbortSignal;
    cacheToObjectUrl?: boolean;
  } = {}
) {
  if (typeof window === 'undefined') return url;
  if (!cacheToObjectUrl) return url;

  const requestInit: RequestInit = {
    mode: 'cors',
    credentials: 'omit',
    signal,
    headers: {
      'Content-Type': getContentType(kind),
    },
  };

  try {
    let blob: Blob | null = null;

    if ('caches' in window && window.isSecureContext) {
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
          if (isPartialResponse(resp)) throw new Error('Partial response');
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
        if (isPartialResponse(resp)) throw new Error('Partial response');
        blob = await resp.blob();
        void idbPut(url, blob).catch(() => undefined);
      }
    }

    if (!blob) return url;
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

