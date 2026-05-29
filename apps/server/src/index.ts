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
export {
  createChannel,
  createConversation,
  createMessage,
  createThread,
  parseAgentMentions,
} from "./chat/chat-schema.js";
export type { AgentMention, Channel, Conversation, Message, Thread } from "./chat/chat-schema.js";
export { createChatRoutes } from "./chat/chat-routes.js";
export { createChatWorkspaceService } from "./chat/chat-service.js";
export type { ChatRoutes } from "./chat/chat-routes.js";
export type {
  ChatWorkspaceService,
  CreateChannelInput,
  CreateMessageInput,
  CreateMessageResult,
  CreateChatWorkspaceServiceOptions,
} from "./chat/chat-service.js";
export {
  TASK_STATUSES,
  createTaskRefsForMessage,
  validateMentionedAgentsExist,
} from "./tasks/task-schema.js";
export type {
  TaskRef,
  TaskSchemaResult,
  TaskStatus,
  TaskValidationResult,
} from "./tasks/task-schema.js";
export { createPatchProposalService } from "./patches/patch-service.js";
export type {
  CreatePatchProposalServiceOptions,
  PatchProposalService,
} from "./patches/patch-service.js";
export type {
  JsonPatchOperation,
  PatchApprovalState,
  PatchDiffPreview,
  PatchProposal,
  PatchTargetType,
  ProposeWorkflowPatchInput,
  WorkflowPatchProposal,
} from "./patches/patch-schema.js";
export {
  DEFAULT_AGENT_PERMISSION_GRANTS,
  PERMISSION_NAMES,
  createDefaultPermissionPolicy,
} from "./security/permission-policy.js";
export type {
  CommandPermissionEvaluationRequest,
  CreateDefaultPermissionPolicyOptions,
  PermissionDecision,
  PermissionEvaluationRequest,
  PermissionEvaluationResult,
  PermissionGrants,
  PermissionName,
  PermissionPolicy,
} from "./security/permission-policy.js";
