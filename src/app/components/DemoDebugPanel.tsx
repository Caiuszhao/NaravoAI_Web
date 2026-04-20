import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bug, ChevronDown, ChevronUp, ClipboardCopy, GripVertical, Trash2 } from 'lucide-react';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useApiEnv } from '../context/ApiEnvContext';
import { DEMO3_BRANCH_TEST_PLAYBOOK, DEMO3_FIXED_TEST_REPLY } from '../config/prompt.config';

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    } as Intl.DateTimeFormatOptions);
  } catch {
    return String(ts);
  }
}

const kindStyles: Record<string, string> = {
  api_request: 'text-amber-300/90',
  api_response: 'text-emerald-300/90',
  api_error: 'text-red-300/90',
  video_branch: 'text-sky-300/90',
};

export function DemoDebugPanel() {
  const { entries, clear, push } = useDemoDebug();
  const { mode, setMode } = useApiEnv();
  const [expanded, setExpanded] = useState(true);
  const [demo3TestOpen, setDemo3TestOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });
  const isDraggingRef = useRef(false);

  const reversed = useMemo(() => [...entries].reverse(), [entries]);

  const injectDemo3Emotion = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    window.dispatchEvent(
      new CustomEvent('naravo:demo3-debug-emotion', {
        detail: { emotionType, fixedReply: DEMO3_FIXED_TEST_REPLY },
      })
    );
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push({
        kind: 'video_branch',
        title: 'Clipboard',
        body: `已复制：${label}`,
      });
    } catch {
      push({
        kind: 'api_error',
        title: 'Clipboard failed',
        body: '无法写入剪贴板（浏览器权限）。',
      });
    }
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const nextX = dragStartRef.current.startX + (event.clientX - dragStartRef.current.pointerX);
      const nextY = dragStartRef.current.startY + (event.clientY - dragStartRef.current.pointerY);
      setDragOffset({ x: nextX, y: nextY });
    };
    const handlePointerUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
    };
  }, []);

  const handleDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: dragOffset.x,
      startY: dragOffset.y,
    };
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      className="fixed bottom-3 left-3 z-[200] flex flex-col items-start gap-1 max-w-[min(100vw-1.5rem,420px)] pointer-events-auto"
      style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
    >
      <div className="w-full flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex rounded-lg border border-white/15 overflow-hidden mr-1">
            <button
              type="button"
              title="测试 API：127.0.0.1:8000"
              onClick={() => setMode('test')}
              className={`px-2 py-1.5 text-[10px] font-bold ${
                mode === 'test' ? 'bg-white text-black' : 'bg-black/80 text-white/65 hover:bg-white/10'
              }`}
            >
              测
            </button>
            <button
              type="button"
              title="线上 API"
              onClick={() => setMode('production')}
              className={`px-2 py-1.5 text-[10px] font-bold ${
                mode === 'production' ? 'bg-white text-black' : 'bg-black/80 text-white/65 hover:bg-white/10'
              }`}
            >
              线
            </button>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/80 backdrop-blur-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 hover:bg-black/90 hover:text-white transition-colors"
            aria-expanded={expanded}
          >
            <Bug className="w-3.5 h-3.5" />
            Debug
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => clear()}
            className="rounded-lg border border-white/15 bg-black/80 backdrop-blur-md p-1.5 text-white/60 hover:text-white transition-colors"
            title="Clear log"
            aria-label="Clear debug log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Demo3 分支测试（注入情绪）"
            onClick={() => setDemo3TestOpen((o) => !o)}
            className={`rounded-lg border border-white/15 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              demo3TestOpen ? 'bg-white text-black' : 'bg-black/80 text-white/65 hover:bg-white/10'
            }`}
          >
            D3测
          </button>
        </div>

        <button
          type="button"
          onPointerDown={handleDragStart}
          className="rounded-lg border border-white/15 bg-black/80 backdrop-blur-md p-1.5 text-white/65 hover:text-white hover:bg-black/90 transition-colors cursor-grab active:cursor-grabbing touch-none"
          title="拖动 Debug 窗口"
          aria-label="Drag debug panel"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {demo3TestOpen && (
        <div className="w-full max-w-[min(100vw-1.5rem,420px)] rounded-xl border border-white/12 bg-black/90 backdrop-blur-xl px-3 py-2.5 text-left space-y-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          <p className="text-[10px] text-white/55 leading-snug">
            在 Demo3 出现输入层时点击数字，会写入固定句并<strong className="text-white/80">跳过 generate</strong>直接按情绪走线。走完一线请点重开，再走下一线。
          </p>
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => void copyText(DEMO3_FIXED_TEST_REPLY, '固定测试句')}
              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/85 hover:bg-white/10"
            >
              <ClipboardCopy className="w-3 h-3 opacity-80" />
              复制固定句
            </button>
            <button
              type="button"
              onClick={() =>
                push({
                  kind: 'video_branch',
                  title: 'Demo3 · 分支手册',
                  body: DEMO3_BRANCH_TEST_PLAYBOOK,
                })
              }
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/85 hover:bg-white/10"
            >
              写入日志：A/B/C/D/E
            </button>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1">ep_2（或等价入口）</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  [1, 'A'],
                  [2, 'B'],
                  [3, 'C'],
                  [4, 'D首'],
                  [5, '重试'],
                ] as const
              ).map(([n, lab]) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => injectDemo3Emotion(n)}
                  className="min-w-[2.75rem] rounded-md border border-white/12 bg-white/5 px-1.5 py-1 text-[10px] font-semibold text-white/90 hover:bg-white/12"
                >
                  {n}·{lab}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1">ep_4_4（第二次输入）</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  [1, 'A'],
                  [2, 'B'],
                  [3, 'C'],
                  [4, 'D续'],
                  [5, 'E'],
                ] as const
              ).map(([n, lab]) => (
                <button
                  key={`e44-${n}`}
                  type="button"
                  onClick={() => injectDemo3Emotion(n)}
                  className="min-w-[2.75rem] rounded-md border border-white/12 bg-white/5 px-1.5 py-1 text-[10px] font-semibold text-white/90 hover:bg-white/12"
                >
                  {n}·{lab}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1">ep4_2（重试后第二次入口）</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  [1, 'A'],
                  [2, 'B'],
                  [3, 'C'],
                  [4, 'D续'],
                  [5, 'E'],
                ] as const
              ).map(([n, lab]) => (
                <button
                  key={`e42-${n}`}
                  type="button"
                  onClick={() => injectDemo3Emotion(n)}
                  className="min-w-[2.75rem] rounded-md border border-white/12 bg-white/5 px-1.5 py-1 text-[10px] font-semibold text-white/90 hover:bg-white/12"
                >
                  {n}·{lab}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1">ep_4_5（ep_3-4 后 · 第三次输入）</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  [1, 'A'],
                  [2, 'B'],
                  [3, 'C'],
                  [4, 'D子'],
                  [5, 'E'],
                ] as const
              ).map(([n, lab]) => (
                <button
                  key={`e45-${n}`}
                  type="button"
                  onClick={() => injectDemo3Emotion(n)}
                  className="min-w-[2.75rem] rounded-md border border-white/12 bg-white/5 px-1.5 py-1 text-[10px] font-semibold text-white/90 hover:bg-white/12"
                >
                  {n}·{lab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="w-full rounded-xl border border-white/12 bg-black/88 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="max-h-[min(40vh,320px)] overflow-y-auto overscroll-contain px-3 py-2 space-y-2.5 text-left">
            {reversed.length === 0 ? (
              <p className="text-[11px] text-white/35 py-2">No debug entries yet.</p>
            ) : (
              reversed.map((e) => (
                <div key={e.id} className="border-b border-white/[0.06] pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[9px] tabular-nums text-white/35">{formatTime(e.ts)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${kindStyles[e.kind] ?? 'text-white/70'}`}>
                      {e.kind.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-white/75 font-medium">{e.title}</span>
                  </div>
                  <pre className="mt-1 text-[10px] leading-snug text-white/65 whitespace-pre-wrap break-words font-mono">
                    {e.body}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
