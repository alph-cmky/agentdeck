import { APP_NAV_ITEMS, renderSidebarHtml } from "./sidebar.js";
import { renderInspectorHtml } from "./inspector.js";

export { APP_NAV_ITEMS } from "./sidebar.js";

export const APP_SHELL_PANEL_WIDTHS = {
  sidebar: "236px",
  inspector: "320px",
} as const;

export function renderAppShellHtml(): string {
  return `<div class="agentdeck-shell">
  <header class="agentdeck-topbar">
    <div class="agentdeck-brand">AgentDeck</div>
    <div class="agentdeck-topbar-meta">Local workspace</div>
  </header>
  <div class="agentdeck-layout" style="grid-template-columns:${APP_SHELL_PANEL_WIDTHS.sidebar} minmax(0,1fr) ${APP_SHELL_PANEL_WIDTHS.inspector}">
    ${renderSidebarHtml("chat")}
    <main class="agentdeck-work-area" aria-label="Primary work area">
      <section class="agentdeck-work-header">
        <div>
          <h1>Chat</h1>
          <p>Coordinate agents, workflows, runtime checks, and pending tasks from one dense workspace.</p>
        </div>
        <button type="button">New task</button>
      </section>
      <section class="agentdeck-work-grid" aria-label="Workspace summary">
        ${APP_NAV_ITEMS.slice(0, 5)
          .map((item) => `<article><h2>${item.label}</h2><p>${item.id}</p></article>`)
          .join("")}
      </section>
    </main>
    ${renderInspectorHtml()}
  </div>
</div>`;
}
