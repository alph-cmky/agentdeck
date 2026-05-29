import { describe, expect, it } from "vitest";

import { renderHomePageHtml } from "./page-model.js";

describe("renderHomePageHtml", () => {
  it("renders the MVP app shell, runtime dashboard, and workflow canvas", async () => {
    const html = await renderHomePageHtml();

    expect(html).toContain("AgentDeck");
    expect(html).toContain("runtime-dashboard");
    expect(html).toContain("OpenAI Codex CLI");
    expect(html).toContain("workflow-canvas-shell");
    expect(html).toContain("Review Flow");
  });
});
