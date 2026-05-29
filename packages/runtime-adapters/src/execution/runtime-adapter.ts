import type { RuntimeType } from "../runtime-types.js";
import type { TaskEvent } from "./task-events.js";

export type RuntimeAdapterId = "codex" | "claude" | "shell" | string;

export type RuntimeTaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface RuntimeTaskRequest {
  readonly taskId: string;
  readonly prompt: string;
  readonly workspaceRoot: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface RuntimeTaskResult {
  readonly taskId: string;
  readonly status: RuntimeTaskStatus;
  readonly events: readonly TaskEvent[];
}

export interface RuntimeTaskCancellation {
  readonly cancelled: boolean;
  readonly reason?: string;
}

export interface RuntimeAdapterCapabilities {
  readonly executeTask: boolean;
  readonly cancelTask: boolean;
  readonly streaming: boolean;
  readonly tools: readonly string[];
}

export interface RuntimeAdapter {
  readonly id: RuntimeAdapterId;
  readonly name: string;
  readonly runtimeType: RuntimeType;
  readonly executeTask: (request: RuntimeTaskRequest) => Promise<RuntimeTaskResult>;
  readonly cancelTask: (taskId: string) => Promise<RuntimeTaskCancellation>;
  readonly getCapabilities: () => RuntimeAdapterCapabilities;
}

export function createRuntimeAdapterCapabilities(
  input: Partial<RuntimeAdapterCapabilities> = {},
): RuntimeAdapterCapabilities {
  return {
    executeTask: input.executeTask ?? true,
    cancelTask: input.cancelTask ?? true,
    streaming: input.streaming ?? false,
    tools: input.tools ?? [],
  };
}
