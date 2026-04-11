import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_GENERATE_API_BASE_URL, LOCAL_GENERATE_API_BASE_URL } from '../utils/generateClient';

const STORAGE_KEY = 'naravo_api_env';

export type ApiEnvMode = 'test' | 'production';

type ApiEnvContextValue = {
  mode: ApiEnvMode;
  setMode: (mode: ApiEnvMode) => void;
  baseUrl: string;
};

const ApiEnvContext = createContext<ApiEnvContextValue | null>(null);

function readStoredMode(): ApiEnvMode {
  if (typeof window === 'undefined') return 'production';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'test' ? 'test' : 'production';
  } catch {
    return 'production';
  }
}

export function ApiEnvProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ApiEnvMode>(() => readStoredMode());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  const setMode = useCallback((next: ApiEnvMode) => {
    setModeState(next);
  }, []);

  const baseUrl = mode === 'test' ? LOCAL_GENERATE_API_BASE_URL : DEFAULT_GENERATE_API_BASE_URL;

  const value = useMemo(() => ({ mode, setMode, baseUrl }), [mode, setMode, baseUrl]);

  return <ApiEnvContext.Provider value={value}>{children}</ApiEnvContext.Provider>;
}

export function useApiEnv() {
  const ctx = useContext(ApiEnvContext);
  if (!ctx) {
    return {
      mode: 'production' as ApiEnvMode,
      setMode: () => {},
      baseUrl: DEFAULT_GENERATE_API_BASE_URL,
    };
  }
  return ctx;
}
