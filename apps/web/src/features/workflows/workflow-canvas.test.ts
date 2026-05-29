import { describe, expect, it } from "vitest";

import { renderWorkflowCanvasHtml, type WorkflowCanvasState } from "./workflow-canvas.js";

const validWorkflow: WorkflowCanvasState["workflow"] = {
  id: "code-review",
  name: "Code Review",
  version: 1,
  status: "draft",
  variables: {},
  permissions: {
    read: true,
    write: true,
    install: false,
    arbitraryCommands: false,
    commit: false,
    push: false,
  },
  nodes: [
    { id: "start", type: "start", label: "Start" },
    { id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" },
    { id: "tool-diff", type: "tool", label: "Diff", toolId: "git.diff" },
    { id: "condition-risk", type: "condition", label: "Risk check", expression: "risk > 0.7" },
    {
      id: "approval",
      type: "humanApproval",
      label: "Approve",
      approverRole: "maintainer",
    },
    { id: "end", type: "end", label: "End" },
  ],
  edges: [
    { id: "edge-start-review", from: "start", to: "agent-review" },
    { id: "edge-review-diff", from: "agent-review", to: "tool-diff" },
    { id: "edge-diff-risk", from: "tool-diff", to: "condition-risk" },
    {
      id: "edge-risk-approval",
      from: "condition-risk",
      to: "approval",
      condition: "needsApproval",
    },
    { id: "edge-approval-end", from: "approval", to: "end" },
  ],
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
};

describe("renderWorkflowCanvasHtml", () => {
  it("renders a palette for all MVP workflow node types and a valid DAG canvas", async () => {
    const html = await renderWorkflowCanvasHtml({ workflow: validWorkflow });

    for (const label of ["Start", "Agent", "Tool", "Condition", "Human Approval", "End"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("Code Review");
    expect(html).toContain("edge-risk-approval");
    expect(html).toContain("Ready to save");
  });

  it("opens selected node settings in the right inspector", async () => {
    const html = await renderWorkflowCanvasHtml({
      workflow: validWorkflow,
      selectedNodeId: "approval",
    });

    expect(html).toContain("Node Settings");
    expect(html).toContain("Approve");
    expect(html).toContain("Human Approval");
    expect(html).toContain("Approver role");
    expect(html).toContain("maintainer");
  });

  it("runs validation before saving and renders invalid DAG errors", async () => {
    const html = await renderWorkflowCanvasHtml({
      workflow: {
        ...validWorkflow,
        edges: [...validWorkflow.edges, { id: "edge-cycle", from: "approval", to: "agent-review" }],
      },
      selectedNodeId: "agent-review",
    });

    expect(html).toContain("Save disabled");
    expect(html).toContain("workflow contains a cycle involving node &quot;agent-review&quot;.");
  });
});
