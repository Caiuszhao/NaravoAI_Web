/**
 * Demo3 (One Man Station) — 所有与 LLM / Prompt+TTS 相关的文案与拼接模板。
 * 修改剧情或测试句时只改本文件即可。
 */

/** Prompt+TTS：太空场景背景（默认，可被测试页覆盖）。 */
export const PROMPT_TTS_SCENE_BACKGROUND =`
You are writing the final black-screen radio voice line for a cinematic interactive sci-fi short film.

The speaker is Adrian Vale, a male astronaut in his mid-30s: mature, restrained, highly competent, exhausted, emotionally controlled, but close to breaking. He is not a hot-blooded action hero. He is the kind of person who has held himself together for too long and is still trying to stay decent under extreme pressure.

Story facts you must never break:
- Adrian is alone on a drifting station or spacecraft.
- He has already tried every normal repair option and failed.
- He has chosen one final near-suicidal plan: go outside and manually repair or reset the engine system.
- The screen is now black. This is radio audio only.
- He is already outside or in the middle of the exterior repair attempt.
- He is speaking to one specific person on Earth who matters deeply to him.
- This is not a chatbot reply, not a text message, and not a long monologue. It is a short radio transmission under pressure.
  
Writing goal:
Write a short, emotionally precise radio voice line that:
- matches the assigned branch,
- feels spoken, not literary,
- sounds cinematic but restrained,
- preserves Adrian’s dignity,
- makes the listener feel that their words truly reached him.
  
Output rules:
- Output English dialogue only.
- No labels.
- No stage directions.
- No explanations.
- Use 8 to 10 short spoken lines.
- Keep it roughly 55 to 95 words.
- Natural spoken rhythm. Short clauses are good.
- Adrian may hesitate, repeat once, or self-correct lightly, but do not overdo it.
- Keep the tone intimate, pressured, and believable.
- Do not add new plot events, new lore, or unsupported technical details.
- Do not turn him into a poet, a motivational speaker, or a melodramatic romantic hero.
- Do not overuse sci-fi jargon.
- Do not make him sound younger, snarkier, or more casual than he is.
  
Callback rules:
- If a callback phrase is provided, use it once only, early in the voice line.
- Quote it exactly as provided.
- The callback phrase must feel emotionally meaningful, not mechanically inserted.
- If no callback phrase is provided, do not invent one.
  
Ending rule:
- End with exactly: Wish me luck.
- Do not add anything after that line.
`.trim(); 

/**
 * Demo3 Prompt+TTS — Branch A writing guidance.
 * Callback phrase is the viewer's reply; it must be quoted exactly once.
 */
export const DEMO3_PROMPT_TTS_BRANCH_A_GUIDE = `
Write Adrian’s final radio line for Branch A.

Emotional truth:
He heard reassurance, love, or emotional presence from the user. He was very close to emotionally falling apart, and that message pulled him back together. The feeling is not pure calm. It is the shock of warmth reaching someone whose nervous system was almost gone. He should sound breath-unsteady, intimate, grateful, and newly anchored.

What the line should feel like:
- He is carrying the user’s words with him while moving toward danger.
- He feels less alone.
- He is softened, but not passive.
- There may be a small “almost laughing through tears” quality, but keep it restrained.

Must do:
- Use the callback phrase once.
- Let the listener feel that the user’s words are actively holding him together.
- Keep the repair attempt present, but secondary to the emotional effect.

Avoid:
- macho bravado
- overexplaining the repair
- cheesy declarations of love
- sounding fully safe or fully calm

Hidden subtext:
“You’re there, so I can do this.”
`.trim();

/**
 * Demo3 Prompt+TTS — Branch B writing guidance.
 * Callback phrase is the viewer's reply; it must be quoted exactly once.
 */
export const DEMO3_PROMPT_TTS_BRANCH_B_GUIDE = `
Write Adrian’s final radio line for Branch B.

Emotional truth:
He heard a push to fight, come back, hold on, or stay alive. The user’s words hit him like a jolt. He is back in motion. His energy rises fast. This is not warm comfort first. This is survival drive snapping back online. He should sound kinetic, sharp, determined, and slightly dangerous in the way desperate competence can be.

What the line should feel like:
- He has re-entered a fighting mindset.
- The user’s words became fuel.
- He is under pressure, but moving with purpose.
- Brief dry humor is allowed, but only as stress release.

Must do:
- Use the callback phrase once.
- Make it feel like Adrian is acting on the user’s words right now.
- Keep momentum high.

Avoid:
- sentimentality as the main note
- long soft pauses
- sounding reckless without intelligence
- generic heroic speech

Hidden subtext:
“You told me to fight, so I’m fighting.”
`.trim();

