# `main` 相对于 `integrate/mse-from-zip` 的差异分析

## 比对范围
- 基准分支：`origin/integrate/mse-from-zip`
- 目标分支：`origin/main`
- 比对口径：仅统计 **main 新增**（`integrate..main`）改动

## 分支关系结论
- 提交差异计数（`origin/integrate/mse-from-zip...origin/main`）：`1 6`
  - 含义：`integrate/mse-from-zip` 独有 1 个提交，`main` 独有 6 个提交
- 本文聚焦：`main` 独有的 6 个提交与对应代码改动

## `main` 新增提交（按时间先后）
1. `75a3aa6` merge: integrate/mse-from-zip into main
2. `38354d4` merge: integrate/mse-from-zip into main
3. `862e830` add demo3
4. `88fcdd3` complete all the demo 3
5. `d9fa591` fix bugs
6. `18ff999` fix all the issues for demo3

## 总体变更规模
- 文件变更：32
- 代码变更：`2968 insertions`, `69 deletions`
- 主要集中模块：
  - Demo 3 功能链路（交互、分支测试、叙事与语音）
  - 调试/环境配置体系
  - Demo 页面播放控制与滚动联动
  - 资源预加载/缓存
  - 构建产物与静态素材更新

## 模块级差异与具体内容

### 1) App 入口与运行时能力装配
**涉及文件**
- `src/app/App.tsx`（M）
- `src/app/config/app.config.ts`（A）
- `src/app/context/DemoDebugContext.tsx`（A）
- `src/app/context/ApiEnvContext.tsx`（A）

**具体改动**
- `App.tsx` 新增调试与 API 环境 Provider 包裹：
  - 引入并挂载 `DemoDebugProvider`、`ApiEnvProvider`
- `App.tsx` 新增调试面板能力开关：
  - 条件渲染 `DemoDebugPanel`
  - 条件渲染 `GenerateApiTestDialog`
- 新增运行时配置文件：
  - `app.config.ts` 增加可配置开关（例如调试面板启用）
- 新增 API 环境上下文：
  - 支持切换 API 基础地址/环境参数（用于调试和测试）

### 2) Demo 页面滚动与播放行为重构
**涉及文件**
- `src/app/components/DemoPage.tsx`（M）
- `src/app/components/DemoFeed.tsx`（M）

**具体改动**
- `DemoPage.tsx`
  - 新增 `hasActivatedDemoPlayback`，避免初始状态下非预期自动播放
  - 滚动同步逻辑由定时器延迟收敛改为基于 `scrollTop/clientHeight` 的即时计算
  - 向 `DemoFeed` 传递 `shouldAutoStart`，由父层统一控制播放激活时机
- `DemoFeed.tsx`
  - 新增 `allowPlayback = isActive && shouldAutoStart`
  - 多处播放/切换逻辑增加 `isActive` 守卫，避免后台实例继续播放或抢状态
  - 非激活时主动 `pause + muted` 双视频实例
  - `autoPlay` 改为受 `allowPlayback` 控制
  - 增加 Demo1 分支阶段到逻辑文件名的映射与调试上报
  - 引入 `DEMO3_VIDEOS`，Demo3 数据源切换到本地/配置化视频列表

### 3) Demo3 交互主链路增强（核心新增）
**涉及文件**
- `src/app/components/LegacyDemoScreen.tsx`（M，变更量最大）
- `src/app/components/GenerateApiTestDialog.tsx`（A/M）
- `src/app/components/DemoDebugPanel.tsx`（A）
- `src/app/storyVideos.ts`（M）
- `src/app/utils/demo3BranchTest.ts`（A）
- `src/app/utils/demo3NarrationPrompt.ts`（A）
- `src/app/utils/demo3Prefetch.ts`（A）
- `src/app/utils/promptTtsClient.ts`（A/M）
- `src/app/config/ttsCloneVoice.ts`（A）
- `src/app/utils/generateClient.ts`（A/M）

**具体改动**
- `LegacyDemoScreen.tsx` 新增 Demo3 的完整交互与状态层：
  - Demo3 封面加载层（cover + loading）
  - 10 秒倒计时 UI（特定片段触发）
  - Replay/Retry 覆盖层
  - 文本输入浮层（底部输入 + Enter 提交）
  - 叙事文本生成状态（loading / error / narration text）
  - 视频多段切换与结束回环控制增强
