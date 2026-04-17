import {
  PROMPT_TTS_EMPTY_USER_LINE,
  PROMPT_TTS_SCENE_BACKGROUND,
  PROMPT_TTS_SECTION_SCENE_LABEL,
  PROMPT_TTS_SECTION_USER_LABEL,
} from '../config/prompt.config';

export { PROMPT_TTS_SCENE_BACKGROUND };

/** Same payload shape as Prompt+TTS in the API test dialog. */
export function buildPromptTtsFullPrompt(userDialogue: string, sceneBackground?: string): string {
  const line = userDialogue.trim();
  const bg = sceneBackground?.trim() ? sceneBackground.trim() : PROMPT_TTS_SCENE_BACKGROUND;
  return [
    PROMPT_TTS_SECTION_SCENE_LABEL,
    bg,
    '',
    PROMPT_TTS_SECTION_USER_LABEL,
    line.length > 0 ? line : PROMPT_TTS_EMPTY_USER_LINE,
  ].join('\n');
}
