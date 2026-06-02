import type { PersistedAgentDefinition } from "../agents/agent-schema.js";
import type { AgentMention, Message } from "../chat/chat-schema.js";

export const TASK_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskRef {
  readonly id: string;
  readonly agentId: string;
  readonly messageId: string;
  readonly threadId: string;
  readonly status: TaskStatus;
  readonly createdAt: string;
}

export type TaskSchemaResult<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly errors: readonly string[];
    };

export type TaskValidationResult =
  | {
      readonly success: true;
      readonly errors: readonly [];
    }
  | {
      readonly success: false;
      readonly errors: readonly string[];
    };

export function createTaskRefsForMessage(input: {
  readonly message: Message;
  readonly agents: readonly PersistedAgentDefinition[];
  readonly now?: () => string;
}): TaskSchemaResult<readonly TaskRef[]> {
  const validation = validateMentionedAgentsExist(input.message.mentions, input.agents);
  if (!validation.success) {
    return validation;
  }

  const createdAt = (input.now ?? (() => new Date().toISOString()))();
  return {
    success: true,
    value: input.message.mentions.map((mention) => ({
      id: `task-${input.message.id}-${mention.agentId}`,
      agentId: mention.agentId,
      messageId: input.message.id,
      threadId: input.message.threadId,
      status: "pending",
      createdAt,
    })),
  };
}

export function validateMentionedAgentsExist(
  mentions: readonly AgentMention[],
  agents: readonly PersistedAgentDefinition[],
): TaskValidationResult {
  const knownAgentIds = new Set(agents.map((agent) => agent.id));
  const errors = mentions
    .filter((mention) => !knownAgentIds.has(mention.agentId))
    .map((mention) => `Mentioned agent "${mention.agentId}" does not exist.`);

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    errors: [],
  };
}
