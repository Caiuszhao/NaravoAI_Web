import { DEFAULT_GENERATE_API_BASE_URL } from './generateClient';

export type PromptApiRequest = {
  prompt: string;
};

export type PromptApiResponse = {
  ok: boolean;
  text?: string;
};

export type TtsApiRequest = {
  text: string;
  per?: number;
  spd?: number;
  pit?: number;
  vol?: number;
};

export type PromptTtsApiRequest = {
  prompt: string;
  /** 填则走复刻 clone/tts；与 `media_type` 等一并传给网关 */
  voice_id?: number;
  media_type?: string;
  per?: number;
  spd?: number;
  pit?: number;
  vol?: number;
};

type JsonErrorBody = {
  error_code?: string;
  message?: string;
  ok?: boolean;
  detail?: string;
  error?: string;
};

async function readHttpErrorDetail(response: Response, maxLen = 800): Promise<string> {
  try {
    const text = (await response.text()).trim();
    if (!text) return '';
    if (text.startsWith('{')) {
      try {
        const j = JSON.parse(text) as JsonErrorBody;
        const msg = j.detail ?? j.message ?? j.error ?? j.error_code;
        if (msg) return String(msg);
      } catch {
        // fall through to snippet
      }
    }
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  } catch {
    return '';
  }
}

function normalizeBase(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function isJsonContentType(contentType: string) {
  const ct = contentType.toLowerCase();
  return ct.includes('application/json') || ct.includes('text/json') || ct.includes('+json');
}

/**
 * POST /api/v1/prompt
 */
export async function postPrompt(
  body: PromptApiRequest,
  {
    baseUrl = DEFAULT_GENERATE_API_BASE_URL,
    signal,
  }: { baseUrl?: string; signal?: AbortSignal } = {}
): Promise<PromptApiResponse> {
  const url = `${normalizeBase(baseUrl)}/api/v1/prompt`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new Error(
      detail ? `Prompt API failed: ${response.status} — ${detail}` : `Prompt API failed: ${response.status}`
    );
  }

  const json = (await response.json()) as PromptApiResponse;
  if (!json.ok) {
    throw new Error('Prompt API returned ok=false');
  }
  return json;
}

/**
 * POST /api/v1/tts — 响应为 MP3 二进制（audio/mpeg），非 JSON。
 */
export async function postTts(
  body: TtsApiRequest,
  {
    baseUrl = DEFAULT_GENERATE_API_BASE_URL,
    signal,
  }: { baseUrl?: string; signal?: AbortSignal } = {}
): Promise<Blob> {
  const url = `${normalizeBase(baseUrl)}/api/v1/tts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new Error(
      detail ? `TTS API failed: ${response.status} — ${detail}` : `TTS API failed: ${response.status}`
    );
  }

  const ct = response.headers.get('content-type') ?? '';
  if (isJsonContentType(ct)) {
    const err = (await response.json()) as JsonErrorBody;
    throw new Error(err.error_code ?? err.message ?? 'tts_error');
  }

  return response.blob();
}

export type PromptTtsResponseMeta = {
  /** 服务端若通过响应头回传「用于 TTS 的模型输出」则填入（便于联调）。 */
  llmOutputText?: string;
  /** 服务端若回传可直链播放的音频 URL（自定义头或 Location）。 */
  responseAudioUrl?: string;
};

export type PromptTtsResult = {
  blob: Blob;
  meta: PromptTtsResponseMeta;
};

function firstHeader(headers: Headers, names: string[]): string | undefined {
  for (const name of names) {
    const raw = headers.get(name);
    if (raw != null) {
      const v = raw.trim();
      if (v !== '') return v;
    }
  }
  return undefined;
}

/**
 * POST /api/v1/prompt-tts — 正常为 MP3 二进制；模型输出为空等错误时为 JSON（如 error_code: llm_empty_output）。
 * 可选响应头（任填其一即可在测试页展示）：朗读文本 `X-Prompt-Tts-Text` / `X-LLM-Text` / `X-Generated-Text`；音频直链 `X-Prompt-Tts-Audio-Url` / `X-Audio-Url` / `Location`。
 */
export async function postPromptTts(
  body: PromptTtsApiRequest,
  {
    baseUrl = DEFAULT_GENERATE_API_BASE_URL,
    signal,
  }: { baseUrl?: string; signal?: AbortSignal } = {}
): Promise<PromptTtsResult> {
  const url = `${normalizeBase(baseUrl)}/api/v1/prompt-tts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    const hint =
      response.status === 502 || response.status === 503 || response.status === 504
        ? ' (gateway/upstream timeout or service unavailable — check server logs & proxy read_timeout)'
        : '';
    throw new Error(
      detail
        ? `prompt-tts API failed: ${response.status}${hint} — ${detail}`
        : `prompt-tts API failed: ${response.status}${hint}`
    );
  }

  const ct = response.headers.get('content-type') ?? '';
  if (isJsonContentType(ct)) {
    const err = (await response.json()) as JsonErrorBody;
    const code = err.error_code ?? 'prompt_tts_error';
    throw new Error(err.message ? `${code}: ${err.message}` : code);
  }

  const meta: PromptTtsResponseMeta = {
    llmOutputText: firstHeader(response.headers, [
      'x-prompt-tts-text',
      'x-llm-text',
      'x-generated-text',
      'x-naravo-llm-text',
    ]),
    responseAudioUrl: firstHeader(response.headers, [
      'x-prompt-tts-audio-url',
      'x-audio-url',
      'x-tts-audio-url',
      'location',
    ]),
  };

  const blob = await response.blob();
  return { blob, meta };
}

/** 从 Blob 生成可播放 URL，调用方负责 URL.revokeObjectURL。 */
export function createMp3ObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
