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
} from "./agents/agent-schema.js";
