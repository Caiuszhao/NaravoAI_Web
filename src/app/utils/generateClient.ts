export type GenerateRequest = {
  text: string;
};

export type GenerateResponse = {
  ok: boolean;
  provider?: string;
  model?: string;
  output_text?: string;
  raw?: unknown;
};

/** 线上（生产）网关 */
export const DEFAULT_GENERATE_API_BASE_URL = 'https://101.42.45.113:8000';

/** 本地测试网关 */
// Use same-origin `/api/...` in dev to avoid mobile HTTPS mixed-content,
// CORS preflight issues, and backend self-signed cert problems.
export const LOCAL_GENERATE_API_BASE_URL = '';

export async function generateText(
  input: GenerateRequest,
  {
    baseUrl = DEFAULT_GENERATE_API_BASE_URL,
    signal,
  }: {
    baseUrl?: string;
    signal?: AbortSignal;
  } = {}
) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Generate API failed: ${response.status}`);
  }

  const json = (await response.json()) as GenerateResponse;
  if (!json.ok) {
    throw new Error('Generate API returned ok=false');
  }

  return json;
}

