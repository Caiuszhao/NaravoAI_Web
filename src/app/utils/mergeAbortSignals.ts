/** Abort when any input signal aborts (fallback if AbortSignal.any is unavailable). */
export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  if (signals.length === 1) return signals[0];
  const ctor = typeof AbortSignal !== 'undefined' ? AbortSignal : undefined;
  const anyFn =
    ctor && 'any' in ctor && typeof (ctor as unknown as { any: (s: AbortSignal[]) => AbortSignal }).any === 'function'
      ? (ctor as unknown as { any: (s: AbortSignal[]) => AbortSignal }).any
      : undefined;
  if (anyFn) {
    try {
      return anyFn(signals);
    } catch {
      // fall through
    }
  }
  const merged = new AbortController();
  const forward = () => merged.abort();
  for (const s of signals) {
    if (s.aborted) {
      forward();
      return merged.signal;
    }
    s.addEventListener('abort', forward, { once: true });
  }
  return merged.signal;
}
