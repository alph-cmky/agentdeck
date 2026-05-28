import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { createAgentRegistryService } from "./agent-service.js";

const tempDirs: string[] = [];

async function createTempStorePath(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "agentdeck-agent-registry-"));
  tempDirs.push(tempDir);
  return join(tempDir, "agents.json");
}

const baseInput = {
  id: "reviewer",
  name: "Reviewer",
  description: "Reviews code",
  prompt: "Review the current diff.",
  model: "gpt-5",
  tools: ["repo.read", "git.diff"],
  memoryScope: "workspace",
  runtimePreference: "codex",
  workspaceRoot: "/tmp/agentdeck",
} as const;

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createAgentRegistryService", () => {
  it("creates, lists, gets, updates, and deletes agents", async () => {
    const service = createAgentRegistryService({
      storePath: await createTempStorePath(),
      now: () => "2026-05-28T00:00:00.000Z",
    });

    const created = await service.create(baseInput);

    expect(created).toMatchObject({
      ...baseInput,
      createdAt: "2026-05-28T00:00:00.000Z",
      updatedAt: "2026-05-28T00:00:00.000Z",
    });
    expect(await service.list()).toEqual([created]);
    expect(await service.get("reviewer")).toEqual(created);

    const updated = await service.update("reviewer", {
      name: "Senior Reviewer",
      prompt: "Review the current diff and focus on regressions.",
      now: () => "2026-05-28T01:00:00.000Z",
    });

    expect(updated.name).toBe("Senior Reviewer");
    expect(updated.prompt).toBe("Review the current diff and focus on regressions.");
    expect(updated.createdAt).toBe("2026-05-28T00:00:00.000Z");
    expect(updated.updatedAt).toBe("2026-05-28T01:00:00.000Z");

    expect(await service.delete("reviewer")).toBe(true);
    expect(await service.get("reviewer")).toBeUndefined();
  });

  it("rejects invalid agents before persistence", async () => {
    const service = createAgentRegistryService({
      storePath: await createTempStorePath(),
    });

    await expect(
      service.create({
        ...baseInput,
        prompt: "",
        permissions: { write: true },
      }),
    ).rejects.toThrow("prompt is required.");

    expect(await service.list()).toEqual([]);
  });

  it("persists agent definitions across service instances", async () => {
    const storePath = await createTempStorePath();
    const firstService = createAgentRegistryService({
      storePath,
      now: () => "2026-05-28T00:00:00.000Z",
    });
    const created = await firstService.create(baseInput);

    const secondService = createAgentRegistryService({ storePath });

    expect(await secondService.get("reviewer")).toEqual(created);
    expect(await secondService.list()).toEqual([created]);
  });
});
