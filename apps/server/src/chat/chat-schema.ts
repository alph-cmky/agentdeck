export interface AgentMention {
  readonly agentId: string;
  readonly label: string;
  readonly start: number;
  readonly end: number;
}

export interface Channel {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
}

export interface Thread {
  readonly id: string;
  readonly channelId: string;
  readonly title: string;
  readonly createdAt: string;
}

export interface Message {
  readonly id: string;
  readonly threadId: string;
  readonly authorId: string;
  readonly body: string;
  readonly mentions: readonly AgentMention[];
  readonly createdAt: string;
}

export interface Conversation {
  readonly id: string;
  readonly channel: Channel;
  readonly threads: readonly Thread[];
  readonly messages: readonly Message[];
}

export function createChannel(input: Channel): Channel {
  return {
    id: input.id.trim(),
    name: input.name.trim(),
    createdAt: input.createdAt,
  };
}

export function createThread(input: Thread): Thread {
  return {
    id: input.id.trim(),
    channelId: input.channelId.trim(),
    title: input.title.trim(),
    createdAt: input.createdAt,
  };
}

export function createMessage(
  input: Omit<Message, "mentions"> & { readonly mentions?: readonly AgentMention[] },
): Message {
  const body = input.body.trim();

  return {
    id: input.id.trim(),
    threadId: input.threadId.trim(),
    authorId: input.authorId.trim(),
    body,
    mentions: input.mentions ?? parseAgentMentions(body),
    createdAt: input.createdAt,
  };
}

export function createConversation(input: Conversation): Conversation {
  return {
    id: input.id.trim(),
    channel: input.channel,
    threads: input.threads,
    messages: input.messages,
  };
}

export function parseAgentMentions(body: string): AgentMention[] {
  const mentions: AgentMention[] = [];
  const seenAgentIds = new Set<string>();
  const mentionPattern = /(^|[^\w])@([a-zA-Z][a-zA-Z0-9_-]*)\b/g;

  for (const match of body.matchAll(mentionPattern)) {
    const prefix = match[1] ?? "";
    const agentId = match[2]?.toLowerCase();
    if (!agentId || seenAgentIds.has(agentId)) {
      continue;
    }

    const start = match.index + prefix.length;
    const label = `@${agentId}`;
    mentions.push({
      agentId,
      label,
      start,
      end: start + label.length,
    });
    seenAgentIds.add(agentId);
  }

  return mentions;
}
