/** 与 Prompt+TTS 测试页默认用户句一致，便于复现 narration / generate 行为。 */
export const DEMO3_FIXED_TEST_REPLY = "I'm here. Hold on—we're with you.";

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
