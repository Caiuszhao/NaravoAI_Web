import { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { generateText } from '../utils/generateClient';

export function GenerateApiTestDialog({
  defaultOpen = true,
  baseUrl = 'http://localhost:8000',
}: {
  defaultOpen?: boolean;
  baseUrl?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState('写一段产品介绍文案，主题：Narovo');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const endpointLabel = useMemo(() => `${baseUrl.replace(/\/+$/, '')}/api/v1/generate`, [baseUrl]);

  const run = async () => {
    const payload = text.trim();
    if (!payload) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    try {
      const res = await generateText({ text: payload }, { baseUrl, signal: controller.signal });
      setOutput((res.output_text ?? '').trim());
    } catch (e) {
      setOutput('');
      console.warn('[generate-test] request failed', e);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0b0b0b] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Generate API Test</DialogTitle>
          <DialogDescription className="text-white/50">
            {endpointLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-24 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
            placeholder='{"text":"..."}'
          />
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">output_text</div>
            <pre className="whitespace-pre-wrap break-words text-[12px] text-white/80 leading-relaxed">
              {output || '(empty)'}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 px-4 rounded-md border border-white/10 bg-transparent text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={isLoading}
            className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating…' : 'Generate'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

