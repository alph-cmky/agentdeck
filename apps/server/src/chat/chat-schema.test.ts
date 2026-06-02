import { describe, expect, it } from "vitest";

import {
  createChannel,
  createConversation,
  createMessage,
  createThread,
  parseAgentMentions,
} from "./chat-schema.js";

describe("chat schema", () => {
  it("creates normalized conversation, channel, thread, and message models", () => {
    const channel = createChannel({
      id: "channel-main",
      name: " Main ",
      createdAt: "2026-05-29T00:00:00.000Z",
    });
    const thread = createThread({
      id: "thread-1",
      channelId: "channel-main",
      title: " Review ",
      createdAt: "2026-05-29T00:01:00.000Z",
    });
    const message = createMessage({
      id: "message-1",
      threadId: "thread-1",
      authorId: "user-1",
      body: " @reviewer please check this ",
      createdAt: "2026-05-29T00:02:00.000Z",
    });
    const conversation = createConversation({
      id: "conversation-1",
      channel,
      threads: [thread],
      messages: [message],
    });

    expect(conversation).toEqual({
      id: "conversation-1",
      channel: {
        id: "channel-main",
        name: "Main",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
      threads: [
        {
          id: "thread-1",
          channelId: "channel-main",
          title: "Review",
          createdAt: "2026-05-29T00:01:00.000Z",
        },
      ],
      messages: [
        {
          id: "message-1",
          threadId: "thread-1",
          authorId: "user-1",
          body: "@reviewer please check this",
          mentions: [{ agentId: "reviewer", label: "@reviewer", start: 0, end: 9 }],
          createdAt: "2026-05-29T00:02:00.000Z",
        },
      ],
    });
  });

  it("parses unique @agent mentions into structured references", () => {
    expect(parseAgentMentions("@reviewer please ask @builder and @reviewer again")).toEqual([
      { agentId: "reviewer", label: "@reviewer", start: 0, end: 9 },
      { agentId: "builder", label: "@builder", start: 21, end: 29 },
    ]);
  });
});
