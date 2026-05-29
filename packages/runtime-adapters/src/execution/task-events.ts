export const TASK_EVENT_TYPES = [
  "task.stdout",
  "task.stderr",
  "task.tool",
  "task.diff",
  "task.completed",
  "task.failed",
] as const;

export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

export interface TaskEventBase<TType extends TaskEventType, TPayload> {
  readonly id: string;
  readonly taskId: string;
  readonly type: TType;
  readonly createdAt: string;
  readonly payload: TPayload;
}

export type TaskStdoutEvent = TaskEventBase<"task.stdout", { readonly text: string }>;
export type TaskStderrEvent = TaskEventBase<"task.stderr", { readonly text: string }>;
export type TaskToolEvent = TaskEventBase<
  "task.tool",
  {
    readonly toolName: string;
    readonly status: "started" | "completed" | "failed";
    readonly message?: string;
  }
>;
export type TaskDiffEvent = TaskEventBase<"task.diff", { readonly diff: string }>;
export type TaskCompletedEvent = TaskEventBase<"task.completed", { readonly exitCode: number }>;
export type TaskFailedEvent = TaskEventBase<"task.failed", { readonly message: string }>;

export type TaskEvent =
  | TaskStdoutEvent
  | TaskStderrEvent
  | TaskToolEvent
  | TaskDiffEvent
  | TaskCompletedEvent
  | TaskFailedEvent;

export function createTaskEvent<TEvent extends TaskEvent>(event: TEvent): TEvent {
  return event;
}
