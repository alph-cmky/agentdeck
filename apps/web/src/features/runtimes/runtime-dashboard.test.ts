import { describe, expect, it } from "vitest";

import { renderRuntimeDashboardHtml } from "./runtime-dashboard.js";
import type { RuntimeDashboardResult } from "./runtime-status-row.js";

const runtimeRows: RuntimeDashboardResult[] = [
  runtime("codex", "OpenAI Codex CLI", "ready", {
    path: "/usr/local/bin/codex",
    version: "0.128.0",
  }),
  runtime("claude", "Claude Code", "configured", {
    path: "/usr/local/bin/claude",
    version: "1.2.3",
  }),
  runtime("ollama", "Ollama", "localProviderReady", {
    path: "/usr/local/bin/ollama",
    version: "0.9.0",
  }),
  runtime("lmstudio", "LM Studio", "ready", { path: "/usr/local/bin/lms", version: "0.3.0" }),
  runtime("node", "Node.js", "ready", { path: "/usr/local/bin/node", version: "v24.1.0" }),
  runtime("git", "Git", "ready", { path: "/usr/bin/git", version: "git version 2.50.0" }),
  runtime("code", "Visual Studio Code CLI", "missing", {
    warnings: ["missing with token=abc123"],
  }),
];

describe("renderRuntimeDashboardHtml", () => {
  it("renders Codex, Claude, Ollama, LM Studio, Node, Git, and VS Code in one table", () => {
    const html = renderRuntimeDashboardHtml(runtimeRows);

    for (const label of [
      "OpenAI Codex CLI",
      "Claude Code",
      "Ollama",
      "LM Studio",
      "Node.js",
      "Git",
      "Visual Studio Code CLI",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("<table");
  });

  it("renders status, path, version, capabilities, and warnings", () => {
    const html = renderRuntimeDashboardHtml(runtimeRows);

    expect(html).toContain("localProviderReady");
    expect(html).toContain("/usr/local/bin/codex");
    expect(html).toContain("0.128.0");
    expect(html).toContain("exec");
    expect(html).toContain("chat");
    expect(html).toContain("missing with token=[REDACTED]");
  });

  it("shows missing runtime guidance and avoids secret-like values", () => {
    const html = renderRuntimeDashboardHtml(runtimeRows);

    expect(html).toContain("Install or configure Visual Studio Code CLI");
    expect(html).not.toContain("abc123");
  });
});

function runtime(
  type: RuntimeDashboardResult["type"],
  name: string,
  status: RuntimeDashboardResult["status"],
  overrides: Partial<RuntimeDashboardResult> = {},
): RuntimeDashboardResult {
  return {
    id: type,
    name,
    type,
    status,
    detected: status !== "missing",
    scope:
      status === "localProviderReady"
        ? ["global", "localProvider"]
        : status === "missing"
          ? []
          : ["global"],
    capabilities: {
      exec: type === "codex" || type === "claude" || type === "node",
      chat: type === "ollama" || type === "lmstudio",
      versionCommand: status !== "missing",
    },
    warnings: [],
    lastDetectedAt: "2026-05-29T00:00:00.000Z",
    ...overrides,
  };
}
