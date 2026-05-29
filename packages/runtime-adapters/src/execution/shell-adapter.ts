import { runProbe } from "../probe/run-probe.js";
import {
  createRuntimeAdapterCapabilities,
  type RuntimeAdapter,
  type RuntimeTaskResult,
} from "./runtime-adapter.js";
import { createTaskEvent, type TaskEvent } from "./task-events.js";

export interface ShellCommandResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
}

export interface SafeShellAdapterOptions {
  readonly allowedCommands: readonly string[];
  readonly allowArbitraryCommands?: boolean;
  readonly runCommand?: (command: string, cwd: string) => Promise<ShellCommandResult>;
  readonly now?: () => string;
}

export function createSafeShellAdapter(options: SafeShellAdapterOptions): RuntimeAdapter {
  const now = options.now ?? (() => new Date().toISOString());
  const allowedCommands = new Set(options.allowedCommands);

  return {
    id: "shell",
    name: "Safe Shell",
    runtimeType: "node",
    async executeTask(request) {
      const command = request.prompt.trim();
      if (!options.allowArbitraryCommands && !allowedCommands.has(command)) {
        return {
          taskId: request.taskId,
          status: "failed",
          events: [
            createTaskEvent({
              id: `${request.taskId}-failed`,
              taskId: request.taskId,
              type: "task.failed",
              createdAt: now(),
              payload: {
                message: `Command "${command}" is not allowed.`,
              },
            }),
          ],
        };
      }

      const commandResult = await (options.runCommand ?? runShellCommand)(
        command,
        request.workspaceRoot,
      );
      return createRuntimeTaskResult({
        taskId: request.taskId,
        commandResult,
        now,
      });
    },
    async cancelTask() {
      return {
        cancelled: false,
        reason: "Safe shell commands are not cancellable after dispatch.",
      };
    },
    getCapabilities() {
      return createRuntimeAdapterCapabilities({
        streaming: true,
        tools: ["shell"],
      });
    },
  };
}

async function runShellCommand(command: string, cwd: string): Promise<ShellCommandResult> {
  const result = await runProbe(command, {
    cwd,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

function createRuntimeTaskResult(input: {
  readonly taskId: string;
  readonly commandResult: ShellCommandResult;
  readonly now: () => string;
}): RuntimeTaskResult {
  const events: TaskEvent[] = [];

  if (input.commandResult.stdout.length > 0) {
    events.push(
      createTaskEvent({
        id: `${input.taskId}-stdout-1`,
        taskId: input.taskId,
        type: "task.stdout",
        createdAt: input.now(),
        payload: {
          text: input.commandResult.stdout,
        },
      }),
    );
  }

  if (input.commandResult.stderr.length > 0) {
    events.push(
      createTaskEvent({
        id: `${input.taskId}-stderr-1`,
        taskId: input.taskId,
        type: "task.stderr",
        createdAt: input.now(),
        payload: {
          text: input.commandResult.stderr,
        },
      }),
    );
  }

  if (input.commandResult.exitCode === 0) {
    events.push(
      createTaskEvent({
        id: `${input.taskId}-completed`,
        taskId: input.taskId,
        type: "task.completed",
        createdAt: input.now(),
        payload: {
          exitCode: 0,
        },
      }),
    );

    return {
      taskId: input.taskId,
      status: "completed",
      events,
    };
  }

  events.push(
    createTaskEvent({
      id: `${input.taskId}-failed`,
      taskId: input.taskId,
      type: "task.failed",
      createdAt: input.now(),
      payload: {
        message: `Command failed with exit code ${input.commandResult.exitCode ?? "unknown"}.`,
      },
    }),
  );

  return {
    taskId: input.taskId,
    status: "failed",
    events,
  };
}
