import { describe, expect, it } from "vitest";

import { createSafeShellAdapter } from "./shell-adapter.js";

describe("createSafeShellAdapter", () => {
  it("executes configured safe commands and streams stdout and stderr events", async () => {
    const adapter = createSafeShellAdapter({
      allowedCommands: ["echo hello"],
      runCommand: async (command) => {
        expect(command).toBe("echo hello");
        return {
          stdout: "hello",
          stderr: "warn",
          exitCode: 0,
        };
      },
      now: () => "2026-05-29T00:00:00.000Z",
    });

    const result = await adapter.executeTask({
      taskId: "task-1",
      prompt: "echo hello",
      workspaceRoot: "/tmp/agentdeck",
    });

    expect(result.status).toBe("completed");
    expect(result.events).toEqual([
      {
        id: "task-1-stdout-1",
        taskId: "task-1",
        type: "task.stdout",
        createdAt: "2026-05-29T00:00:00.000Z",
        payload: { text: "hello" },
      },
      {
        id: "task-1-stderr-1",
        taskId: "task-1",
        type: "task.stderr",
        createdAt: "2026-05-29T00:00:00.000Z",
        payload: { text: "warn" },
      },
      {
        id: "task-1-completed",
        taskId: "task-1",
        type: "task.completed",
        createdAt: "2026-05-29T00:00:00.000Z",
        payload: { exitCode: 0 },
      },
    ]);
  });

  it("rejects arbitrary commands before execution unless policy allows them", async () => {
    let executed = false;
    const adapter = createSafeShellAdapter({
      allowedCommands: ["echo hello"],
      runCommand: async () => {
        executed = true;
        return {
          stdout: "",
          stderr: "",
          exitCode: 0,
        };
      },
      now: () => "2026-05-29T00:00:00.000Z",
    });

    const result = await adapter.executeTask({
      taskId: "task-1",
      prompt: "rm -rf /tmp/example",
      workspaceRoot: "/tmp/agentdeck",
    });

    expect(executed).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.events).toEqual([
      {
        id: "task-1-failed",
        taskId: "task-1",
        type: "task.failed",
        createdAt: "2026-05-29T00:00:00.000Z",
        payload: { message: 'Command "rm -rf /tmp/example" is not allowed.' },
      },
    ]);
  });

  it("allows arbitrary commands when permission policy explicitly allows them", async () => {
    const adapter = createSafeShellAdapter({
      allowedCommands: [],
      allowArbitraryCommands: true,
      runCommand: async () => ({
        stdout: "ok",
        stderr: "",
        exitCode: 0,
      }),
      now: () => "2026-05-29T00:00:00.000Z",
    });

    const result = await adapter.executeTask({
      taskId: "task-1",
      prompt: "pwd",
      workspaceRoot: "/tmp/agentdeck",
    });

    expect(result.status).toBe("completed");
    expect(result.events.map((event) => event.type)).toEqual(["task.stdout", "task.completed"]);
  });

  it("reports non-zero command exits as failures", async () => {
    const adapter = createSafeShellAdapter({
      allowedCommands: ["false"],
      runCommand: async () => ({
        stdout: "",
        stderr: "bad",
        exitCode: 1,
      }),
      now: () => "2026-05-29T00:00:00.000Z",
    });

    const result = await adapter.executeTask({
      taskId: "task-1",
      prompt: "false",
      workspaceRoot: "/tmp/agentdeck",
    });

    expect(result.status).toBe("failed");
    expect(result.events.map((event) => event.type)).toEqual(["task.stderr", "task.failed"]);
  });
});
