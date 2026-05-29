import { describe, expect, it } from "vitest";

import { TASK_EVENT_TYPES, createTaskEvent } from "./task-events.js";

describe("task events", () => {
  it("defines streamed task event types for execution adapters", () => {
    expect(TASK_EVENT_TYPES).toEqual([
      "task.stdout",
      "task.stderr",
      "task.tool",
      "task.diff",
      "task.completed",
      "task.failed",
    ]);
  });

  it("creates normalized stdout, stderr, tool, diff, completion, and failure events", () => {
    expect(
      [
        createTaskEvent({
          id: "stdout-1",
          taskId: "task-1",
          type: "task.stdout",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { text: "hello" },
        }),
        createTaskEvent({
          id: "stderr-1",
          taskId: "task-1",
          type: "task.stderr",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { text: "warn" },
        }),
        createTaskEvent({
          id: "tool-1",
          taskId: "task-1",
          type: "task.tool",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { toolName: "git.diff", status: "completed" },
        }),
        createTaskEvent({
          id: "diff-1",
          taskId: "task-1",
          type: "task.diff",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { diff: "diff --git" },
        }),
        createTaskEvent({
          id: "completed-1",
          taskId: "task-1",
          type: "task.completed",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { exitCode: 0 },
        }),
        createTaskEvent({
          id: "failed-1",
          taskId: "task-1",
          type: "task.failed",
          createdAt: "2026-05-29T00:00:00.000Z",
          payload: { message: "failed" },
        }),
      ].map((event) => event.type),
    ).toEqual(TASK_EVENT_TYPES);
  });
});
