# Demo 交互能力重构蓝图（通用化）

## 1. 文档信息
- 产品名称：NaravoAI Website
- 文档名称：Demo 交互能力重构蓝图
- 文档版本：v0.2（评审稿）
- 更新时间：2026-04-12
- 适用范围：`src/app/components/DemoFeed.tsx`、`src/app/components/LegacyDemoScreen.tsx` 及后续新增 Demo

## 2. 背景与问题定义
当前 Demo 交互实现存在以下结构性问题：
- 播放壳层能力（暂停/恢复、激活态切换、Loading 遮罩、全屏 UI 控制）散落在 Demo1 与 Legacy Demo 中，复用困难。
- 交互规则（点击分支、文本输入分支）与播放器行为耦合，后续新增交互类型会不断叠加 `if/else`。
- 业务命名和实现路径绑定 `demo.id`、`demo3` 等历史语义，顺序调整或内容替换后维护成本高。
- 同类问题会重复出现（例如：滑动切换后有声音但仍显示 Loading）。

本蓝图目标是把“播放器共性能力”与“剧情交互策略”解耦，形成可配置、可复用、可渐进迁移的架构。

## 3. 目标与非目标
### 3.1 目标
- 任意 Demo 可复用同一套播放壳层能力：
  - 点击画面暂停/恢复
  - 中央播放按钮样式与位置一致（由壳层统一渲染）
  - Replay 按钮样式与位置一致（由壳层统一渲染）
  - 离屏自动暂停，回屏自动恢复
  - 全屏时自动隐藏非核心 UI
  - 统一 Loading/首帧就绪判定
- 任意 Demo 可复用同一套互动外壳能力：
  - 头像区、点赞、评论、角色入口等交互位
  - 顶部导航（返回按钮 + More 菜单）行为一致
  - 全屏时按策略统一隐藏或降噪
  - 点赞/评论/角色弹层的状态管理与埋点口径一致
- 任意 Demo 可按配置接入交互策略：
  - 点击计数分支（Demo1 型）
  - 文本输入 + API 分支（当前 Demo2 型）
  - 后续可能新增的语音/手势等其他交互策略
- 用“场景配置 + 策略键”替代“硬编码 demo.id 分支”。
- 支持渐进式迁移，先不改视觉与现有业务结果。

### 3.2 非目标
- 本期不重写 UI 视觉层，不改文案、不改设计稿。
- 本期不强制一次性迁移所有 Demo 逻辑。
- 本期不引入后端协议变更。

## 4. 设计原则
- 分层清晰：播放器壳层、交互策略层、场景配置层分离。
- 先收敛共性，再拆分差异：避免过度抽象。
- 可回退：每个迁移阶段可独立上线并验证。
- 向后兼容：先通过适配器保留当前行为，再逐步替换旧逻辑。

## 5. 目标架构（高层）
### 5.1 四层结构
1. Player Shell（共享）
   - 负责媒体生命周期和跨 Demo 一致行为。
2. Engagement Layer（共享）
   - 负责头像、点赞、评论、角色、底部信息区等“互动外壳”。
3. Interaction Strategy（按类型）
   - 负责“输入 -> 状态转移 -> 下一段视频”的规则。
4. Scenario Config（按 Demo 数据）
   - 负责该 Demo 的媒体图、交互窗口、策略参数、UI 开关。

### 5.2 目录建议（新增）
- `src/app/interactive/core/`
- `src/app/interactive/engagement/`
- `src/app/interactive/strategies/`
- `src/app/interactive/scenarios/`
- `src/app/interactive/types/`

## 6. 模块边界定义
### 6.1 Player Shell（共享）
职责：
- 管理 active/inactive 播放状态（离屏暂停、回屏恢复）。
- 管理“用户主动暂停”与“系统暂停”的区分。
- 管理全屏模式与非核心 UI 的显隐策略。
- 管理首帧就绪、loading 遮罩、播放按钮 overlay。
- 管理结束态 Replay overlay（统一样式、统一居中位置、文案可配置）。
- 对上暴露统一事件：`onPhaseChange`、`onPlaybackStateChange`、`onError`。

