import { createWorkflowDefinition, type WorkflowDefinition } from "@agentdeck/workflow-core";

import { createFileWorkflowRepository, type WorkflowRepository } from "./workflow-repository.js";

export type WorkflowUpdateInput = Partial<
  Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
> & {
  readonly now?: () => string;
};

export interface WorkflowRegistryService {
  readonly create: (input: WorkflowDefinition) => Promise<WorkflowDefinition>;
  readonly list: () => Promise<WorkflowDefinition[]>;
  readonly get: (id: string) => Promise<WorkflowDefinition | undefined>;
  readonly update: (id: string, input: WorkflowUpdateInput) => Promise<WorkflowDefinition>;
  readonly delete: (id: string) => Promise<boolean>;
}

export interface CreateWorkflowRegistryServiceOptions {
  readonly storePath?: string;
  readonly repository?: WorkflowRepository;
  readonly now?: () => string;
}

export function createWorkflowRegistryService(
  options: CreateWorkflowRegistryServiceOptions = {},
): WorkflowRegistryService {
  const repository =
    options.repository ??
    createFileWorkflowRepository(options.storePath ?? ".agentdeck/workflows.json");
  const now = options.now ?? (() => new Date().toISOString());

  return {
    async create(input) {
      const timestamp = now();
      const result = createWorkflowDefinition({
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      if (!result.success) {
        throw new WorkflowValidationError(result.errors);
      }

      await repository.save(result.value);
      return result.value;
    },
    async list() {
      return await repository.list();
    },
    async get(id) {
      return await repository.get(id);
    },
    async update(id, input) {
      const existing = await repository.get(id);
      if (!existing) {
        throw new Error(`Workflow "${id}" was not found.`);
      }

      const result = createWorkflowDefinition({
        id: existing.id,
        name: input.name ?? existing.name,
        version: input.version ?? existing.version,
        status: input.status ?? existing.status,
        variables: input.variables ?? existing.variables,
        permissions: input.permissions ?? existing.permissions,
        nodes: input.nodes ?? existing.nodes,
        edges: input.edges ?? existing.edges,
        createdAt: existing.createdAt,
        updatedAt: (input.now ?? now)(),
      });
      if (!result.success) {
        throw new WorkflowValidationError(result.errors);
      }

      await repository.save(result.value);
      return result.value;
    },
    async delete(id) {
      return await repository.delete(id);
    },
  };
}

export class WorkflowValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(errors.join(" "));
    this.name = "WorkflowValidationError";
    this.errors = errors;
  }
}
