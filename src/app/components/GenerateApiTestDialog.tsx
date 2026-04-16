import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { generateText } from '../utils/generateClient';
import {
  createMp3ObjectUrl,
  postPrompt,
  postPromptTts,
  postTts,
} from '../utils/promptTtsClient';
import { PROMPT_TTS_CLONE_MEDIA_TYPE, PROMPT_TTS_CLONE_VOICE_ID } from '../config/ttsCloneVoice';
import { buildPromptTtsFullPrompt, PROMPT_TTS_SCENE_BACKGROUND } from '../utils/demo3NarrationPrompt';
import { DEMO3_FIXED_TEST_REPLY } from '../utils/demo3BranchTest';
import { postAsrVoiceInputGenerate, extractAsrText } from '../utils/asrVoiceInputClient';
import { arrayBufferToBase64, concatFloat32, encodeWav16Mono, resampleMonoLinear } from '../utils/audioWav';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useApiEnv } from '../context/ApiEnvContext';

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type TestTab = 'generate' | 'prompt' | 'tts' | 'promptTts' | 'voiceInput';

const TABS: { id: TestTab; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'prompt', label: 'Prompt' },
  { id: 'tts', label: 'TTS' },
  { id: 'promptTts', label: 'Prompt+TTS' },
  { id: 'voiceInput', label: 'Voice Input' },
];

