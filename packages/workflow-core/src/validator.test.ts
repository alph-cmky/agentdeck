import { describe, expect, it } from "vitest";

import { validateWorkflowSafety } from "./validator.js";
import type { WorkflowDefinition } from "./workflow-schema.js";

const baseWorkflow: WorkflowDefinition = {
  id: "workflow-review",
  name: "Review workflow",
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
    { id: "tool-diff", type: "tool", label: "Diff", toolId: "git.diff" },
    { id: "end", type: "end", label: "End" },
  ],
  edges: [
    { id: "edge-1", from: "start", to: "agent-review" },
    { id: "edge-2", from: "agent-review", to: "tool-diff" },
    { id: "edge-3", from: "tool-diff", to: "end" },
  ],
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
};

describe("validateWorkflowSafety", () => {
  it("accepts a valid workflow with resolved agents and tools", async () => {
    const result = await validateWorkflowSafety(baseWorkflow, {
      resolveAgent: async (agentId) => agentId === "reviewer",
      resolveTool: async (toolId) => toolId === "git.diff",
      toolPermissions: {
        "git.diff": { read: true },
      },
      toolIo: {
        "git.diff": {
          accepts: ["text"],
          produces: ["diff"],
        },
      },
      nodeIo: {
        "agent-review": {
          produces: ["text"],
        },
      },
    });

    expect(result).toEqual({ success: true, errors: [] });
  });

  it("returns schema errors before safety errors", async () => {
    const result = await validateWorkflowSafety({
      ...baseWorkflow,
      nodes: [{ id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" }],
      edges: [],
    });

    expect(result).toEqual({
      success: false,
      errors: [
        {
          code: "schema.missingStart",
          message: "workflow must contain exactly one start node.",
        },
        {
          code: "schema.missingEnd",
          message: "workflow must contain at least one end node.",
        },
      ],
    });
  });

  it("detects cycles", async () => {
    const result = await validateWorkflowSafety({
      ...baseWorkflow,
      edges: [...baseWorkflow.edges, { id: "edge-cycle", from: "tool-diff", to: "agent-review" }],
    });

    expect(result.errors).toContainEqual({
      code: "dag.cycle",
      message: 'workflow contains a cycle involving node "agent-review".',
    });
  });

  it("validates node input and output compatibility", async () => {
    const result = await validateWorkflowSafety(baseWorkflow, {
      resolveAgent: async () => true,
      resolveTool: async () => true,
      toolIo: {
        "git.diff": {
          accepts: ["json"],
          produces: ["diff"],
        },
      },
      nodeIo: {
        "agent-review": {
          produces: ["text"],
        },
      },
    });

    expect(result.errors).toContainEqual({
      code: "io.incompatible",
      message: 'edge "edge-2" sends text to node "tool-diff", which expects json.',
    });
  });

  it("validates referenced agents and tools through injected resolvers", async () => {
    const result = await validateWorkflowSafety(baseWorkflow, {
      resolveAgent: async () => false,
      resolveTool: async () => false,
    });

    expect(result.errors).toEqual([
      {
        code: "reference.agentMissing",
        message: 'agent "reviewer" referenced by node "agent-review" does not exist.',
      },
      {
        code: "reference.toolMissing",
        message: 'tool "git.diff" referenced by node "tool-diff" does not exist.',
      },
    ]);
  });

  it("validates requested permissions do not exceed workflow permissions", async () => {
    const result = await validateWorkflowSafety(baseWorkflow, {
      resolveAgent: async () => true,
      resolveTool: async () => true,
      toolPermissions: {
        "git.diff": {
          read: true,
          write: true,
        },
      },
    });

    expect(result.errors).toContainEqual({
      code: "permission.exceedsWorkflow",
      message: 'tool "git.diff" requests write permission, but workflow does not allow it.',
    });
  });
});
