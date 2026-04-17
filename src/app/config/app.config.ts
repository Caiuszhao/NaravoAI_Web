/**
 * 运行时行为开关（改后需重新构建 / 刷新页面）。
 * 接口基址仍定义在 `utils/generateClient.ts`；此处只控制默认走哪一套。
 */

export type ApiEnvironmentMode = 'test' | 'production';

export const appRuntimeConfig = {
  /**
   * 无 localStorage 记录时的默认接口环境。
   * - `production` → `DEFAULT_GENERATE_API_BASE_URL`（线上）
   * - `test` → `LOCAL_GENERATE_API_BASE_URL`（本机，如 127.0.0.1:8000）
   */
  defaultApiEnvironment: 'production' satisfies ApiEnvironmentMode,

  /** 是否显示调试 UI：左下角 Debug 面板 + 首页 API 测试浮层 */
  enableDebugPanel: false,

  /**
   * Debug UI 显示方式：
   * - true: 需点击左上角 Logo 5 次才切换显示/隐藏
   * - false: 直接显示 Debug 面板 + API Test（仅受 enableDebugPanel 控制）
   */
  debugPanelRequireFiveTaps: true,
} as const;

export type AppRuntimeConfig = typeof appRuntimeConfig;

