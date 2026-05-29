import type { PersistedAgentDefinition } from "../agents/agent-schema.js";
import { createTaskRefsForMessage, type TaskRef } from "../tasks/task-schema.js";
import {
  createChannel as createChannelModel,
  createMessage as createMessageModel,
  createThread as createThreadModel,
  type Channel,
  type Message,
  type Thread,
} from "./chat-schema.js";

export interface CreateChatWorkspaceServiceOptions {
  readonly agents?: readonly PersistedAgentDefinition[];
  readonly now?: () => string;
}

export interface CreateChannelInput {
  readonly name: string;
}

export interface CreateMessageInput {
  readonly channelId: string;
  readonly authorId: string;
  readonly body: string;
  readonly threadId?: string;
}

export interface CreateMessageResult {
  readonly message: Message;
  readonly tasks: readonly TaskRef[];
}

export interface ChatWorkspaceService {
  readonly createChannel: (input: CreateChannelInput) => Channel;
  readonly listChannels: () => readonly Channel[];
  readonly createMessage: (input: CreateMessageInput) => CreateMessageResult;
  readonly listMessages: (threadId: string) => readonly Message[];
  readonly listThreads: (channelId: string) => readonly Thread[];
}

export function createChatWorkspaceService(
  options: CreateChatWorkspaceServiceOptions = {},
): ChatWorkspaceService {
  const channels: Channel[] = [];
  const threads: Thread[] = [];
  const messages: Message[] = [];
  const tasks: TaskRef[] = [];
  const now = options.now ?? (() => new Date().toISOString());
  let nextMessageNumber = 1;
  let nextThreadNumber = 1;

  return {
    createChannel(input) {
      const channel = createChannelModel({
        id: `channel-${slugify(input.name)}`,
        name: input.name,
        createdAt: now(),
      });
      channels.push(channel);
      return channel;
    },
    listChannels() {
      return [...channels];
    },
    createMessage(input) {
      const channel = channels.find((candidate) => candidate.id === input.channelId);
      if (!channel) {
        throw new Error(`Channel "${input.channelId}" was not found.`);
      }

      const thread = getOrCreateThread({
        channel,
        ...(input.threadId ? { requestedThreadId: input.threadId } : {}),
        threads,
        nextThreadId: () => `thread-${nextThreadNumber++}`,
        now,
      });
      const message = createMessageModel({
        id: `message-${nextMessageNumber++}`,
        threadId: thread.id,
        authorId: input.authorId,
        body: input.body,
        createdAt: now(),
      });
      const taskResult = createTaskRefsForMessage({
        message,
        agents: options.agents ?? [],
        now,
      });

      if (!taskResult.success) {
        throw new Error(taskResult.errors.join(" "));
      }

      messages.push(message);
      tasks.push(...taskResult.value);

      return {
        message,
        tasks: taskResult.value,
      };
    },
    listMessages(threadId) {
      return messages.filter((message) => message.threadId === threadId);
    },
    listThreads(channelId) {
      return threads.filter((thread) => thread.channelId === channelId);
    },
  };
}

function getOrCreateThread(input: {
  readonly channel: Channel;
  readonly requestedThreadId?: string;
  readonly threads: Thread[];
  readonly nextThreadId: () => string;
  readonly now: () => string;
}): Thread {
  if (input.requestedThreadId) {
    const existing = input.threads.find((thread) => thread.id === input.requestedThreadId);
    if (!existing) {
      throw new Error(`Thread "${input.requestedThreadId}" was not found.`);
    }

    return existing;
  }

  const thread = createThreadModel({
    id: input.nextThreadId(),
    channelId: input.channel.id,
    title: input.channel.name,
    createdAt: input.now(),
  });
  input.threads.push(thread);
  return thread;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "channel";
}
