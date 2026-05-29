import {
  validateWorkflowSafety,
  type WorkflowDefinition,
  type WorkflowSafetyValidatorOptions,
} from "@agentdeck/workflow-core";

import type {
  JsonPatchOperation,
  PatchApprovalState,
  ProposeWorkflowPatchInput,
  WorkflowPatchProposal,
} from "./patch-schema.js";
import type { AuditLogService } from "../audit/audit-service.js";
import type { WorkflowRegistryService } from "../workflows/workflow-service.js";

export interface PatchProposalService {
  readonly proposeWorkflowPatch: (
    input: ProposeWorkflowPatchInput,
  ) => Promise<WorkflowPatchProposal>;
  readonly get: (id: string) => Promise<WorkflowPatchProposal | undefined>;
  readonly setApprovalState: (
    id: string,
    approvalState: Exclude<PatchApprovalState, "applied">,
  ) => Promise<WorkflowPatchProposal>;
  readonly apply: (id: string) => Promise<{
    readonly proposal: WorkflowPatchProposal;
    readonly workflow: WorkflowDefinition;
  }>;
}

export interface CreatePatchProposalServiceOptions {
  readonly now?: () => string;
  readonly nextId?: () => string;
  readonly workflowValidation?: WorkflowSafetyValidatorOptions;
  readonly workflowRegistry?: WorkflowRegistryService;
  readonly auditLog?: AuditLogService;
}

