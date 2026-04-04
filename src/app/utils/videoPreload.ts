type PreloadPlan = {
  priority: string[];
  background: string[];
};

// Must match `VIDEO_CACHE_NAME` in `DemoFeed.tsx` so home preload hits the same Cache Storage.
const CACHE_NAME = 'naravo-story-video-v1';

function shouldSkipPreload() {
  const connection = (navigator as any).connection as { saveData?: boolean; effectiveType?: string } | undefined;
  if (connection?.saveData) return true;
  return false;
}

function createVideoWarmup(src: string) {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = src;
  video.load();
  return video;
}

async function tryPersistStorage() {
  try {
    if (!navigator.storage?.persist) return;
    await navigator.storage.persist();
  } catch {
    // Best-effort only.
  }
}

async function cacheHas(cache: Cache, url: string) {
  const match = await cache.match(url, { ignoreVary: true, ignoreSearch: false });
  return Boolean(match);
}

async function cachePutUrl(cache: Cache, url: string, signal: AbortSignal) {
  if (await cacheHas(cache, url)) return;

  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'force-cache',
    redirect: 'follow',
    headers: {
      'Content-Type': 'video/mp4',
    },
    signal,
  });

  // Opaque responses (no-cors) can't be reliably validated; still allow caching if present.
  if (!response.ok && response.type !== 'opaque') {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  await cache.put(url, response);
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  const queue = items.slice();
  const running = new Set<Promise<void>>();

  const launchNext = () => {
    const next = queue.shift();
    if (!next) return;
    const p = worker(next).finally(() => running.delete(p));
    running.add(p);
  };

  while (queue.length > 0 && running.size < concurrency) {
    launchNext();
  }

  while (queue.length > 0) {
    await Promise.race(running);
    while (queue.length > 0 && running.size < concurrency) {
      launchNext();
    }
  }

  await Promise.allSettled(Array.from(running));
}

export function preloadVideosWithCache(plan: PreloadPlan) {
  if (typeof window === 'undefined') return () => undefined;
  if (shouldSkipPreload()) return () => undefined;

  const controller = new AbortController();

  // Priority convention:
  // priority[0] = index_1 (intro), priority[1] = index_2 (loop),
  // remaining = branches.
  const uniquePriority = Array.from(new Set(plan.priority.filter(Boolean)));
  const uniqueBackground = Array.from(new Set(plan.background.filter(Boolean)));

  const stage1 = uniquePriority.slice(0, 1); // index_1
  const stage2 = uniquePriority.slice(1, 2); // index_2
  const stage3 = uniquePriority.slice(2); // branches (priority remainder)
  const stage3Background = uniqueBackground; // background remainder

  const createdVideos: HTMLVideoElement[] = [];

  const warmupWithLoadedData = (url: string) => {
    const video = createVideoWarmup(url);
    createdVideos.push(video);

    // `loadeddata` is a good signal that the first media payload is available.
    // We don't block forever on remote servers.
    return new Promise<void>((resolve) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve(); // Don't block the pipeline on errors.
      };
      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', onError);

      // Fallback timeout.
      window.setTimeout(() => {
        cleanup();
        resolve();
      }, 15000);
    });
  };

  const warmupOnly = (url: string) => {
    const video = createVideoWarmup(url);
    createdVideos.push(video);
  };

  const startCacheJobs = async (urls: string[]) => {
    if (!('caches' in window)) return;
    await tryPersistStorage();

    const cache = await caches.open(CACHE_NAME);
    await runWithConcurrency(urls, 2, (u) =>
      cachePutUrl(cache, u, controller.signal).catch(() => undefined)
    );
  };

  void (async () => {
    // 1) Stage 1: index_1 (wait until loadeddata/timeout)
    if (stage1.length > 0) {
      // Warm up media pipeline.
      await warmupWithLoadedData(stage1[0]);

      // Also try to cache it.
      await startCacheJobs(stage1);
    }

    // 2) Stage 2: index_2
    if (stage2.length > 0) {
      for (const url of stage2) warmupOnly(url);
      // 确保 index_2 实际写入缓存完成后，再开始分支预加载
      await startCacheJobs(stage2);
    }

    // 3) Stage 3: branches (priority remainder + background)
    const stage3All = Array.from(new Set([...stage3, ...stage3Background])).filter(Boolean);
    for (const url of stage3All) warmupOnly(url);
    await startCacheJobs(stage3All);
  })();

  return () => {
    controller.abort();
    for (const video of createdVideos) {
      video.removeAttribute('src');
      video.load();
    }
  };
}

