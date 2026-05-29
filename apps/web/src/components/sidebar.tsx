export interface NavItem {
  readonly id: string;
  readonly label: string;
}

export const APP_NAV_ITEMS: readonly NavItem[] = [
  { id: "chat", label: "Chat" },
  { id: "agents", label: "Agents" },
  { id: "workflows", label: "Workflows" },
  { id: "tasks", label: "Tasks" },
  { id: "runtimes", label: "Runtimes" },
  { id: "audit", label: "Audit" },
  { id: "settings", label: "Settings" },
];

export function renderSidebarHtml(activeItemId = "chat"): string {
  return `<nav class="agentdeck-sidebar" aria-label="Workspace navigation">${APP_NAV_ITEMS.map(
    (item) =>
      `<a class="agentdeck-nav-item${item.id === activeItemId ? " is-active" : ""}" href="#${item.id}">${item.label}</a>`,
  ).join("")}</nav>`;
}