- `GenerateApiTestDialog.tsx` 新增/增强 API 联调能力：
  - 用于生成接口测试与参数校验
- `DemoDebugPanel.tsx` 新增调试可视化面板：
  - 观察分支、请求、状态流
- `demo3BranchTest.ts` / `demo3NarrationPrompt.ts` / `demo3Prefetch.ts`
  - 分支判定、叙事 Prompt 模板、预取策略拆分为独立工具
- `promptTtsClient.ts` + `ttsCloneVoice.ts`
  - 增加 TTS/声音克隆相关配置与调用链

### 4) 媒体缓存与预加载策略
**涉及文件**
- `src/app/utils/mediaCache.ts`（A）
- `src/app/utils/videoPreload.ts`（M）

**具体改动**
- 新增媒体缓存模块，统一管理资源缓存生命周期
- 预加载逻辑增强（含事件监听策略调整，例如 `loadeddata/canplaythrough`）
- 降低切换白帧与首播等待，提升 Demo3 连续播放稳定性

### 5) 资产与构建产物更新
**涉及文件（源码资产）**
- `src/assets/Demo3-cover.jpg`（A）
- `src/assets/clone_voice.mp3`（A）
- `src/assets/.DS_Store`（D）

**涉及文件（构建产物）**
- `dist/index.html`（M）
- `dist/assets/*` 多个新增/替换（含 `Demo3-cover`、`BGVideo_cut`、新版 `index-*.js/css`）

**具体改动**
- 增加 Demo3 封面图与音频素材
- 重新构建导致哈希化静态资源整体替换

## 文件级清单（`integrate..main`）

### A（新增）
- `dist/assets/02608a605cb5f66ed702b0e5d56baf9602cd0e2d-CeJOWIsK.png`
- `dist/assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8-CDubxk4Q.png`
- `dist/assets/BGVideo_cut-BAjBbbsA.mp4`
- `dist/assets/Demo1-cover-C-lxWR1A.jpg`
- `dist/assets/Demo3-cover-D36KGEFD.jpg`
- `dist/assets/a911760b9fbec7c5395a98574e460d103840bb8e-BPkGrrEh.png`
- `dist/assets/c44981d37b8b400632b02c54d9b603b6c41cf8be-COLR56rp.png`
- `dist/assets/index-BLoTc2E1.js`
- `dist/assets/index-CCUSU6nI.css`
- `src/app/components/DemoDebugPanel.tsx`
- `src/app/components/GenerateApiTestDialog.tsx`
- `src/app/config/app.config.ts`
- `src/app/config/ttsCloneVoice.ts`
- `src/app/context/ApiEnvContext.tsx`
- `src/app/context/DemoDebugContext.tsx`
- `src/app/utils/demo3BranchTest.ts`
- `src/app/utils/demo3NarrationPrompt.ts`
- `src/app/utils/demo3Prefetch.ts`
- `src/app/utils/generateClient.ts`
- `src/app/utils/mediaCache.ts`
- `src/app/utils/promptTtsClient.ts`
- `src/assets/Demo3-cover.jpg`
- `src/assets/clone_voice.mp3`

### M（修改）
- `dist/index.html`
- `src/.DS_Store`
- `src/app/App.tsx`
- `src/app/components/DemoFeed.tsx`
- `src/app/components/DemoPage.tsx`
- `src/app/components/LegacyDemoScreen.tsx`
- `src/app/storyVideos.ts`
- `src/app/utils/videoPreload.ts`

### D（删除）
- `src/assets/.DS_Store`

## 合并前建议关注点
- Demo3 相关新增代码量大，建议优先做模块化回归：
  - `LegacyDemoScreen` 状态机与分支切换
  - `DemoFeed` 播放控制与滚动同步
  - `promptTtsClient` 与 API 环境配置兼容性
- `dist/` 产物改动较多，建议在合并策略上明确：
  - 是否保留产物入库
  - 或仅保留源码并在 CI 构建
- `main` 与 `integrate` 存在双向分叉（`1 vs 6`），建议合并时先处理 `integrate` 独有提交的冲突风险。
