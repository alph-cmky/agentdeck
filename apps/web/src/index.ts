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
export { renderNodeInspectorHtml } from "./features/workflows/node-inspector.js";
export {
  WORKFLOW_PALETTE_ITEMS,
  labelForWorkflowNodeType,
  renderNodePaletteHtml,
} from "./features/workflows/node-palette.js";
export type { WorkflowPaletteItem } from "./features/workflows/node-palette.js";
export { renderWorkflowCanvasHtml } from "./features/workflows/workflow-canvas.js";
export type { WorkflowCanvasState } from "./features/workflows/workflow-canvas.js";
