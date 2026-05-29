import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { WorkflowDefinition } from "@agentdeck/workflow-core";
import { afterEach, describe, expect, it } from "vitest";

import { createWorkflowRegistryService } from "./workflow-service.js";

const tempDirs: string[] = [];

async function createTempStorePath(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "agentdeck-workflow-registry-"));
  tempDirs.push(tempDir);
  return join(tempDir, "workflows.json");
}

const baseWorkflow: WorkflowDefinition = {
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
  createdAt: "2026-05-29T00:00:00.000Z",
  updatedAt: "2026-05-29T00:00:00.000Z",
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createWorkflowRegistryService", () => {
  it("creates, lists, gets, updates, and deletes workflow definitions", async () => {
    const service = createWorkflowRegistryService({
      storePath: await createTempStorePath(),
      now: () => "2026-05-29T01:00:00.000Z",
    });

    const created = await service.create(baseWorkflow);

    expect(created).toEqual({
      ...baseWorkflow,
      createdAt: "2026-05-29T01:00:00.000Z",
      updatedAt: "2026-05-29T01:00:00.000Z",
    });
    expect(await service.list()).toEqual([created]);
    expect(await service.get("review-flow")).toEqual(created);

    const updated = await service.update("review-flow", {
      name: "Review Flow v2",
      version: 2,
      now: () => "2026-05-29T02:00:00.000Z",
    });

    expect(updated.name).toBe("Review Flow v2");
    expect(updated.version).toBe(2);
    expect(updated.createdAt).toBe("2026-05-29T01:00:00.000Z");
    expect(updated.updatedAt).toBe("2026-05-29T02:00:00.000Z");

    expect(await service.delete("review-flow")).toBe(true);
    expect(await service.get("review-flow")).toBeUndefined();
  });

  it("rejects invalid workflows before persistence", async () => {
    const service = createWorkflowRegistryService({
      storePath: await createTempStorePath(),
    });

    await expect(
      service.create({
        ...baseWorkflow,
        nodes: [{ id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" }],
        edges: [],
      }),
    ).rejects.toThrow("workflow must contain exactly one start node.");

    expect(await service.list()).toEqual([]);
  });

  it("persists workflow definitions across service instances", async () => {
    const storePath = await createTempStorePath();
    const firstService = createWorkflowRegistryService({
      storePath,
      now: () => "2026-05-29T01:00:00.000Z",
    });
    const created = await firstService.create(baseWorkflow);

    const secondService = createWorkflowRegistryService({ storePath });

    expect(await secondService.get("review-flow")).toEqual(created);
    expect(await secondService.list()).toEqual([created]);
  });
});
