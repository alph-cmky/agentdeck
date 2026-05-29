import { describe, expect, it } from "vitest";

import { createPatchProposalService } from "./patch-service.js";
import type { JsonPatchOperation } from "./patch-schema.js";
import type { WorkflowDefinition } from "@agentdeck/workflow-core";

const baseWorkflow: WorkflowDefinition = {
  id: "code-review",
  name: "Code Review",
  version: 2,
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
    { id: "end", type: "end", label: "End" },
  ],
  edges: [
    { id: "edge-start-review", from: "start", to: "agent-review" },
    { id: "edge-review-end", from: "agent-review", to: "end" },
  ],
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
};

describe("createPatchProposalService", () => {
  it("proposes and previews a valid workflow patch without mutating the target", async () => {
    const service = createPatchProposalService({
      now: () => "2026-05-29T01:00:00.000Z",
      nextId: () => "patch-1",
    });
    const patch: JsonPatchOperation[] = [{ op: "replace", path: "/name", value: "Code Review v2" }];

    const proposal = await service.proposeWorkflowPatch({
      targetWorkflow: baseWorkflow,
      baseVersion: 2,
      patch,
    });

    expect(proposal).toMatchObject({
      id: "patch-1",
      targetType: "workflow",
      targetId: "code-review",
      baseVersion: 2,
      approvalState: "pending",
      validationResult: { success: true, errors: [] },
      diffPreview: {
        summary: ["replace /name"],
        before: baseWorkflow,
        after: { ...baseWorkflow, name: "Code Review v2" },
      },
    });
    expect(baseWorkflow.name).toBe("Code Review");
    expect(await service.get("patch-1")).toEqual(proposal);
  });

  it("validates workflow patches through workflow-core", async () => {
    const service = createPatchProposalService({ nextId: () => "patch-invalid" });

    const proposal = await service.proposeWorkflowPatch({
      targetWorkflow: baseWorkflow,
      baseVersion: 2,
      patch: [{ op: "remove", path: "/nodes/0" }],
    });

    expect(proposal.validationResult.success).toBe(false);
    expect(proposal.validationResult.errors).toContainEqual({
      code: "schema.missingStart",
      message: "workflow must contain exactly one start node.",
    });
  });

  it("requires approval before applying a proposal", async () => {
    const service = createPatchProposalService({ nextId: () => "patch-apply" });
    const proposal = await service.proposeWorkflowPatch({
      targetWorkflow: baseWorkflow,
      baseVersion: 2,
      patch: [{ op: "replace", path: "/status", value: "active" }],
    });

    await expect(service.apply(proposal.id)).rejects.toThrow(
      'Patch proposal "patch-apply" must be approved before apply.',
    );

    const approved = await service.setApprovalState(proposal.id, "approved");
    const applied = await service.apply(approved.id);

    expect(applied.workflow.status).toBe("active");
    expect(applied.proposal.approvalState).toBe("applied");
    expect(baseWorkflow.status).toBe("draft");
  });
});
