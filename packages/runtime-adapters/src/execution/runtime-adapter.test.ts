import { describe, expect, it } from "vitest";

import {
  createRuntimeAdapterCapabilities,
  type RuntimeAdapter,
  type RuntimeTaskRequest,
} from "./runtime-adapter.js";
import type { TaskEvent } from "./task-events.js";

describe("RuntimeAdapter contract", () => {
  it("allows Codex, Claude, and shell execution through one orchestration interface", async () => {
    const adapters: RuntimeAdapter[] = [
      createFakeAdapter("codex"),
      createFakeAdapter("claude"),
      createFakeAdapter("shell"),
    ];
    const request: RuntimeTaskRequest = {
      taskId: "task-1",
      prompt: "Review the diff",
      workspaceRoot: "/tmp/agentdeck",
      metadata: {
        source: "test",
      },
    };

    const results = await Promise.all(adapters.map((adapter) => adapter.executeTask(request)));

    expect(results.map((result) => result.status)).toEqual(["completed", "completed", "completed"]);
    expect(adapters.every((adapter) => adapter.getCapabilities().executeTask)).toBe(true);
    expect(await adapters[0]?.cancelTask("task-1")).toEqual({ cancelled: true });
  });

  it("normalizes adapter capabilities", () => {
    expect(createRuntimeAdapterCapabilities({ streaming: true, tools: ["shell"] })).toEqual({
      executeTask: true,
      cancelTask: true,
      streaming: true,
      tools: ["shell"],
    });
  });
});

function createFakeAdapter(id: "codex" | "claude" | "shell"): RuntimeAdapter {
  const events: TaskEvent[] = [];

  return {
    id,
    name: `${id} adapter`,
    runtimeType: id === "shell" ? "node" : id,
    async executeTask(request) {
      events.push({
        id: "event-1",
        taskId: request.taskId,
        type: "task.completed",
        createdAt: "2026-05-29T00:00:00.000Z",
        payload: {
          exitCode: 0,
        },
      });
      return {
        taskId: request.taskId,
        status: "completed",
        events,
      };
    },
    async cancelTask(taskId) {
      return { cancelled: taskId === "task-1" };
    },
    getCapabilities() {
      return createRuntimeAdapterCapabilities();
    },
  };
}