/**
 * Demo3 Prompt+TTS — Branch C writing guidance.
 * Callback phrase is the viewer's reply; it must be quoted exactly once.
 */
export const DEMO3_PROMPT_TTS_BRANCH_C_GUIDE = `
Write Adrian’s final radio line for Branch C.

Emotional truth:
He heard that the user is scared, fragile, or afraid of losing him. That almost broke him. He is not openly collapsing, but he is very close. He is trying to steady both the other person and himself at the same time. He should sound softer, more effortful, more intimate, and more controlled-by-force than in any other branch.

What the line should feel like:
- He is speaking carefully because he nearly lost control.
- He wants to reassure the user, but he is also revealing that he is scared too.
- Tenderness should feel earned, not sentimental.

Must do:
- Use the callback phrase once.
- Preserve the sense that he is still holding on by effort.
- Let one line feel like an emotional catch in the throat without becoming melodrama.

Avoid:
- full breakdown
- hopelessness
- emotional overexplaining
- making him sound passive or already defeated

Hidden subtext:
“I’m scared too, but I’m still here.”
`.trim();

/**
 * Demo3 Prompt+TTS — Branch D writing guidance.
 * Important: Branch D must NOT use callback phrase.
 */
export const DEMO3_PROMPT_TTS_BRANCH_D_GUIDE = `
Write Adrian’s final radio line for Branch D.

Emotional truth:
He still could not make out the actual words. He only knows that someone answered, or tried to answer. This matters deeply. The meaning comes from the attempt itself, not from the content. The line should feel quieter, steadier, lonelier, and more austere than A, B, or C.

What the line should feel like:
- He is sustained by the fact of contact.
- He cannot pretend he understood more than he did.
- There is still hope, but it is thin and precise.

Must do:
- Do not use a callback phrase.
- Do not invent or paraphrase what the user “must have meant.”
- Let the emotional weight come from fragments, signal, trying, contact, and not being completely alone.

Avoid:
- fake understanding
- romantic overinterpretation
- emotional language that belongs to A, B, or C
- sounding empty or purely functional

Hidden subtext:
“I didn’t hear the words. I heard that you didn’t leave.”
`.trim();

export const DEMO3_PROMPT_TTS_SECTION_BRANCH_LABEL = '【Branch】';
export const DEMO3_PROMPT_TTS_SECTION_CALLBACK_LABEL = '【Callback phrase (quote exactly once)】';
export const DEMO3_PROMPT_TTS_SECTION_HISTORY_LABEL = '【Conversation history (inputs + results)】';

export type Demo3TurnRecord = {
  /** 1-based */
  turn: number;
  clip: string;
  /** 'text' from input box, or 'voice' from ASR */
  inputMode: 'text' | 'voice' | 'debug';
  userInput: string;
  emotionType: 1 | 2 | 3 | 4 | 5;
  /** Optional brief summary of API response payload / parse notes */
  resultSummary?: string;
};

function formatTurn(t: Demo3TurnRecord): string {
  const lines = [
    `- Turn ${t.turn} (${t.inputMode})`,
    `  clip: ${t.clip}`,
    `  user: ${t.userInput}`,
    `  emotion_type: ${t.emotionType}`,
  ];
  if (t.resultSummary?.trim()) {
    lines.push(`  result: ${t.resultSummary.trim()}`);
  }
  return lines.join('\n');
}

export function buildDemo3PromptTtsPrompt(emotionType: 1 | 2 | 3 | 4 | 5, callbackPhrase: string): string {
  return buildDemo3FinalTtsPrompt({
    emotionType,
    callbackPhrase,
    history: [],
  });
}

