import { isAbsolute } from "node:path";

export const AGENT_MEMORY_SCOPES = ["none", "workspace", "project"] as const;
export const AGENT_RUNTIME_PREFERENCES = ["codex", "claude", "auto"] as const;

export type AgentMemoryScope = (typeof AGENT_MEMORY_SCOPES)[number];
export type AgentRuntimePreference = (typeof AGENT_RUNTIME_PREFERENCES)[number];

export interface AgentPermissions {
  readonly read: boolean;
  readonly write: boolean;
  readonly install: boolean;
  readonly arbitraryCommands: boolean;
  readonly commit: boolean;
  readonly push: boolean;
}

export interface AgentDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly model: string;
  readonly tools: readonly string[];
  readonly permissions: AgentPermissions;
  readonly memoryScope: AgentMemoryScope;
  readonly runtimePreference: AgentRuntimePreference;
  readonly workspaceRoot: string;
}

export type AgentDefinitionInput = Omit<AgentDefinition, "permissions"> & {
  readonly permissions?: Partial<AgentPermissions>;
};

export type AgentSchemaResult<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly errors: readonly string[];
    };

export interface AgentValidationResult {
  readonly success: boolean;
  readonly errors: readonly string[];
}

const READ_ONLY_PERMISSIONS: AgentPermissions = {
  read: true,
  write: false,
  install: false,
  arbitraryCommands: false,
  commit: false,
  push: false,
};

export function createAgentDefinition(
  input: AgentDefinitionInput,
): AgentSchemaResult<AgentDefinition> {
  const permissions = {
    ...READ_ONLY_PERMISSIONS,
    ...input.permissions,
  };
  const agent: AgentDefinition = {
    id: input.id.trim(),
    name: input.name.trim(),
    description: input.description.trim(),
    prompt: input.prompt.trim(),
    model: input.model.trim(),
    tools: input.tools.map((tool) => tool.trim()).filter((tool) => tool.length > 0),
    permissions,
    memoryScope: input.memoryScope,
    runtimePreference: input.runtimePreference,
    workspaceRoot: input.workspaceRoot.trim(),
  };
  const validation = validateAgentDefinition(agent);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  return {
    success: true,
    value: agent,
  };
}

export function validateAgentDefinition(agent: AgentDefinition): AgentValidationResult {
  const errors: string[] = [];

  if (!agent.id.trim()) {
    errors.push("id is required.");
  }

  if (!agent.name.trim()) {
    errors.push("name is required.");
  }

  if (!agent.prompt.trim()) {
    errors.push("prompt is required.");
  }

  if (!agent.model.trim()) {
    errors.push("model is required.");
  }

  if (!isExplicitWorkspaceRoot(agent.workspaceRoot)) {
    errors.push("workspaceRoot must be an explicit absolute path.");
  }

  if (!isAgentMemoryScope(agent.memoryScope)) {
    errors.push("memoryScope is invalid.");
  }

  if (!isAgentRuntimePreference(agent.runtimePreference)) {
    errors.push("runtimePreference is invalid.");
  }

  validateReadOnlyPermissions(agent.permissions, errors);

  return {
    success: errors.length === 0,
    errors,
  };
}

export function getReadOnlyAgentPermissions(): AgentPermissions {
  return { ...READ_ONLY_PERMISSIONS };
}

function validateReadOnlyPermissions(permissions: AgentPermissions, errors: string[]): void {
  if (!permissions.read) {
    errors.push("permissions.read must be true.");
  }

  for (const permission of ["write", "install", "arbitraryCommands", "commit", "push"] as const) {
    if (permissions[permission]) {
      errors.push(`permissions.${permission} must default to false for new agents.`);
    }
  }
}

function isExplicitWorkspaceRoot(value: string): boolean {
  return value.trim().length > 0 && isAbsolute(value);
}

function isAgentMemoryScope(value: string): value is AgentMemoryScope {
  return AGENT_MEMORY_SCOPES.includes(value as AgentMemoryScope);
}

function isAgentRuntimePreference(value: string): value is AgentRuntimePreference {
  return AGENT_RUNTIME_PREFERENCES.includes(value as AgentRuntimePreference);
}
