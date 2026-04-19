import { DEFAULT_GENERATE_API_BASE_URL } from './generateClient';

export type BaiduShortAsrRequest = {
  format: 'wav' | string;
  rate: 16000 | number;
  channel: 1 | number;
  cuid: string;
  dev_pid: number;
  speech: string; // base64 wav bytes
  len: number; // wav bytes length
};

export type VoiceInputGenerateRequest = BaiduShortAsrRequest & {
  provider?: string;
  model?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  extra?: unknown;
};

type JsonErrorBody = {
  error_code?: string;
  message?: unknown;
  ok?: boolean;
  detail?: unknown;
  error?: unknown;
};

function normalizeBase(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

async function readHttpErrorDetail(response: Response, maxLen = 800): Promise<string> {
  try {
    const text = (await response.text()).trim();
    if (!text) return '';
    if (text.startsWith('{')) {
      try {
        const j = JSON.parse(text) as JsonErrorBody;
        const msg = j.detail ?? j.message ?? j.error ?? j.error_code;
        if (typeof msg === 'string') return msg;
        if (typeof msg === 'number' || typeof msg === 'boolean') return String(msg);
        if (msg) {
          try {
            return JSON.stringify(msg);
          } catch {
            return String(msg);
          }
        }
      } catch {
        // fall through to snippet
      }
    }
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  } catch {
    return '';
  }
}

export async function postAsrVoiceInputGenerate(
  body: VoiceInputGenerateRequest,
  {
    baseUrl = DEFAULT_GENERATE_API_BASE_URL,
    signal,
  }: { baseUrl?: string; signal?: AbortSignal } = {}
): Promise<unknown> {
  const url = `${normalizeBase(baseUrl)}/api/v1/asr/voice-input-generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new Error(
      detail
        ? `voice-input-generate API failed: ${response.status} — ${detail}`
        : `voice-input-generate API failed: ${response.status}`
    );
  }
  return await response.json();
}

export function extractAsrText(payload: unknown): string | null {
  const a = payload as any;
  const direct =
    a?.asr_text ??
    a?.asrText ??
    a?.recognized_text ??
    a?.recognizedText ??
    a?.transcript ??
    a?.text ??
    a?.result_text;

  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const resultArr = a?.result ?? a?.asr_result;
  if (Array.isArray(resultArr) && typeof resultArr[0] === 'string' && resultArr[0].trim()) return resultArr[0].trim();
  return null;
}

/** Optional HTTP/blob audio URL if the ASR (or chained TTS) response exposes one — for debug panels. */
export function extractAsrAudioUrl(payload: unknown): string | null {
  const a = payload as any;
  const candidates = [
    a?.audio_url,
    a?.audioUrl,
    a?.tts_url,
    a?.ttsUrl,
    a?.voice_url,
    a?.speech_url,
    a?.output_audio_url,
    a?.outputAudioUrl,
    a?.data?.audio_url,
    a?.data?.tts_url,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}
