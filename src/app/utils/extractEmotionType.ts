/** Parse emotion_type 1..5 from `/api/v1/generate` JSON (or nested shapes). */
export function extractEmotionType(payload: unknown): 1 | 2 | 3 | 4 | 5 | null {
  const asAny = payload as any;
  const direct = Number(asAny?.emotion_type);
  if (Number.isFinite(direct) && direct >= 1 && direct <= 5) return direct as 1 | 2 | 3 | 4 | 5;

  const raw = Number(asAny?.raw?.emotion_type);
  if (Number.isFinite(raw) && raw >= 1 && raw <= 5) return raw as 1 | 2 | 3 | 4 | 5;

  const outputText = asAny?.output_text;
  if (typeof outputText === 'string') {
    const t = outputText.trim();
    if (t.startsWith('{') && t.endsWith('}')) {
      try {
        const parsed = JSON.parse(t);
        const parsedEmotion = Number((parsed as any)?.emotion_type);
        if (Number.isFinite(parsedEmotion) && parsedEmotion >= 1 && parsedEmotion <= 5) {
          return parsedEmotion as 1 | 2 | 3 | 4 | 5;
        }
      } catch {
        // ignore
      }
    }
    const match = t.match(/emotion_type\D*([1-5])/i);
    if (match) return Number(match[1]) as 1 | 2 | 3 | 4 | 5;
  }

  return null;
}
