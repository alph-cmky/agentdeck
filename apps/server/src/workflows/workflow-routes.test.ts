import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { WorkflowDefinition } from "@agentdeck/workflow-core";
import { afterEach, describe, expect, it } from "vitest";

import { createWorkflowRoutes } from "./workflow-routes.js";
import { createWorkflowRegistryService } from "./workflow-service.js";

const tempDirs: string[] = [];

async function createTempStorePath(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "agentdeck-workflow-routes-"));
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

describe("createWorkflowRoutes", () => {
  it("exposes route handlers for workflow create, list, get, update, and delete", async () => {
    const service = createWorkflowRegistryService({
      storePath: await createTempStorePath(),
      now: () => "2026-05-29T01:00:00.000Z",
    });
    const routes = createWorkflowRoutes({ service });

    const createResponse = await routes.createWorkflow(baseWorkflow);
    const updateResponse = await routes.updateWorkflow({
      id: "review-flow",
      workflow: { name: "Review Flow v2", version: 2 },
    });
    if (!("workflow" in updateResponse)) {
      throw new Error("Expected workflow update response.");
    }

    expect(createResponse).toEqual({
      status: 201,
      workflow: {
        ...baseWorkflow,
        createdAt: "2026-05-29T01:00:00.000Z",
        updatedAt: "2026-05-29T01:00:00.000Z",
      },
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.workflow?.name).toBe("Review Flow v2");
    expect(await routes.listWorkflows()).toEqual({
      status: 200,
      workflows: [updateResponse.workflow],
    });
    expect(await routes.getWorkflow({ id: "review-flow" })).toEqual({
      status: 200,
      workflow: updateResponse.workflow,
    });
    expect(await routes.deleteWorkflow({ id: "review-flow" })).toEqual({
      status: 204,
      deleted: true,
    });
    expect(await routes.getWorkflow({ id: "review-flow" })).toEqual({
      status: 404,
      error: 'Workflow "review-flow" was not found.',
    });
  });

  it("returns validation errors without persisting invalid workflows", async () => {
    const service = createWorkflowRegistryService({
      storePath: await createTempStorePath(),
    });
    const routes = createWorkflowRoutes({ service });

    const response = await routes.createWorkflow({
      ...baseWorkflow,
      nodes: [{ id: "agent-review", type: "agent", label: "Review", agentId: "reviewer" }],
      edges: [],
    });

    expect(response).toEqual({
      status: 400,
      errors: [
        "workflow must contain exactly one start node.",
        "workflow must contain at least one end node.",
      ],
    });
    expect(await routes.listWorkflows()).toEqual({ status: 200, workflows: [] });
  });
});