不负责：
- 分支业务判定。
- API 业务请求。
- 点赞/评论/角色等社交交互状态。

### 6.2 Engagement Layer（共享）
职责：
- 渲染并管理头像区、点赞按钮、评论入口、角色入口、底部元信息区。
- 渲染并管理顶部导航与 More 菜单（开关、点击空白关闭、层级规则）。
- 管理评论抽屉、角色抽屉等通用弹层状态。
- 对外暴露统一事件：`onLikeToggle`、`onOpenComments`、`onOpenCast`。
- 根据 `PlayerShellState` 和 `Scenario UI 配置` 决定显隐（例如全屏时隐藏非核心控件）。

不负责：
- 视频播放控制和 media ready 状态。
- 剧情分支判定和 API 请求。

建议：
- Engagement Layer 使用“受控 props + 事件回调”，不持有业务分支状态。
- Demo 特有文案和计数通过 scenario 注入，不在共享组件内硬编码。

### 6.3 Interaction Strategy（按类型）
职责：
- 输入事件处理（点击、文本、定时器、API 结果）。
- 维护策略内部状态机。
- 返回下一媒体节点、是否弹输入框、是否结束等策略输出。

不负责：
- video 元素真实播放控制。
- 通用 loading、暂停、全屏 UI。
- 点赞/评论/角色等社交 UI 结构和开关。

### 6.4 Scenario Config（按 Demo）
职责：
- 定义媒体节点、节点关系、入口节点。
- 声明使用哪种策略（`strategyKey`）。
- 提供策略参数（阈值、倒计时、API 路由等）。
- 定义 UI 能力开关（是否展示评论、角色、暂停、全屏按钮等）。

## 7. 关键类型草案（接口级）
```ts
export type StrategyKey = 'tap-branch' | 'text-emotion-branch' | 'placeholder';

export type DemoScenario = {
  id: string;
  title: string;
  strategyKey: StrategyKey;
  entryNodeId: string;
  nodes: Record<string, MediaNode>;
  ui: DemoUiOptions;
  strategyConfig: Record<string, unknown>;
};

export type MediaNode = {
  id: string;
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  allowPauseOnSurfaceTap?: boolean;
  next?: string[]; // 可选，具体选择由 strategy 决定
};

export type DemoUiOptions = {
  enableLike: boolean;
  enableComment: boolean;
  enableCast: boolean;
  enableFullscreen: boolean;
  hideNonInteractiveUiWhenFullscreen: boolean;
};

export type DemoEngagementMeta = {
  title: string;
  subtitle?: string;
  commentCountText?: string;
  likeCountText?: string;
  avatarUrl?: string;
};

export type PlayerShellState = {
  isActive: boolean;
  isPausedByUser: boolean;
  isLoading: boolean;
  isInitialFrameReady: boolean;
  isFullscreen: boolean;
};
```

## 8. 共享行为抽象清单（必须复用）
以下能力统一进 Player Shell，不允许在策略层重复实现：
- 点击视频面暂停/恢复（可按 node 配置开关）。
- 滑出当前 Demo 自动暂停；滑回恢复到原时间点。
- 主动暂停时显示中心播放按钮；非主动暂停不显示。
- Replay 按钮统一由壳层渲染，策略只提供 `showReplay / onReplay / replayLabel`。
- 全屏时隐藏非核心 UI；退出全屏恢复。
- 视频 readyState 兜底判定，避免“已播放但仍 loading”。
- 通用错误态与重试入口（可视与日志）。

以下能力统一进 Engagement Layer，不允许散落在各 Demo 页面：
- 头像区 + 点赞 + 评论 + 角色入口的布局与交互手势。
- 评论抽屉、角色抽屉的开关和关闭行为。
- 全屏状态下的显隐策略（读取 `hideNonInteractiveUiWhenFullscreen`）。
- 点赞态与计数展示（本地态或外部注入态）。

