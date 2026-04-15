/** Shared with GenerateApiTestDialog Prompt+TTS tab — scene background + user line. */
export const PROMPT_TTS_SCENE_BACKGROUND =
  'Sole astronaut trapped alone on a long-drifting, damaged spaceship in deep space. All repairs, power restoration, orbit correction, and backup system switches have failed. The astronaut barely fixed a broken communication relay, gaining only one unstable real-time video transmission window to Earth. The viewer receives the latest fragmented video log. The astronaut is almost completely desperate, with only one suicidal last option: extravehicular spacewalk to manually repair the engine and propulsion system, which may cause a catastrophic explosion and destroy the whole ship. If the user sends a response, the astronaut will find hope and attempt the final gamble; if no response, the astronaut delivers a final farewell monologue. Dark, lonely, cinematic sci-fi atmosphere, high tension, emotional close-up, realistic space details. And response the user, the response contents should be a short text, no more than 50 words';

/** Same payload shape as Prompt+TTS in the API test dialog. */
export function buildPromptTtsFullPrompt(userDialogue: string, sceneBackground?: string): string {
  const line = userDialogue.trim();
  const bg = sceneBackground?.trim() ? sceneBackground.trim() : PROMPT_TTS_SCENE_BACKGROUND;
  return [
    '【Scene / background】',
    bg,
    '',
    '【User dialogue (viewer reply, may be empty)】',
    line.length > 0 ? line : '(no user input)',
  ].join('\n');
}
