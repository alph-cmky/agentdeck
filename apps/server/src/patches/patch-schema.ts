import type { WorkflowDefinition, WorkflowSafetyResult } from "@agentdeck/workflow-core";

export type PatchTargetType = "workflow";
export type PatchApprovalState = "pending" | "approved" | "rejected" | "applied";

export type JsonPatchOperation =
  | {
      readonly op: "add" | "replace";
      readonly path: string;
      readonly value: unknown;
    }
  | {
      readonly op: "remove";
      readonly path: string;
    };

export interface PatchDiffPreview<TTarget = unknown> {
  readonly summary: readonly string[];
  readonly before: TTarget;
  readonly after: TTarget;
}

export interface PatchProposal<TTarget = unknown> {
  readonly id: string;
  readonly targetType: PatchTargetType;
  readonly targetId: string;
  readonly baseVersion: number;
  readonly jsonPatch: readonly JsonPatchOperation[];
  readonly validationResult: WorkflowSafetyResult;
  readonly approvalState: PatchApprovalState;
  readonly diffPreview: PatchDiffPreview<TTarget>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type WorkflowPatchProposal = PatchProposal<WorkflowDefinition>;

export interface ProposeWorkflowPatchInput {
  readonly targetWorkflow: WorkflowDefinition;
  readonly baseVersion: number;
  readonly patch: readonly JsonPatchOperation[];
}
