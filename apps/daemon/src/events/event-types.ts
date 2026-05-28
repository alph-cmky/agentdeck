import type { RuntimeStatus } from "@agentdeck/runtime-adapters";

export const DAEMON_EVENT_TYPES = [
  "runtime.detected",
  "task.started",
  "task.output",
  "task.diff",
  "task.approvalRequested",
  "task.completed",
  "task.failed",
] as const;

export type DaemonEventType = (typeof DAEMON_EVENT_TYPES)[number];

export interface DaemonEventBase<TType extends DaemonEventType, TPayload> {
  readonly id: string;
  readonly type: TType;
  readonly createdAt: string;
  readonly payload: TPayload;
}

export type RuntimeDetectedEvent = DaemonEventBase<
  "runtime.detected",
  {
    readonly runtimeId: string;
    readonly status: RuntimeStatus;
  }
>;

export type TaskStartedEvent = DaemonEventBase<
  "task.started",
  {
    readonly taskId: string;
    readonly title: string;
  }
>;

export type TaskOutputEvent = DaemonEventBase<
  "task.output",
  {
    readonly taskId: string;
    readonly stream: "stdout" | "stderr";
    readonly text: string;
  }
>;

export type TaskDiffEvent = DaemonEventBase<
  "task.diff",
  {
    readonly taskId: string;
    readonly diff: string;
  }
>;

export type TaskApprovalRequestedEvent = DaemonEventBase<
  "task.approvalRequested",
  {
    readonly taskId: string;
    readonly reason: string;
  }
>;

export type TaskCompletedEvent = DaemonEventBase<
  "task.completed",
  {
    readonly taskId: string;
    readonly exitCode: number;
  }
>;

export type TaskFailedEvent = DaemonEventBase<
  "task.failed",
  {
    readonly taskId: string;
    readonly message: string;
  }
>;

export type DaemonEvent =
  | RuntimeDetectedEvent
  | TaskStartedEvent
  | TaskOutputEvent
  | TaskDiffEvent
  | TaskApprovalRequestedEvent
  | TaskCompletedEvent
  | TaskFailedEvent;