## 9. 策略拆分建议
### 9.1 `tap-branch`（Demo1）
- 输入：点击频率/次数、倒计时结束。
- 输出：分支节点（click/hold/rapid）。
- 约束：10 秒窗口、阈值配置化。

### 9.2 `text-emotion-branch`（当前 Demo2）
- 输入：用户文本、超时空输入、API 返回 emotion_type。
- 输出：下一节点、是否继续提示输入、是否终局。
- 约束：API 失败兜底、多轮输入规则配置化。

### 9.3 `placeholder`（当前 Demo3）
- 输入：仅播放结束。
- 输出：下一节点或循环。
- 用途：占位 Demo 的最小策略，后续可平滑替换为真实策略。

## 10. 迁移方案（分阶段）
### Phase 0：准备期（不改行为）
- 新增 `types` 与 `scenario` 定义文件。
- 把现有 Demo 数据从组件内部常量迁到 `scenarios`。
- 保持旧组件逻辑不动，仅做数据来源调整。

### Phase 1：抽离 Player Shell（优先）
- 先从 Demo1 提取通用播放行为到 `usePlayerShell`。
- Legacy Demo 通过适配层复用 `usePlayerShell`，不立即改策略逻辑。
- 抽离统一中心 overlay 组件（暂停恢复按钮 + Replay 按钮）。
- 验证“暂停/恢复/离屏/回屏/全屏 UI”在所有 Demo 一致。

### Phase 1.5：抽离 Engagement Layer
- 把头像、点赞、评论、角色、底部信息区抽到共享组件（建议 `DemoEngagementPanel`）。
- 把评论抽屉、角色抽屉提炼成可配置子组件。
- 验证 Demo1、当前 Demo2、当前 Demo3 三者交互入口一致。

### Phase 2：策略化 Demo1
- 把 Demo1 互动规则迁到 `tap-branch.strategy`。
- `DemoFeed` 改为“Shell + strategy”组合。

### Phase 3：策略化当前 Demo2
- 把 `demo3*` 相关状态迁到 `text-emotion-branch.strategy`。
- 命名去历史包袱（不用 `demo3` 前缀，改为 `emotionFlow` 等语义命名）。

### Phase 4：统一入口与下线旧实现
- `DemoPage` 统一从 `scenario + strategyKey` 渲染。
- 删除 `demo.id === 3` 这类分支。
- 合并重复逻辑并补齐文档。

## 11. 风险与规避
- 风险：重构过程中行为漂移。
  - 规避：分阶段迁移，每阶段只改一层。
- 风险：策略接口设计过重。
  - 规避：先满足 Demo1 + Demo2 两种类型，不提前抽象未知能力。
- 风险：媒体加载与切槽问题回归。
  - 规避：保留 readyState 兜底与事件双保险，增加回归清单。

## 12. 验收标准（架构重构口径）
### 12.1 一致性
- 三个 Demo 都支持离屏暂停、回屏续播、全屏隐藏非核心 UI。
- 暂停播放按钮行为一致。
- Replay 按钮位置、样式、交互反馈一致（仅文案可配置，例如 `Replay/Retry`）。
- 三个 Demo 的点赞/评论/角色入口和抽屉行为一致。

### 12.2 可扩展性
- 新增一个 Demo 时，不需要在组件里追加 `if (demo.id === x)`。
- 新增策略时，只新增 strategy 文件与 scenario 配置。
- 调整互动外壳样式或行为时，不需要分别修改 Demo1 与 Legacy Demo。

### 12.3 稳定性
- 不再出现“声音正常但 loading 遮罩不消失”。
- Demo 顺序变更不影响交互行为（与位置解耦）。

## 13. 实施前确认清单（待你拍板）
- 是否同意以 `scenario + strategyKey` 作为唯一绑定方式。
- 是否同意先做 Phase 1（Player Shell 抽离）再做策略迁移。
- 是否需要在本期同时做命名清理（去除 `demo3*` 前缀）。
- 是否要求在每个 Phase 后都出一份对照回归报告。
