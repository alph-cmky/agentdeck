import type { WorkflowDefinition } from "@agentdeck/workflow-core";

import { renderAppShellHtml } from "../components/app-shell-model.js";
import { renderRuntimeDashboardHtml } from "../features/runtimes/runtime-dashboard.js";
import type { RuntimeDashboardResult } from "../features/runtimes/runtime-status-row.js";
import { renderWorkflowCanvasHtml } from "../features/workflows/workflow-canvas.js";

export async function renderHomePageHtml(): Promise<string> {
  const mainContent = `<div class="agentdeck-mvp-stack">
  ${renderRuntimeDashboardHtml(sampleRuntimes)}
  ${await renderWorkflowCanvasHtml({
    workflow: sampleWorkflow,
    selectedNodeId: "agent-review",
  })}
</div>`;

  return renderAppShellHtml({
    activeNav: "workflows",
    title: "MVP Workspace",
    description:
      "Inspect local runtimes and validate a workflow DAG from the same runnable browser surface.",
    actionLabel: "New workflow",
    mainContent,
  });
}

const sampleRuntimes: readonly RuntimeDashboardResult[] = [
  runtime("codex", "OpenAI Codex CLI", "ready", {
    path: "/usr/local/bin/codex",
    version: "0.128.0",
    capabilities: { exec: true, mcp: true, versionCommand: true },
  }),
  runtime("claude", "Claude Code", "configured", {
    path: "/usr/local/bin/claude",
    version: "1.2.3",
    capabilities: { exec: true, versionCommand: true },
  }),
  runtime("ollama", "Ollama", "localProviderReady", {
    path: "/usr/local/bin/ollama",
    version: "0.9.0",
    capabilities: { chat: true, localProviders: ["llama3.2"], versionCommand: true },
  }),
  runtime("lmstudio", "LM Studio", "ready", {
    path: "/usr/local/bin/lms",
    version: "0.3.0",
    capabilities: { chat: true, localProviders: ["local models"], versionCommand: true },
  }),
  runtime("node", "Node.js", "ready", {
    path: "/usr/local/bin/node",
    version: "v24.1.0",
    capabilities: { exec: true, versionCommand: true },
  }),
  runtime("git", "Git", "ready", {
    path: "/usr/bin/git",
    version: "git version 2.50.0",
    capabilities: { exec: true, versionCommand: true },
  }),
  runtime("code", "Visual Studio Code CLI", "missing", {
    warnings: ["code command not found"],
  }),
];

const sampleWorkflow: WorkflowDefinition = {
  id: "review-flow",
  name: "Review Flow",
  version: 1,
  status: "draft",
  variables: {
    reviewScope: "current diff",
  },
  permissions: {
    read: true,
    write: false,
    install: false,
    arbitraryCommands: false,
    commit: false,
    push: false,
  },
  nodes: [
    { id: "start", type: "start", label: "Start" },
    { id: "agent-review", type: "agent", label: "Review current diff", agentId: "reviewer" },
    {
      id: "human-approval",
      type: "humanApproval",
      label: "Maintainer approval",
      approverRole: "maintainer",
    },
    { id: "end", type: "end", label: "End" },
  ],
  edges: [
    { id: "edge-start-review", from: "start", to: "agent-review" },
    { id: "edge-review-approval", from: "agent-review", to: "human-approval" },
    { id: "edge-approval-end", from: "human-approval", to: "end" },
  ],
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
};

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
    scope: status === "missing" ? [] : ["global"],
    capabilities: {},
    warnings: [],
    lastDetectedAt: "2026-05-29T00:00:00.000Z",
    ...overrides,
  };
}
