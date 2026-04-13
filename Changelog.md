## 2026-04-13 18:30 (main merge)

### Summary
- 将 `UX_opt_412` 合并进 `main`，把 Demo3 的生产级交互链路（加载、输入、分支、重试、叙事/TTS、调试）整体接入主干。
- Demo 播放与滚动联动逻辑做了状态隔离：仅激活实例允许播放与切换，减少多实例串扰、后台播放和切段时序问题。
- 新增一套互动层组件（TopBar、EngagementPanel、Comments/Cast 抽屉、PlayerShell 中心覆盖），把交互 UI 从旧耦合实现拆分为可组合模块。抽象需求细节见相关文档：src/PRD/PRD_Demo_Interaction_Architecture_Blueprint.md。但目前没有做 Demo 视频互动交互逻辑的抽象，这个留待完善好 Demo2 后再做。
- 增加运行时配置与 API 环境上下文，支持点击 Logo 5 次在页面内打开和关闭调试弹窗和联调环境。
- 调整 Demo Feed 展示顺序：将 `Demo3` 提前到 `Demo2` 之前（顺序从 `1-2-3` 调整为 `1-3-2`），确保用户更早进入可交互的文本/语音分支体验。
- 文档侧更新 PRD：移除旧版 Demo1 文档，新增互动架构蓝图文档，统一后续实现依据。

### 逻辑变化与影响范围
- 播放控制策略变化：
  - `DemoPage` + `DemoFeed` 引入 `shouldAutoStart/allowPlayback`，激活态与播放态解耦。
  - 影响：同屏多 Demo 或快速滚动时，非当前卡片不再“偷播/抢状态”。
- Demo3 流程状态机增强（`LegacyDemoScreen`）：
  - 新增封面加载层、倒计时、输入框提交流程、叙事生成态、Retry 层。
  - 影响：用户链路从“看视频”升级为“输入-分支-反馈”的闭环。
- 调试与联调能力前置到主应用：
  - `App` 接入 `DemoDebugProvider`、`ApiEnvProvider`、`GenerateApiTestDialog`、`DemoDebugPanel`。
  - 影响：问题定位从“改代码+重启”变为“界面内可观测/可切换”。
- 互动 UI 模块化：
  - 新增 `src/app/interactive/**` 下多个组件与类型定义。
  - 影响：后续新增互动玩法时可在模块层扩展，减少改动半径。
- Demo 场景排序调整：
  - `src/app/interactive/scenarios/demoScenarios.ts` 中 `DEMOS` 调整为 `[STORY_CONFIG, LEGACY_DEMO_3, LEGACY_DEMO_2]`。
  - 影响：主播放流第二个卡片即进入 Demo3 互动链路，缩短用户到达“可输入/可分支”场景的路径。

### Commits
- fcab65b merge: UX_opt_412 into main (Caiuszhao)
- 56d5c9c chore: sync UX_opt_412 updates with changelog (Caiuszhao)
- 04f08b2 refactor demo playback shell and unify engagement interactions (Caiuszhao)
- 18ff999 fix all the issues for demo3 (smith)
- d9fa591 fix bugs (smith)
- 88fcdd3 complete all the demo 3 (smith)
- 862e830 add demo3 (smith)

### Files Changed
- 应用入口与上下文：
  - M `src/app/App.tsx`
  - A `src/app/config/app.config.ts`
  - A `src/app/config/ttsCloneVoice.ts`
  - A `src/app/context/ApiEnvContext.tsx`
  - A `src/app/context/DemoDebugContext.tsx`
- Demo 核心流程：
  - M `src/app/components/DemoPage.tsx`
  - M `src/app/components/DemoFeed.tsx`
  - M `src/app/components/LegacyDemoScreen.tsx`
  - A `src/app/components/GenerateApiTestDialog.tsx`
  - A `src/app/components/DemoDebugPanel.tsx`
- 互动层模块：
  - A `src/app/interactive/core/PlayerShellCenterOverlay.tsx`
  - A `src/app/interactive/core/usePlayerShell.ts`
  - A `src/app/interactive/engagement/DemoTopBar.tsx`
  - A `src/app/interactive/engagement/DemoEngagementPanel.tsx`
  - A `src/app/interactive/engagement/DemoCommentsDrawer.tsx`
  - A `src/app/interactive/engagement/DemoCastDrawer.tsx`
  - A `src/app/interactive/scenarios/demoScenarios.ts`
  - A `src/app/interactive/types/demo.ts`
- 媒体与工具：
  - M `src/app/storyVideos.ts`
  - A `src/app/utils/mediaCache.ts`
  - A `src/app/utils/generateClient.ts`
  - A `src/app/utils/promptTtsClient.ts`
  - A `src/app/utils/demo3BranchTest.ts`
  - A `src/app/utils/demo3NarrationPrompt.ts`
  - A `src/app/utils/demo3Prefetch.ts`
  - M `src/app/utils/videoPreload.ts`
  - A `src/assets/Demo3-cover.jpg`
  - A `src/assets/clone_voice.mp3`
- 文档与构建：
  - A `src/PRD/PRD_Demo_Interaction_Architecture_Blueprint.md`
  - D `src/PRD/PRD_Demo1_Interactive_Video.md`
  - M `dist/index.html`
  - A/D `dist/assets/index-*.js`, `dist/assets/index-*.css`（构建产物哈希变更）

---
