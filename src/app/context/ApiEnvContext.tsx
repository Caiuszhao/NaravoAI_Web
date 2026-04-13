import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { appRuntimeConfig } from '../config/app.config';
import { DEFAULT_GENERATE_API_BASE_URL, LOCAL_GENERATE_API_BASE_URL } from '../utils/generateClient';

/** v2：与旧 key 脱钩，便于默认切到线上后仍可用「测」持久化本机环境。 */
const STORAGE_KEY = 'naravo_api_env_v2';

export type ApiEnvMode = 'test' | 'production';

type ApiEnvContextValue = {
  mode: ApiEnvMode;
  setMode: (mode: ApiEnvMode) => void;
  baseUrl: string;
};

const ApiEnvContext = createContext<ApiEnvContextValue | null>(null);

function readStoredMode(): ApiEnvMode {
  const fallback = appRuntimeConfig.defaultApiEnvironment;
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'test' || raw === 'production') return raw;
    return fallback;
  } catch {
    return fallback;
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
    const mode = appRuntimeConfig.defaultApiEnvironment;
    return {
      mode,
      setMode: () => {},
      baseUrl: mode === 'test' ? LOCAL_GENERATE_API_BASE_URL : DEFAULT_GENERATE_API_BASE_URL,
    };
  }
  return ctx;
}
