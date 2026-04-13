import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type DemoDebugLogEntry = {
  id: string;
  ts: number;
  kind: 'api_request' | 'api_response' | 'api_error' | 'video_branch';
  title: string;
  body: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type DemoDebugContextValue = {
  entries: DemoDebugLogEntry[];
  push: (entry: Omit<DemoDebugLogEntry, 'id' | 'ts'> & { id?: string }) => void;
  clear: () => void;
};

const DemoDebugContext = createContext<DemoDebugContextValue | null>(null);

const MAX_ENTRIES = 400;

export function DemoDebugProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DemoDebugLogEntry[]>([]);

  const push = useCallback((entry: Omit<DemoDebugLogEntry, 'id' | 'ts'> & { id?: string }) => {
    const full: DemoDebugLogEntry = {
      id: entry.id ?? makeId(),
      ts: Date.now(),
      kind: entry.kind,
      title: entry.title,
      body: entry.body,
    };
    setEntries((prev) => [...prev, full].slice(-MAX_ENTRIES));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(() => ({ entries, push, clear }), [entries, push, clear]);

  return <DemoDebugContext.Provider value={value}>{children}</DemoDebugContext.Provider>;
}

export function useDemoDebug() {
  const ctx = useContext(DemoDebugContext);
  return (
    ctx ?? {
      entries: [] as DemoDebugLogEntry[],
      push: () => {},
      clear: () => {},
    }
  );
}