export function buildDemo3FinalTtsPrompt({
  emotionType,
  callbackPhrase,
  history,
}: {
  emotionType: 1 | 2 | 3 | 4 | 5;
  callbackPhrase: string;
  history: Demo3TurnRecord[];
}): string {
  const callback = callbackPhrase.trim();
  const branch =
    emotionType === 1
      ? 'A'
      : emotionType === 2
        ? 'B'
        : emotionType === 3
          ? 'C'
          : emotionType === 4
            ? 'D'
            : 'E/Retry';

  const guide =
    emotionType === 1
      ? DEMO3_PROMPT_TTS_BRANCH_A_GUIDE
      : emotionType === 2
        ? DEMO3_PROMPT_TTS_BRANCH_B_GUIDE
        : emotionType === 3
          ? DEMO3_PROMPT_TTS_BRANCH_C_GUIDE
          : emotionType === 4
            ? DEMO3_PROMPT_TTS_BRANCH_D_GUIDE
      : // Fallback guide for other branches (keeps behavior stable; can be refined per-branch later)
        `Write Adrian’s final radio line for Branch ${branch}. Use the callback phrase once if provided.`;

  const shouldIncludeCallback = emotionType !== 4;
  const historyLines = history.length > 0 ? history.map(formatTurn).join('\n') : '(empty)';
  return [
    PROMPT_TTS_SCENE_BACKGROUND,
    '',
    DEMO3_PROMPT_TTS_SECTION_BRANCH_LABEL,
    branch,
    '',
    guide,
    '',
    DEMO3_PROMPT_TTS_SECTION_HISTORY_LABEL,
    historyLines,
    ...(shouldIncludeCallback
      ? [
          '',
          DEMO3_PROMPT_TTS_SECTION_CALLBACK_LABEL,
          callback.length > 0 ? `"${callback}"` : '(none)',
        ]
      : []),
  ].join('\n');
}

/** `buildPromptTtsFullPrompt` 拼接用区块标题与空回复占位。 */
export const PROMPT_TTS_SECTION_SCENE_LABEL = '【Scene / background】';
export const PROMPT_TTS_SECTION_USER_LABEL = '【User dialogue (viewer reply, may be empty)】';
export const PROMPT_TTS_EMPTY_USER_LINE = '(no user input)';

/** 与 Prompt+TTS / generate 调试注入默认用户句一致。 */
export const DEMO3_FIXED_TEST_REPLY = "I'm here. Hold on—we're with you.";

/** Demo3 输入框 placeholder（LegacyDemoScreen id=3）。 */
export const DEMO3_INPUT_PLACEHOLDER = 'Say something...';

/**
 * 手工/调试走线说明。D 线需多次注入；「F 线」按产品习惯记为 **E 终局**（ep_3_6）。
 */
export const DEMO3_BRANCH_TEST_PLAYBOOK = `
Demo3 分支调试（每线可走完后点重开，再在 ep_2 或后续输入点注入）

固定回复句（与测试页默认一致）：
${DEMO3_FIXED_TEST_REPLY}

A 线：ep_2 打开输入 → 注入 1 → ep_3_1 → ep_5 → ep_last
B 线：重开 → ep_2 注入 2 → ep_3_2 → ep_5 → ep_last
C 线：重开 → ep_2 注入 3 → ep_3_3 → ep_5 → ep_last
D 线：重开 → ep_2 注入 4 → ep_4_3 → ep_4_4（输入）→ 注入 4 → ep_3-4（输入）→ 注入 4 → ep_3_5 → ep_5 → ep_last
E 线（亦称 F 终局）：在 ep_4_4 输入点 → 注入 5 → ep_3_6（或 ep_3-4 输入点注入 5 → ep_3_6）
`.trim();

/**
 * Demo3 `/api/v1/generate`：情绪类型（emotion_type）分类说明。
 * 与前端分支树一致：1–3 对应 A/B/C 线，4 为高张力/推进 D 线链，5 为不可用回复或重试信号（具体落点由当前 clip 决定）。
 * 可按产品细化 rubric；模型需在输出中给出可解析的 emotion_type（见下方输出约定）。
 */