export function createPatchProposalService(
  options: CreatePatchProposalServiceOptions = {},
): PatchProposalService {
  const proposals = new Map<string, WorkflowPatchProposal>();
  const now = options.now ?? (() => new Date().toISOString());
  const nextId = options.nextId ?? (() => crypto.randomUUID());

  return {
    async proposeWorkflowPatch(input) {
      assertBaseVersion(input.targetWorkflow, input.baseVersion);

      const before = cloneJson(input.targetWorkflow);
      const after = applyJsonPatch(before, input.patch) as WorkflowDefinition;
      const validationResult = await validateWorkflowSafety(after, options.workflowValidation);
      const timestamp = now();
      const proposal: WorkflowPatchProposal = {
        id: nextId(),
        targetType: "workflow",
        targetId: input.targetWorkflow.id,
        baseVersion: input.baseVersion,
        jsonPatch: cloneJson(input.patch),
        validationResult,
        approvalState: "pending",
        diffPreview: {
          summary: input.patch.map(summarizeOperation),
          before,
          after,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      proposals.set(proposal.id, proposal);
      return proposal;
    },
    async get(id) {
      return proposals.get(id);
    },
    async setApprovalState(id, approvalState) {
      const proposal = getRequiredProposal(proposals, id);
      const updated = {
        ...proposal,
        approvalState,
        updatedAt: now(),
      };
      proposals.set(id, updated);
      return updated;
    },
    async apply(id) {
      const proposal = getRequiredProposal(proposals, id);
      if (proposal.approvalState !== "approved") {
        throw new Error(`Patch proposal "${id}" must be approved before apply.`);
      }

      if (!proposal.validationResult.success) {
        throw new Error(`Patch proposal "${id}" has validation errors.`);
      }

      const workflow = await applyWorkflowPatch(proposal, options);
      const applied = {
        ...proposal,
        approvalState: "applied" as const,
        diffPreview: {
          ...proposal.diffPreview,
          after: workflow,
        },
        updatedAt: now(),
      };
      proposals.set(id, applied);
      await options.auditLog?.record({
        action: "patch.proposal",
        actor: { type: "system", id: "patch-service" },
        patchProposalId: proposal.id,
        diffSummary: proposal.diffPreview.summary.join("; "),
        approvalDecision: "approved",
        metadata: {
          targetType: proposal.targetType,
          targetId: proposal.targetId,
          baseVersion: proposal.baseVersion,
        },
      });

      return {
        proposal: applied,
        workflow: cloneJson(workflow),
      };
    },
  };
}

async function applyWorkflowPatch(
  proposal: WorkflowPatchProposal,
  options: CreatePatchProposalServiceOptions,
): Promise<WorkflowDefinition> {
  const workflowRegistry = options.workflowRegistry;
  if (!workflowRegistry) {
    return cloneJson(proposal.diffPreview.after);
  }

  const currentWorkflow = await workflowRegistry.get(proposal.targetId);
  if (!currentWorkflow) {
    throw new Error(`Workflow "${proposal.targetId}" was not found.`);
  }

  if (currentWorkflow.version !== proposal.baseVersion) {
    await options.auditLog?.record({
      action: "approval.decision",
      actor: { type: "system", id: "patch-service" },
      patchProposalId: proposal.id,
      diffSummary: proposal.diffPreview.summary.join("; "),
      approvalDecision: "rejected",
      metadata: {
        targetType: proposal.targetType,
        targetId: proposal.targetId,
        baseVersion: proposal.baseVersion,
        currentVersion: currentWorkflow.version,
      },
    });
    throw new Error(
      `Patch proposal "${proposal.id}" targets workflow version ${proposal.baseVersion}, but current version is ${currentWorkflow.version}.`,
    );
  }

  return await workflowRegistry.update(proposal.targetId, {
    name: proposal.diffPreview.after.name,
    version: proposal.diffPreview.after.version,
    status: proposal.diffPreview.after.status,
    variables: proposal.diffPreview.after.variables,
    permissions: proposal.diffPreview.after.permissions,
    nodes: proposal.diffPreview.after.nodes,
    edges: proposal.diffPreview.after.edges,
  });
}

function assertBaseVersion(workflow: WorkflowDefinition, baseVersion: number): void {
  if (workflow.version !== baseVersion) {
    throw new Error(
      `Patch base version ${baseVersion} does not match workflow version ${workflow.version}.`,
    );
  }
}

function getRequiredProposal(
  proposals: ReadonlyMap<string, WorkflowPatchProposal>,
  id: string,
): WorkflowPatchProposal {
  const proposal = proposals.get(id);
  if (!proposal) {
    throw new Error(`Patch proposal "${id}" was not found.`);
  }

  return proposal;
}

function applyJsonPatch(target: unknown, patch: readonly JsonPatchOperation[]): unknown {
  const next = cloneJson(target);
  for (const operation of patch) {
    applyJsonPatchOperation(next, operation);
  }

  return next;
}

function applyJsonPatchOperation(target: unknown, operation: JsonPatchOperation): void {
  const { parent, key } = resolveJsonPointerParent(target, operation.path);

  if (operation.op === "remove") {
    removeValue(parent, key);
    return;
  }

  setValue(parent, key, cloneJson(operation.value), operation.op);
}

function resolveJsonPointerParent(target: unknown, path: string): { parent: unknown; key: string } {
  const parts = parseJsonPointer(path);
  if (parts.length === 0) {
    throw new Error("JSON patch path must reference a child value.");
  }

  let parent = target;
  for (const part of parts.slice(0, -1)) {
    parent = readChild(parent, part);
  }

  return {
    parent,
    key: parts[parts.length - 1] ?? "",
  };
}

function parseJsonPointer(path: string): string[] {
  if (!path.startsWith("/")) {
    throw new Error(`JSON patch path "${path}" must start with "/".`);
  }

  return path
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function readChild(parent: unknown, key: string): unknown {
  if (Array.isArray(parent)) {
    return parent[toArrayIndex(parent, key, false)];
  }

  if (isRecord(parent)) {
    return parent[key];
  }

  throw new Error(`Cannot traverse JSON patch path segment "${key}".`);
}

function setValue(parent: unknown, key: string, value: unknown, op: "add" | "replace"): void {
  if (Array.isArray(parent)) {
    const index = key === "-" ? parent.length : toArrayIndex(parent, key, op === "add");
    if (op === "replace") {
      parent[index] = value;
      return;
    }

    parent.splice(index, 0, value);
    return;
  }

  if (!isRecord(parent)) {
    throw new Error(`Cannot ${op} JSON patch path segment "${key}".`);
  }

  if (op === "replace" && !(key in parent)) {
    throw new Error(`Cannot replace missing JSON patch path segment "${key}".`);
  }

  parent[key] = value;
}

function removeValue(parent: unknown, key: string): void {
  if (Array.isArray(parent)) {
    parent.splice(toArrayIndex(parent, key, false), 1);
    return;
  }

  if (!isRecord(parent)) {
    throw new Error(`Cannot remove JSON patch path segment "${key}".`);
  }

  delete parent[key];
}

function toArrayIndex(values: readonly unknown[], key: string, allowEnd: boolean): number {
  const index = Number.parseInt(key, 10);
  const upperBound = allowEnd ? values.length : values.length - 1;
  if (!Number.isInteger(index) || index < 0 || index > upperBound) {
    throw new Error(`JSON patch array index "${key}" is out of bounds.`);
  }

  return index;
}

function summarizeOperation(operation: JsonPatchOperation): string {
  return `${operation.op} ${operation.path}`;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
