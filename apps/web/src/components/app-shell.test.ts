import { describe, expect, it } from "vitest";

import { APP_NAV_ITEMS, APP_SHELL_PANEL_WIDTHS, renderAppShellHtml } from "./app-shell-model.js";

describe("app shell", () => {
  it("renders top bar, sidebar, main work area, and contextual inspector", () => {
    const html = renderAppShellHtml();

    expect(html).toContain("AgentDeck");
    expect(html).toContain("agentdeck-sidebar");
    expect(html).toContain("agentdeck-work-area");
    expect(html).toContain("agentdeck-inspector");
  });

  it("includes dense workspace navigation entries", () => {
    expect(APP_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Chat",
      "Agents",
      "Workflows",
      "Tasks",
      "Runtimes",
      "Audit",
      "Settings",
    ]);
  });

  it("uses stable panel widths for desktop layout", () => {
    expect(APP_SHELL_PANEL_WIDTHS).toEqual({
      sidebar: "236px",
      inspector: "320px",
    });
    expect(renderAppShellHtml()).toContain("grid-template-columns:236px minmax(0,1fr) 320px");
  });
});