export function GenerateApiTestDialog({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<TestTab>('generate');
  const { mode, setMode, baseUrl } = useApiEnv();

  const [generateTextValue, setGenerateTextValue] = useState('写一段产品介绍文案，主题：Narovo');
  const [promptValue, setPromptValue] = useState('写一句欢迎语');
  const [ttsTextValue, setTtsTextValue] = useState('你好，欢迎来到 Narovo。');
  const [promptTtsPrompt, setPromptTtsPrompt] = useState(DEMO3_FIXED_TEST_REPLY);
  const [promptTtsSceneBackground, setPromptTtsSceneBackground] = useState(PROMPT_TTS_SCENE_BACKGROUND);

  const [per, setPer] = useState(0);
  const [spd, setSpd] = useState(5);
  const [pit, setPit] = useState(5);
  const [vol, setVol] = useState(5);

  const [textOutput, setTextOutput] = useState('');
  const [loading, setLoading] = useState<TestTab | null>(null);
  const busy = loading !== null;
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
      case 'voiceInput':
        return `${base}/api/v1/asr/voice-input-generate`;
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

  const voiceAbortRef = useRef<AbortController | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const voiceChunksRef = useRef<Float32Array[]>([]);
  const voiceSampleRateRef = useRef<number>(48000);
  const voiceRecordingRef = useRef(false);
  const voicePointerDownRef = useRef(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSubmitting, setVoiceSubmitting] = useState(false);
  const [voicePermissionChecking, setVoicePermissionChecking] = useState(false);
  const [voiceMicReady, setVoiceMicReady] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceProvider, setVoiceProvider] = useState('');
  const [voiceModel, setVoiceModel] = useState('');
  const [voiceSystem, setVoiceSystem] = useState('');
  const [voiceTemperature, setVoiceTemperature] = useState<string>(''); // allow empty
  const [voiceMaxTokens, setVoiceMaxTokens] = useState<string>(''); // allow empty
  const [voiceExtraJson, setVoiceExtraJson] = useState('');

  const stopVoiceCapture = useCallback(async () => {
    const proc = voiceProcessorRef.current;
    if (proc) {
      try {
        proc.disconnect();
      } catch {
        // ignore
      }
    }
    voiceProcessorRef.current = null;

    const ctx = voiceAudioCtxRef.current;
    voiceAudioCtxRef.current = null;
    if (ctx) {
      try {
        await ctx.close();
      } catch {
        // ignore
      }
    }

    const stream = voiceStreamRef.current;
    voiceStreamRef.current = null;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      voiceAbortRef.current?.abort();
      voiceAbortRef.current = null;
      void stopVoiceCapture();
    };
  }, [stopVoiceCapture]);

  const ensureMicPermission = useCallback(async () => {
    // If Permissions API exists and already granted, skip prompting.
    try {
      const perms: any = (navigator as any).permissions;
      if (perms?.query) {
        const status = await perms.query({ name: 'microphone' as any });
        if (status?.state === 'granted') return true;
      }
    } catch {
      // ignore
    }

    const navAny = navigator as any;
    const getUserMedia: undefined | ((c: MediaStreamConstraints) => Promise<MediaStream>) =
      navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ?? navAny.getUserMedia?.bind(navigator);

    if (!getUserMedia) {
      const secureHint =
        typeof window !== 'undefined' && window.location
          ? `Current origin: ${window.location.origin} (need https or http://localhost)`
          : 'Need https or http://localhost';
      throw new Error(`getUserMedia is unavailable. ${secureHint}`);
    }

    // Prompt permission by requesting audio once, then immediately stop.
    const s = await getUserMedia({ audio: true });
    for (const t of s.getTracks()) t.stop();
    return true;
  }, []);

  const buildVoiceLlmOptions = useCallback(() => {
    const temperature = Number(voiceTemperature);
    const max_tokens = Number(voiceMaxTokens);
    let extra: unknown = undefined;
    const extraText = voiceExtraJson.trim();
    if (extraText) {
      try {
        extra = JSON.parse(extraText);
      } catch {
        extra = { raw: extraText };
      }
    }
    return {
      provider: voiceProvider.trim() || undefined,
      model: voiceModel.trim() || undefined,
      system: voiceSystem.trim() || undefined,
      temperature: Number.isFinite(temperature) ? temperature : undefined,
      max_tokens: Number.isFinite(max_tokens) ? max_tokens : undefined,
      extra,
    };
  }, [voiceProvider, voiceModel, voiceSystem, voiceTemperature, voiceMaxTokens, voiceExtraJson]);

  const requestMicThenEnable = useCallback(async () => {
    if (busy || voiceSubmitting) return;
    setTextOutput('');
    setVoicePermissionChecking(true);
    try {
      await ensureMicPermission();
      setVoiceMicReady(true);
      pushDebug({
        kind: 'api_response',
        title: 'Microphone permission granted (test dialog)',
        body: 'Mic permission is ready. You can now hold to record.',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : safeJson(e);
      pushDebug({
        kind: 'api_error',
        title: 'Microphone permission request failed (test dialog)',
        body: msg,
      });
      setTextOutput(
        [
          'Microphone permission request failed.',
          '',
          msg,
          '',
          'Tips: microphone requires user permission; also requires a secure context (https) or http://localhost in most browsers.',
        ].join('\n')
      );
    } finally {
      setVoicePermissionChecking(false);
    }
  }, [busy, voiceSubmitting, ensureMicPermission, pushDebug]);

  const startVoiceInput = useCallback(() => {
    if (busy || voiceSubmitting) return;
    setTextOutput('');
    voiceChunksRef.current = [];
    voiceAbortRef.current?.abort();
    const controller = new AbortController();
    voiceAbortRef.current = controller;

    void (async () => {
      try {
        setVoicePermissionChecking(true);
        await ensureMicPermission();
        if (!voicePointerDownRef.current) return;
        setVoicePermissionChecking(false);
        setVoiceMicReady(true);

        voiceRecordingRef.current = true;
        setVoiceRecording(true);

        const navAny = navigator as any;
        const getUserMedia: undefined | ((c: MediaStreamConstraints) => Promise<MediaStream>) =
          navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ?? navAny.getUserMedia?.bind(navigator);

        if (!getUserMedia) {
          const secureHint =
            typeof window !== 'undefined' && window.location
              ? `Current origin: ${window.location.origin} (need https or http://localhost)`
              : 'Need https or http://localhost';
          throw new Error(`getUserMedia is unavailable. ${secureHint}`);
        }

        const stream = await getUserMedia({ audio: true });
        if (controller.signal.aborted) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        voiceStreamRef.current = stream;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        voiceAudioCtxRef.current = ctx;
        voiceSampleRateRef.current = ctx.sampleRate;

        const source = ctx.createMediaStreamSource(stream);
        const proc = ctx.createScriptProcessor(4096, 1, 1);
        voiceProcessorRef.current = proc;
        proc.onaudioprocess = (event) => {
          if (!voiceRecordingRef.current) return;
          const ch = event.inputBuffer.getChannelData(0);
          voiceChunksRef.current.push(new Float32Array(ch));
        };
        source.connect(proc);
        proc.connect(ctx.destination);
      } catch (e) {
        setVoiceRecording(false);
        voiceRecordingRef.current = false;
        setVoicePermissionChecking(false);
        let msg = e instanceof Error ? e.message : safeJson(e);
        const name = (e as any)?.name as string | undefined;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          msg =
            'Microphone permission denied. Please allow mic permission in the browser site settings and retry.\n' +
            msg;
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          msg = 'No microphone device found.\n' + msg;
        }
        pushDebug({
          kind: 'api_error',
          title: 'Voice capture start failed (test dialog)',
          body: msg,
        });
        setTextOutput(
          [
            'Voice capture failed.',
            '',
            msg,
            '',
            'Tips: microphone requires user permission; also requires a secure context (https) or http://localhost in most browsers.',
          ].join('\\n')
        );
        await stopVoiceCapture();
      }
    })();
  }, [busy, voiceSubmitting, pushDebug, stopVoiceCapture, ensureMicPermission]);

  const stopAndSubmitVoiceInput = useCallback(() => {
    if (voicePermissionChecking) return;
    if (!voiceRecording) return;
    voiceRecordingRef.current = false;
    setVoiceRecording(false);
    setVoiceSubmitting(true);
    voiceAbortRef.current?.abort();
    voiceAbortRef.current = null;

    void (async () => {
      try {
        const chunks = voiceChunksRef.current;
        const inputRate = voiceSampleRateRef.current || 48000;
        await stopVoiceCapture();

        const pcm = concatFloat32(chunks);
        if (pcm.length < inputRate * 0.25) throw new Error('Voice input too short');

        const pcm16k = resampleMonoLinear(pcm, inputRate, 16000);
        const wav = encodeWav16Mono(pcm16k, 16000);
        // Ensure we pass a real ArrayBuffer (not SharedArrayBuffer typing).
        const speechB64 = await arrayBufferToBase64(wav.buffer.slice(0) as ArrayBuffer);

        const body = {
          format: 'wav',
          rate: 16000,
          channel: 1,
          cuid: 'naravo_web_test_dialog',
          dev_pid: 1737,
          speech: speechB64,
          len: wav.byteLength,
          ...buildVoiceLlmOptions(),
        };

        pushDebug({
          kind: 'api_request',
          title: 'POST /api/v1/asr/voice-input-generate (test dialog)',
          body: safeJson({ ...body, speech: `base64(${speechB64.length} chars)` }),
        });

        const res = await postAsrVoiceInputGenerate(body, { baseUrl });
        const asrText = extractAsrText(res) ?? '';
        setTextOutput([
          asrText ? `ASR: ${asrText}` : 'ASR: (empty)',
          '',
          'Full response:',
          safeJson(res),
        ].join('\n'));
        pushDebug({
          kind: 'api_response',
          title: 'voice-input-generate OK (test dialog)',
          body: safeJson(res),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : safeJson(e);
        setTextOutput(msg);
        pushDebug({
          kind: 'api_error',
          title: 'voice-input-generate failed (test dialog)',
          body: msg,
        });
      } finally {
        voiceChunksRef.current = [];
        setVoiceSubmitting(false);
      }
    })();
  }, [voiceRecording, baseUrl, pushDebug, stopVoiceCapture, buildVoiceLlmOptions]);

  const submitVoiceFile = useCallback(async () => {
    if (!voiceFile) return;
    if (busy || voiceSubmitting || voiceRecording || voicePermissionChecking) return;
    setVoiceSubmitting(true);
    try {
      const buf = await voiceFile.arrayBuffer();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audio = await ctx.decodeAudioData(buf.slice(0));
      const inputRate = audio.sampleRate || 48000;
      let mono: Float32Array;
      if (audio.numberOfChannels <= 1) {
        mono = audio.getChannelData(0);
      } else {
        const c0 = audio.getChannelData(0);
        const c1 = audio.getChannelData(1);
        const out = new Float32Array(Math.min(c0.length, c1.length));
        for (let i = 0; i < out.length; i++) out[i] = (c0[i] + c1[i]) * 0.5;
        mono = out;
      }
      await ctx.close().catch(() => undefined);

      const pcm16k = resampleMonoLinear(mono, inputRate, 16000);
      const wav = encodeWav16Mono(pcm16k, 16000);
      const speechB64 = await arrayBufferToBase64(wav.buffer.slice(0) as ArrayBuffer);

      const body = {
        format: 'wav',
        rate: 16000,
        channel: 1,
        cuid: 'naravo_web_test_dialog_file',
        dev_pid: 1737,
        speech: speechB64,
        len: wav.byteLength,
        ...buildVoiceLlmOptions(),
      };

      pushDebug({
        kind: 'api_request',
        title: 'POST /api/v1/asr/voice-input-generate (test dialog · file)',
        body: safeJson({
          ...body,
          file: `${voiceFile.name} (${voiceFile.type || 'audio/*'}, ${voiceFile.size} bytes)`,
          speech: `base64(${speechB64.length} chars)`,
        }),
      });

      const res = await postAsrVoiceInputGenerate(body, { baseUrl });
      const asrText = extractAsrText(res) ?? '';
      setTextOutput([
        `File: ${voiceFile.name}`,
        asrText ? `ASR: ${asrText}` : 'ASR: (empty)',
        '',
        'Full response:',
        safeJson(res),
      ].join('\\n'));
      pushDebug({
        kind: 'api_response',
        title: 'voice-input-generate OK (test dialog · file)',
        body: safeJson(res),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : safeJson(e);
      setTextOutput(msg);
      pushDebug({
        kind: 'api_error',
        title: 'voice-input-generate failed (test dialog · file)',
        body: msg,
      });
    } finally {
      setVoiceSubmitting(false);
    }
  }, [voiceFile, busy, voiceSubmitting, voiceRecording, voicePermissionChecking, baseUrl, pushDebug, buildVoiceLlmOptions]);

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
    const payload = buildPromptTtsFullPrompt(promptTtsPrompt, promptTtsSceneBackground);

    const body = {
      prompt: payload,
      voice_id: PROMPT_TTS_CLONE_VOICE_ID,
      media_type: PROMPT_TTS_CLONE_MEDIA_TYPE,
      per,
      spd,
      pit,
      vol,
    };
    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/prompt-tts (test dialog · clone)',
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
        title: 'prompt-tts OK (test dialog · clone)',
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

  const voiceBusy = voiceRecording || voiceSubmitting;

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
                场景背景（PROMPT_TTS_SCENE_BACKGROUND）与观众回复会拼成完整 prompt，再调用 prompt-tts 返回 MP3。
              </p>
              <label className="grid gap-1.5">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Scene / background</span>
                <textarea
                  value={promptTtsSceneBackground}
                  onChange={(e) => setPromptTtsSceneBackground(e.target.value)}
                  className="w-full min-h-28 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[12px] text-white/85 outline-none leading-relaxed"
                  placeholder="Scene background for prompt-tts…"
                />
              </label>
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setPromptTtsSceneBackground(PROMPT_TTS_SCENE_BACKGROUND)}
                  className="text-[10px] text-white/45 hover:text-white/75 underline-offset-2 hover:underline"
                >
                  Reset scene to default
                </button>
              </div>
              <label className="grid gap-1.5">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">User dialogue (viewer reply)</span>
                <textarea
                  value={promptTtsPrompt}
                  onChange={(e) => setPromptTtsPrompt(e.target.value)}
                  className="w-full min-h-20 resize-y rounded-md bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/85 outline-none"
                  placeholder="Viewer reply to the astronaut (leave empty to simulate no response)"
                />
              </label>
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

          {tab === 'voiceInput' && (
            <>
              <p className="text-[10px] text-white/45 leading-relaxed">
                PC 无法录音时，请用本机音频文件测试（例如 <code className="text-white/70">D:\B04Playable\code\clone_voice.mp3</code>）。
                系统会将音频解码→重采样 16k→WAV→base64，再请求{' '}
                <code className="text-white/70">/api/v1/asr/voice-input-generate</code>（dev_pid=1737，英语）。
              </p>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">LLM options (optional)</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="grid gap-1">
                    <span className="text-white/45">provider</span>
                    <input
                      value={voiceProvider}
                      onChange={(e) => setVoiceProvider(e.target.value)}
                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                      placeholder="(default)"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-white/45">model</span>
                    <input
                      value={voiceModel}
                      onChange={(e) => setVoiceModel(e.target.value)}
                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                      placeholder="(default)"
                    />
                  </label>
                  <label className="grid gap-1 col-span-2">
                    <span className="text-white/45">system</span>
                    <input
                      value={voiceSystem}
                      onChange={(e) => setVoiceSystem(e.target.value)}
                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                      placeholder="(optional system prompt)"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-white/45">temperature</span>
                    <input
                      value={voiceTemperature}
                      onChange={(e) => setVoiceTemperature(e.target.value)}
                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                      placeholder="(e.g. 0.7)"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-white/45">max_tokens</span>
                    <input
                      value={voiceMaxTokens}
                      onChange={(e) => setVoiceMaxTokens(e.target.value)}
                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white"
                      placeholder="(e.g. 256)"
                    />
                  </label>
                  <label className="grid gap-1 col-span-2">
                    <span className="text-white/45">extra (JSON, optional)</span>
                    <textarea
                      value={voiceExtraJson}
                      onChange={(e) => setVoiceExtraJson(e.target.value)}
                      className="w-full min-h-16 resize-y rounded-md bg-white/5 border border-white/10 px-2 py-2 text-[12px] text-white/85 outline-none"
                      placeholder='{"foo":"bar"}'
                    />
                  </label>
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="grid gap-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setVoiceFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-[11px] text-white/70 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white hover:file:bg-white/15"
                  />
                  <button
                    type="button"
                    disabled={busy || voiceSubmitting || !voiceFile}
                    onClick={() => void submitVoiceFile()}
                    className="h-9 px-4 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {voiceSubmitting ? '…' : 'Run voice-input-generate with file'}
                  </button>
                </div>

                <details className="mt-3">
                  <summary className="text-[10px] text-white/55 cursor-pointer select-none">（可选）录音模式</summary>
                  <div className="mt-2">
                    {!voiceMicReady && (
                      <button
                        type="button"
                        disabled={busy || voiceSubmitting || voicePermissionChecking}
                        onClick={() => void requestMicThenEnable()}
                        className="w-full h-9 mb-2 rounded-md bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {voicePermissionChecking ? 'Requesting mic permission…' : 'Enable microphone permission'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy || voiceSubmitting || voicePermissionChecking || !voiceMicReady}
                      onTouchStart={(e) => {
                        // Mobile Safari sometimes doesn't reliably fire pointer events for press-and-hold.
                        // Use touch events as a fallback so "release" always submits.
                        e.preventDefault();
                        voicePointerDownRef.current = true;
                        startVoiceInput();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        voicePointerDownRef.current = false;
                        stopAndSubmitVoiceInput();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        voicePointerDownRef.current = false;
                        stopAndSubmitVoiceInput();
                      }}
                      onPointerDown={() => {
                        voicePointerDownRef.current = true;
                        startVoiceInput();
                      }}
                      onPointerUp={() => {
                        voicePointerDownRef.current = false;
                        stopAndSubmitVoiceInput();
                      }}
                      onPointerCancel={() => {
                        voicePointerDownRef.current = false;
                        stopAndSubmitVoiceInput();
                      }}
                      onPointerLeave={() => {
                        voicePointerDownRef.current = false;
                        stopAndSubmitVoiceInput();
                      }}
                      className={`w-full h-10 rounded-md border border-white/15 text-[12px] font-semibold tracking-wide transition-colors ${
                        voiceRecording ? 'bg-white/15 text-white' : 'bg-transparent text-white/80 hover:bg-white/10'
                      } disabled:opacity-60 disabled:cursor-not-allowed touch-none select-none`}
                    >
                      {voiceSubmitting
                        ? 'Submitting…'
                        : voicePermissionChecking
                          ? 'Requesting mic permission…'
                          : voiceRecording
                            ? 'Recording… (release to submit)'
                            : voiceMicReady
                              ? 'Hold to record'
                              : 'Enable mic permission first'}
                    </button>
                    <p className="mt-2 text-[10px] text-white/40">
                      录音需要麦克风权限，且多数浏览器要求 https 或 http://localhost。
                    </p>
                  </div>
                </details>
                <p className="mt-2 text-[10px] text-white/40 break-all">
                  Base: {baseUrl} {voiceBusy ? '· busy' : ''}
                </p>
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
