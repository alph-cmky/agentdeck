import { describe, expect, it } from "vitest";

import { createAuditLogService } from "./audit-service.js";

describe("createAuditLogService", () => {
  it("records who changed what, when, through which task, agent, and runtime", async () => {
    const service = createAuditLogService({
      now: () => "2026-05-29T02:00:00.000Z",
      nextId: () => "audit-1",
    });

    const entry = await service.record({
      action: "task.execution",
      actor: { type: "agent", id: "reviewer", displayName: "Reviewer" },
      taskId: "task-1",
      agentId: "reviewer",
      runtimeId: "codex",
      commandSummary: "git diff --cached",
      diffSummary: "2 files changed",
      approvalDecision: "notRequired",
      metadata: { branch: "feat/example" },
    });

    expect(entry).toEqual({
      id: "audit-1",
      action: "task.execution",
      actor: { type: "agent", id: "reviewer", displayName: "Reviewer" },
      taskId: "task-1",
      agentId: "reviewer",
      runtimeId: "codex",
      commandSummary: "git diff --cached",
      diffSummary: "2 files changed",
      approvalDecision: "notRequired",
      metadata: { branch: "feat/example" },
      createdAt: "2026-05-29T02:00:00.000Z",
    });
    expect(await service.list()).toEqual([entry]);
    expect(await service.findByTask("task-1")).toEqual([entry]);
    expect(await service.findByRuntime("codex")).toEqual([entry]);
    expect(await service.findByActor("reviewer")).toEqual([entry]);
  });

  it("records patch proposal and approval events", async () => {
    const service = createAuditLogService({
      now: () => "2026-05-29T03:00:00.000Z",
      nextId: () => "audit-approval",
    });

    const entry = await service.record({
      action: "approval.decision",
      actor: { type: "user", id: "maintainer" },
      patchProposalId: "patch-1",
      diffSummary: "replace /status",
      approvalDecision: "approved",
    });

    expect(entry).toMatchObject({
      id: "audit-approval",
      action: "approval.decision",
      patchProposalId: "patch-1",
      diffSummary: "replace /status",
      approvalDecision: "approved",
    });
  });

  it("redacts secrets before persistence", async () => {
    const service = createAuditLogService({ nextId: () => "audit-secret" });

    const entry = await service.record({
      action: "sensitive.action",
      actor: { type: "user", id: "maintainer" },
      commandSummary: "curl -H token=abc123 https://example.test",
      diffSummary: "added api_key: sk-live-123",
      approvalDecision: "approved",
      metadata: {
        nested: {
          password: "hunter2",
          safe: "kept",
        },
      },
    });

    expect(entry.commandSummary).toBe("curl -H token=[REDACTED] https://example.test");
    expect(entry.diffSummary).toBe("added api_key: [REDACTED]");
    expect(entry.metadata).toEqual({
      nested: {
        password: "[REDACTED]",
        safe: "kept",
      },
    });
    expect(JSON.stringify(await service.list())).not.toContain("abc123");
    expect(JSON.stringify(await service.list())).not.toContain("hunter2");
    expect(JSON.stringify(await service.list())).not.toContain("sk-live-123");
  });
});
