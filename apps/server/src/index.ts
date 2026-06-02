export const serverAppName = "@agentdeck/server";

export {
  AGENT_MEMORY_SCOPES,
  AGENT_RUNTIME_PREFERENCES,
  createAgentDefinition,
  getReadOnlyAgentPermissions,
  validateAgentDefinition,
} from "./agents/agent-schema.js";
export type {
  AgentDefinition,
  AgentDefinitionInput,
  AgentMemoryScope,
  AgentPermissions,
  AgentRuntimePreference,
  AgentSchemaResult,
  AgentValidationResult,
  PersistedAgentDefinition,
} from "./agents/agent-schema.js";
export { createFileAgentRepository } from "./agents/agent-repository.js";
export type { AgentRepository } from "./agents/agent-repository.js";
export { AgentValidationError, createAgentRegistryService } from "./agents/agent-service.js";
export type {
  AgentRegistryService,
  AgentUpdateInput,
  CreateAgentRegistryServiceOptions,
} from "./agents/agent-service.js";
