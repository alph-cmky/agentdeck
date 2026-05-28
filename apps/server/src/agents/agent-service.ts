import {
  createAgentDefinition,
  type AgentDefinitionInput,
  type PersistedAgentDefinition,
} from "./agent-schema.js";
import { createFileAgentRepository, type AgentRepository } from "./agent-repository.js";

export type AgentUpdateInput = Partial<Omit<AgentDefinitionInput, "id">> & {
  readonly now?: () => string;
};

export interface AgentRegistryService {
  readonly create: (input: AgentDefinitionInput) => Promise<PersistedAgentDefinition>;
  readonly list: () => Promise<PersistedAgentDefinition[]>;
  readonly get: (id: string) => Promise<PersistedAgentDefinition | undefined>;
  readonly update: (id: string, input: AgentUpdateInput) => Promise<PersistedAgentDefinition>;
  readonly delete: (id: string) => Promise<boolean>;
}

export interface CreateAgentRegistryServiceOptions {
  readonly storePath?: string;
  readonly repository?: AgentRepository;
  readonly now?: () => string;
}

export function createAgentRegistryService(
  options: CreateAgentRegistryServiceOptions = {},
): AgentRegistryService {
  const repository =
    options.repository ?? createFileAgentRepository(options.storePath ?? ".agentdeck/agents.json");
  const now = options.now ?? (() => new Date().toISOString());

  return {
    async create(input) {
      const result = createAgentDefinition(input);
      if (!result.success) {
        throw new AgentValidationError(result.errors);
      }

      const timestamp = now();
      const persisted = {
        ...result.value,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await repository.save(persisted);
      return persisted;
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
        throw new Error(`Agent "${id}" was not found.`);
      }

      const result = createAgentDefinition({
        id: existing.id,
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        prompt: input.prompt ?? existing.prompt,
        model: input.model ?? existing.model,
        tools: input.tools ?? existing.tools,
        permissions: input.permissions ?? existing.permissions,
        memoryScope: input.memoryScope ?? existing.memoryScope,
        runtimePreference: input.runtimePreference ?? existing.runtimePreference,
        workspaceRoot: input.workspaceRoot ?? existing.workspaceRoot,
      });
      if (!result.success) {
        throw new AgentValidationError(result.errors);
      }

      const persisted = {
        ...result.value,
        createdAt: existing.createdAt,
        updatedAt: (input.now ?? now)(),
      };
      await repository.save(persisted);
      return persisted;
    },
    async delete(id) {
      return await repository.delete(id);
    },
  };
}

export class AgentValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(errors.join(" "));
    this.name = "AgentValidationError";
    this.errors = errors;
  }
}
