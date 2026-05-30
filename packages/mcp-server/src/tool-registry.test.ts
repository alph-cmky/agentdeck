import { describe, expect, it } from "vitest";

import { createAgentDeckToolRegistry } from "./tool-registry.js";

const agent = {
  id: "reviewer",
  name: "Reviewer",
  description: "Reviews code",
  prompt: "Review the current diff.",
  model: "gpt-5",
  tools: ["repo.read"],
  permissions: {
    read: true,
    write: false,
    install: false,
    arbitraryCommands: false,
    commit: false,
    push: false,
  },
  memoryScope: "workspace",
  runtimePreference: "codex",
  workspaceRoot: "/tmp/agentdeck",
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z",
} as const;

const workflow = {
  id: "review-flow",
  name: "Review Flow",
  version: 1,
  status: "draft",
  variables: {},
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
    { id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" },
    { id: "end", type: "end", label: "End" },
  ],
  edges: [
    { id: "edge-start-review", from: "start", to: "agent-review" },
    { id: "edge-review-end", from: "agent-review", to: "end" },
  ],
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z",
} as const;

describe("createAgentDeckToolRegistry", () => {
  it("discovers read-only AgentDeck MCP tools", () => {
    const registry = createAgentDeckToolRegistry({
      agentRegistry: { list: async () => [agent] },
      workflowRegistry: { list: async () => [workflow], get: async () => workflow },
    });

    expect(registry.listTools()).toEqual([
      expect.objectContaining({
        name: "agentdeck.listAgents",
        description: "List configured AgentDeck agents.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      }),
      expect.objectContaining({
        name: "agentdeck.listWorkflows",
        description: "List persisted AgentDeck workflows.",
      }),
      expect.objectContaining({
        name: "agentdeck.getWorkflow",
        description: "Get one persisted AgentDeck workflow by ID.",
      }),
    ]);
  });

  it("calls read-only tools without exposing persistence internals", async () => {
    const registry = createAgentDeckToolRegistry({
      agentRegistry: { list: async () => [agent] },
      workflowRegistry: { list: async () => [workflow], get: async () => workflow },
    });

    await expect(registry.callTool("agentdeck.listAgents", {})).resolves.toEqual({
      agents: [agent],
    });
    await expect(registry.callTool("agentdeck.listWorkflows", {})).resolves.toEqual({
      workflows: [workflow],
    });
    await expect(
      registry.callTool("agentdeck.getWorkflow", { id: "review-flow" }),
    ).resolves.toEqual({
      workflow,
    });
  });

  it("returns a clear error for unknown tools and missing workflows", async () => {
    const registry = createAgentDeckToolRegistry({
      agentRegistry: { list: async () => [] },
      workflowRegistry: { list: async () => [], get: async () => undefined },
    });

    await expect(registry.callTool("agentdeck.nope", {})).rejects.toThrow(
      'MCP tool "agentdeck.nope" is not registered.',
    );
    await expect(registry.callTool("agentdeck.getWorkflow", { id: "missing" })).rejects.toThrow(
      'Workflow "missing" was not found.',
    );
  });
});
