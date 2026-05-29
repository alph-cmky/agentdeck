import { describe, expect, it } from "vitest";

import {
  WORKFLOW_NODE_TYPES,
  WORKFLOW_STATUSES,
  createWorkflowDefinition,
  validateWorkflowDefinition,
  type WorkflowDefinition,
} from "./workflow-schema.js";

const validWorkflowInput = {
  id: "workflow-review",
  name: "Review workflow",
  version: 1,
  status: "draft",
  variables: {
    branch: "main",
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
    { id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" },
    { id: "tool-diff", type: "tool", label: "Diff", toolId: "git.diff" },
    { id: "condition-risk", type: "condition", label: "Risk?", expression: "risk > 0" },
    { id: "approval", type: "humanApproval", label: "Approve", approverRole: "maintainer" },
    { id: "end", type: "end", label: "Done" },
  ],
  edges: [
    { id: "edge-1", from: "start", to: "agent-review" },
    { id: "edge-2", from: "agent-review", to: "tool-diff" },
    { id: "edge-3", from: "tool-diff", to: "condition-risk" },
    { id: "edge-4", from: "condition-risk", to: "approval", condition: "needsApproval" },
    { id: "edge-5", from: "approval", to: "end" },
  ],
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
} as const;

describe("workflow schema constants", () => {
  it("defines MVP workflow node types and statuses", () => {
    expect(WORKFLOW_NODE_TYPES).toEqual([
      "start",
      "agent",
      "tool",
      "condition",
      "humanApproval",
      "end",
    ]);
    expect(WORKFLOW_STATUSES).toEqual(["draft", "active", "paused", "archived"]);
  });
});

describe("createWorkflowDefinition", () => {
  it("normalizes workflow fields, nodes, edges, variables, permissions, status, version, and timestamps", () => {
    const result = createWorkflowDefinition(validWorkflowInput);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(result.errors.join("\n"));
    }

    expect(result.value).toEqual(validWorkflowInput);
  });

  it("rejects invalid node types, missing start node, and missing end node", () => {
    const result = createWorkflowDefinition({
      ...validWorkflowInput,
      nodes: [{ id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" }],
      edges: [],
    });

    expect(result).toEqual({
      success: false,
      errors: [
        "workflow must contain exactly one start node.",
        "workflow must contain at least one end node.",
      ],
    });

    expect(
      validateWorkflowDefinition({
        ...validWorkflowInput,
        nodes: [{ id: "bad", type: "timer", label: "Timer" }],
      } as unknown as WorkflowDefinition),
    ).toEqual({
      success: false,
      errors: [
        'node "bad" has invalid type "timer".',
        "workflow must contain exactly one start node.",
        "workflow must contain at least one end node.",
      ],
    });
  });

  it("rejects workflows with duplicate start nodes", () => {
    const result = createWorkflowDefinition({
      ...validWorkflowInput,
      nodes: [
        { id: "start-1", type: "start", label: "Start 1" },
        { id: "start-2", type: "start", label: "Start 2" },
        { id: "end", type: "end", label: "Done" },
      ],
    });

    expect(result).toEqual({
      success: false,
      errors: ["workflow must contain exactly one start node."],
    });
  });
});
