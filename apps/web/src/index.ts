export const webAppName = "@agentdeck/web";

export { AppShell } from "./components/app-shell.js";
export {
  APP_NAV_ITEMS,
  APP_SHELL_PANEL_WIDTHS,
  renderAppShellHtml,
} from "./components/app-shell-model.js";
export { renderInspectorHtml } from "./components/inspector.js";
export { renderSidebarHtml } from "./components/sidebar.js";
export type { NavItem } from "./components/sidebar.js";
export { renderRuntimeDashboardHtml } from "./features/runtimes/runtime-dashboard.js";
export { renderRuntimeStatusRowHtml } from "./features/runtimes/runtime-status-row.js";
export type {
  RuntimeDashboardCapabilities,
  RuntimeDashboardResult,
} from "./features/runtimes/runtime-status-row.js";
