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

const DEFAULT_BASE_URL = 'http://localhost:8000';

export async function generateText(
  input: GenerateRequest,
  {
    baseUrl = DEFAULT_BASE_URL,
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