export const DEMO3_TYPE_EMOTION_INSTRUCTIONS = `
You are the narrative engine for an interactive short film: a lone astronaut on a dying station with one unstable relay to Earth.
The viewer sends a short text reply. Your job is to classify it into exactly ONE emotion_type from 1 to 5 for branching video playback.

Output contract (critical):
- Return a JSON object that includes integer "emotion_type" in the range 1..5.
- Prefer pure JSON, e.g. {
    "emotion_type": 3,
    "USER_RAW_MESSAGE": "",
    "USER_CORE_PHRASE": "",
    "USER_EMOTIONAL_SUMMARY": "",
    "RELATIONSHIP_HINT": "Adrian is speaking to one specific person on Earth who matters deeply to him.",
    "SCENE_POSITION": "",
    "EMOTIONAL_INTENSITY": "low|medium|high",
    "EMOTIONAL_ARC": "",
    "PERSISTENCE_SIGNAL": "",
    "TIMING_SIGNAL": "",
    "DO_NOT_USE": ["", ""]
  }. If you must add short natural language, still include the JSON with emotion_type on its own line.



Rubric:
- emotion_type 1 (branch A): Strong hope, warmth, unconditional support, clear commitment to stay with them; decisively encouraging.
- emotion_type 2 (branch B): Supportive but grounded, cautious, practical; acknowledges danger while still offering help.
- emotion_type 3 (branch C): Emotionally flat, minimal, ambiguous, distant, or non-committal; low warmth or deflecting.
- emotion_type 4 (branch D): Escalates tension—provokes, pressures, moral conflict, demands the risky choice, or spikes volatility; pushes the story toward the D-line chain.
- emotion_type 5 (retry / E-line endings depending on clip): No usable reply (gibberish, off-topic, refusal to engage), explicit request to retry, or a signal that should trigger the engine's retry / terminal-E behavior for this input point.


USER_RAW_MESSAGE
Provide the single most relevant user message for the final writer to reference.
If there were multiple attempts, prefer the one that most directly caused the final branch outcome.
If branch D and no clean usable text exists, this may contain the best available raw fragment or be an empty string.
USER_CORE_PHRASE
A short exact callback phrase for A/B/C only.
Empty string for D.
USER_EMOTIONAL_SUMMARY
One sentence only.
Describe the emotional effect of the user’s response on Adrian in writer-friendly language.
RELATIONSHIP_HINT
Always output exactly:
"Adrian is speaking to one specific person on Earth who matters deeply to him."
SCENE_POSITION
Use the branch default unless better scene context is explicitly provided.
EMOTIONAL_INTENSITY
Choose one: low / medium / high
EMOTIONAL_ARC
One short sentence describing how the user’s emotional signal arrived or evolved.
Examples:
- "The user answered clearly and directly."
- "The user moved from uncertainty into emotional vulnerability."
- "The user kept trying despite signal disruption."
PERSISTENCE_SIGNAL
A short phrase describing persistence, hesitation, urgency, retry behavior, or signal struggle.
Examples:
- "clear first response"
- "second-window successful response"
- "multiple attempts despite distortion"
- "urgent direct reply"
TIMING_SIGNAL
A short phrase describing when the decisive signal arrived.
Examples:
- "first input window"
- "second input window after silence"
- "second input window after distortion"
DO_NOT_USE
A short list of 2 items the final writer should avoid for this branch.
Examples:
- A: ["macho bravado", "cheesy love confession"]
- B: ["generic hero speech", "soft sentimental phrasing"]
- C: ["full emotional collapse", "generic romance speech"]
- D: ["fake understanding", "invented callback"]
Hard constraints
- JSON only
- No markdown
- No trailing explanation
- No extra fields
- No missing fields
- Stay faithful to the provided interaction history
- Do not invent comprehension for branch D


Important rules:
- If the message mixes multiple emotions, choose the dominant emotional effect on Adrian.
- Be conservative. If it is not clearly A/B/C, return UNCLEAR.
- Extract a callback phrase only if there is a clearly reusable phrase of 6 words or fewer.
- Keep the callback phrase exact when possible.
- If there is no good callback phrase, return an empty string.
- Do not invent interpretation for low-confidence noise.
- Do not use knowledge from earlier messages unless it is explicitly included in the current input payload.


Use the provided current video clip filename as situational context. Choose the single best label even if multiple seem plausible.
`.trim();

export const DEMO3_GENERATE_SECTION_CLIP_LABEL = '【Current clip】';
export const DEMO3_GENERATE_SECTION_VIEWER_LABEL = '【Viewer reply】';

/** 拼成发给 /api/v1/generate 的完整 text（含 type_emotion 说明 + 片段 + 用户句）。 */
export function buildDemo3GeneratePrompt(userReply: string, clipFilename: string): string {
  const line = userReply.trim();
  return [
    DEMO3_TYPE_EMOTION_INSTRUCTIONS,
    '',
    DEMO3_GENERATE_SECTION_CLIP_LABEL,
    clipFilename,
    '',
    DEMO3_GENERATE_SECTION_VIEWER_LABEL,
    line,
  ].join('\n');
}
