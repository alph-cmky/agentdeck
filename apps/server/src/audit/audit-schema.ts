export type AuditAction =
  | "task.execution"
  | "patch.proposal"
  | "approval.decision"
  | "sensitive.action";

export type AuditActorType = "user" | "agent" | "system";
export type AuditApprovalDecision = "approved" | "rejected" | "notRequired" | "pending";

export interface AuditActor {
  readonly type: AuditActorType;
  readonly id: string;
  readonly displayName?: string;
}

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | readonly AuditMetadataValue[]
  | { readonly [key: string]: AuditMetadataValue };

export type AuditMetadata = Readonly<Record<string, AuditMetadataValue>>;

export interface AuditEntry {
  readonly id: string;
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly taskId?: string;
  readonly agentId?: string;
  readonly runtimeId?: string;
  readonly patchProposalId?: string;
  readonly commandSummary?: string;
  readonly diffSummary?: string;
  readonly approvalDecision?: AuditApprovalDecision;
  readonly metadata?: AuditMetadata;
  readonly createdAt: string;
}

export type CreateAuditEntryInput = Omit<AuditEntry, "id" | "createdAt">;
