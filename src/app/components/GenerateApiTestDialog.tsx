import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { generateText } from '../utils/generateClient';
import {
  createMp3ObjectUrl,
  postPrompt,
  postPromptTts,
  postTts,
} from '../utils/promptTtsClient';
import { buildPromptTtsFullPrompt } from '../utils/demo3NarrationPrompt';
import { DEMO3_FIXED_TEST_REPLY } from '../utils/demo3BranchTest';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useApiEnv } from '../context/ApiEnvContext';

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type TestTab = 'generate' | 'prompt' | 'tts' | 'promptTts';

const TABS: { id: TestTab; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'prompt', label: 'Prompt' },
  { id: 'tts', label: 'TTS' },
  { id: 'promptTts', label: 'Prompt+TTS' },
];

export function GenerateApiTestDialog({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<TestTab>('generate');
  const { mode, setMode, baseUrl } = useApiEnv();

  const [generateTextValue, setGenerateTextValue] = useState('写一段产品介绍文案，主题：Narovo');
  const [promptValue, setPromptValue] = useState('写一句欢迎语');
  const [ttsTextValue, setTtsTextValue] = useState('你好，欢迎来到 Narovo。');
  const [promptTtsPrompt, setPromptTtsPrompt] = useState(DEMO3_FIXED_TEST_REPLY);

  const [per, setPer] = useState(0);
  const [spd, setSpd] = useState(5);
  const [pit, setPit] = useState(5);
  const [vol, setVol] = useState(5);

  const [textOutput, setTextOutput] = useState('');
  const [loading, setLoading] = useState<TestTab | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { push: pushDebug } = useDemoDebug();

  const base = useMemo(() => baseUrl.replace(/\/+$/, ''), [baseUrl]);

  const endpointLabel = useMemo(() => {
    switch (tab) {
      case 'generate':
        return `${base}/api/v1/generate`;
      case 'prompt':
        return `${base}/api/v1/prompt`;
      case 'tts':
        return `${base}/api/v1/tts`;
      case 'promptTts':
        return `${base}/api/v1/prompt-tts`;
      default:
        return base;
    }
  }, [base, tab]);

  const revokeAudio = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => revokeAudio(audioUrl);
  }, [audioUrl, revokeAudio]);

  const setNextAudioBlob = useCallback(
    (blob: Blob) => {
      setAudioUrl((prev) => {
        revokeAudio(prev);
        return createMp3ObjectUrl(blob);
      });
    },
    [revokeAudio]
  );

  const runGenerate = async () => {
    const payload = generateTextValue.trim();
    if (!payload) return;
    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/generate (test dialog)',
      body: safeJson({ text: payload }),
    });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading('generate');
    try {
      const res = await generateText({ text: payload }, { baseUrl, signal: controller.signal });
      setTextOutput((res.output_text ?? '').trim());
      pushDebug({
        kind: 'api_response',
        title: 'Generate OK (test dialog)',
        body: safeJson(res),
      });
    } catch (e) {
      setTextOutput('');
      console.warn('[generate-test] request failed', e);
      pushDebug({
        kind: 'api_error',
        title: 'Generate failed (test dialog)',
        body: e instanceof Error ? e.message : safeJson(e),
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(null);
    }
  };

  const runPrompt = async () => {
    const payload = promptValue.trim();
    if (!payload) return;
    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/prompt (test dialog)',
      body: safeJson({ prompt: payload }),
    });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading('prompt');
    try {
      const res = await postPrompt({ prompt: payload }, { baseUrl, signal: controller.signal });
      setTextOutput((res.text ?? '').trim());
      pushDebug({
        kind: 'api_response',
        title: 'Prompt OK (test dialog)',
        body: safeJson(res),
      });
    } catch (e) {
      setTextOutput('');
      pushDebug({
        kind: 'api_error',
        title: 'Prompt failed (test dialog)',
        body: e instanceof Error ? e.message : safeJson(e),
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(null);
    }
  };

  const runTts = async () => {
    const payload = ttsTextValue.trim();
    if (!payload) return;
    const body = { text: payload, per, spd, pit, vol };
    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/tts (test dialog)',
      body: safeJson(body),
    });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading('tts');
    try {
      const blob = await postTts(body, { baseUrl, signal: controller.signal });
      setTextOutput(`MP3 received (${blob.size} bytes, ${blob.type || 'audio/mpeg'})`);
      setNextAudioBlob(blob);
      pushDebug({
        kind: 'api_response',
        title: 'TTS OK (test dialog)',
        body: `audio/mpeg blob: ${blob.size} bytes`,
      });
    } catch (e) {
      setTextOutput('');
      pushDebug({
        kind: 'api_error',
        title: 'TTS failed (test dialog)',
        body: e instanceof Error ? e.message : safeJson(e),
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(null);
    }
  };

  const runPromptTts = async () => {
    const payload = buildPromptTtsFullPrompt(promptTtsPrompt);

    const body = { prompt: payload, per, spd, pit, vol };
    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/prompt-tts (test dialog)',
      body: safeJson(body),
    });
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading('promptTts');
    try {
      const blob = await postPromptTts(body, { baseUrl, signal: controller.signal });
      setTextOutput(`MP3 received (${blob.size} bytes, ${blob.type || 'audio/mpeg'})`);
      setNextAudioBlob(blob);
      pushDebug({
        kind: 'api_response',
        title: 'prompt-tts OK (test dialog)',
        body: `audio/mpeg blob: ${blob.size} bytes`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : safeJson(e);
      setTextOutput(
        /502|503|504/.test(msg)
          ? [
              '网关或上游返回 502/503/504：多为反向代理超时、后端进程崩溃或 LLM+TTS 链路耗时过长。',
              '请在本机确认：1) 8000 服务与 /api/v1/prompt-tts 是否正常；2) nginx/Caddy 等 proxy_read_timeout；3) 服务端日志。',
              '',
              msg,
            ].join('\n')
          : msg
      );
      pushDebug({
        kind: 'api_error',
        title: 'prompt-tts failed (test dialog)',
        body: msg,
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#0b0b0b] border border-white/10 text-white max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Test</DialogTitle>
          <DialogDescription className="text-white/50 break-all">{endpointLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-[11px] text-white/55 uppercase tracking-wider">环境</span>
          <div className="flex rounded-md border border-white/15 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('test')}
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                mode === 'test' ? 'bg-white text-black' : 'bg-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              测试
            </button>
            <button
              type="button"
              onClick={() => setMode('production')}
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                mode === 'production' ? 'bg-white text-black' : 'bg-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              线上
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/40 -mt-1 break-all">Base: {baseUrl}</p>

        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                tab === t.id ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {tab === 'generate' && (
            <textarea
              value={generateTextValue}
              onChange={(e) => setGenerateTextValue(e.target.value)}
              className="w-full min-h-24 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
              placeholder="generate: text field"
            />
          )}

          {tab === 'prompt' && (
            <textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="w-full min-h-24 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
              placeholder="prompt"
            />
          )}

          {tab === 'tts' && (
            <>
              <textarea
                value={ttsTextValue}
                onChange={(e) => setTtsTextValue(e.target.value)}
                className="w-full min-h-20 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
                placeholder="text for TTS"
              />
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <label className="grid gap-1">
                  <span className="text-white/45">per</span>
                  <input
                    type="number"
                    value={per}
                    onChange={(e) => setPer(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">spd</span>
                  <input
                    type="number"
                    value={spd}
                    onChange={(e) => setSpd(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">pit</span>
                  <input
                    type="number"
                    value={pit}
                    onChange={(e) => setPit(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">vol</span>
                  <input
                    type="number"
                    value={vol}
                    onChange={(e) => setVol(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
              </div>
            </>
          )}

          {tab === 'promptTts' && (
            <>
              <p className="text-[10px] text-white/45 leading-relaxed">
                下方为观众/用户回复；请求时会自动在前面拼接固定太空场景背景词。
              </p>
              <textarea
                value={promptTtsPrompt}
                onChange={(e) => setPromptTtsPrompt(e.target.value)}
                className="w-full min-h-20 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
                placeholder="Viewer reply to the astronaut (leave empty to simulate no response)"
              />
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <label className="grid gap-1">
                  <span className="text-white/45">per</span>
                  <input
                    type="number"
                    value={per}
                    onChange={(e) => setPer(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">spd</span>
                  <input
                    type="number"
                    value={spd}
                    onChange={(e) => setSpd(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">pit</span>
                  <input
                    type="number"
                    value={pit}
                    onChange={(e) => setPit(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-white/45">vol</span>
                  <input
                    type="number"
                    value={vol}
                    onChange={(e) => setVol(Number(e.target.value))}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                  />
                </label>
              </div>
            </>
          )}

          {(tab === 'tts' || tab === 'promptTts') && audioUrl && (
            <div className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">audio preview</div>
              <audio controls className="w-full h-9" src={audioUrl} />
            </div>
          )}

          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">
              {tab === 'generate' || tab === 'prompt' ? 'output' : 'result'}
            </div>
            <pre className="whitespace-pre-wrap break-words text-[12px] text-white/80 leading-relaxed">
              {textOutput || '(empty)'}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 px-4 rounded-md border border-white/10 bg-transparent text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          {tab === 'generate' && (
            <button
              type="button"
              onClick={() => void runGenerate()}
              disabled={busy}
              className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'generate' ? '…' : 'Generate'}
            </button>
          )}
          {tab === 'prompt' && (
            <button
              type="button"
              onClick={() => void runPrompt()}
              disabled={busy}
              className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'prompt' ? '…' : 'Run Prompt'}
            </button>
          )}
          {tab === 'tts' && (
            <button
              type="button"
              onClick={() => void runTts()}
              disabled={busy}
              className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'tts' ? '…' : 'Run TTS'}
            </button>
          )}
          {tab === 'promptTts' && (
            <button
              type="button"
              onClick={() => void runPromptTts()}
              disabled={busy}
              className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'promptTts' ? '…' : 'Run Prompt+TTS'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
