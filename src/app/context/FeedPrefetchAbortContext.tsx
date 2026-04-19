import { createContext, useContext, type ReactNode } from 'react';

const FeedPrefetchAbortContext = createContext<AbortSignal | undefined>(undefined);

export function FeedPrefetchAbortProvider({
  signal,
  children,
}: {
  signal: AbortSignal;
  children: ReactNode;
}) {
  return <FeedPrefetchAbortContext.Provider value={signal}>{children}</FeedPrefetchAbortContext.Provider>;
}

/** Aborted whenever the vertical-feed `activeDemoIdx` changes (preempt cross-demo media prefetch). */
export function useFeedPrefetchAbortSignal(): AbortSignal | undefined {
  return useContext(FeedPrefetchAbortContext);
}
