import { describe, expect, it } from "vitest";

import { createChatWorkspaceService } from "./chat-service.js";
import type { PersistedAgentDefinition } from "../agents/agent-schema.js";

function agent(id: string): PersistedAgentDefinition {
  return {
    id,
    name: id,
    description: "Agent",
    prompt: "Do the work.",
    model: "gpt-5",
    tools: [],
    permissions: {
      read: true,
      write: false,
      install: false,
      arbitraryCommands: false,
      commit: false,
      push: false,
    },
    memoryScope: "workspace",
    runtimePreference: "codex",
    workspaceRoot: "/tmp/agentdeck",
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
  };
}

describe("createChatWorkspaceService", () => {
  it("creates and lists channels", () => {
    const service = createChatWorkspaceService({
      now: () => "2026-05-29T00:00:00.000Z",
    });

    const channel = service.createChannel({ name: " Main " });

    expect(channel).toEqual({
      id: "channel-main",
      name: "Main",
      createdAt: "2026-05-29T00:00:00.000Z",
    });
    expect(service.listChannels()).toEqual([channel]);
  });

  it("creates and lists messages under an auto-created thread", () => {
    const service = createChatWorkspaceService({
      now: () => "2026-05-29T00:00:00.000Z",
    });
    const channel = service.createChannel({ name: "Main" });

    const result = service.createMessage({
      channelId: channel.id,
      authorId: "user-1",
      body: "Hello team",
    });

    expect(result.tasks).toEqual([]);
    expect(result.message).toMatchObject({
      id: "message-1",
      threadId: "thread-1",
      authorId: "user-1",
      body: "Hello team",
      mentions: [],
      createdAt: "2026-05-29T00:00:00.000Z",
    });
    expect(service.listMessages(result.message.threadId)).toEqual([result.message]);
  });

  it("creates pending task refs when a message contains valid @agent mentions", () => {
    const service = createChatWorkspaceService({
      agents: [agent("reviewer")],
      now: () => "2026-05-29T00:00:00.000Z",
    });
    const channel = service.createChannel({ name: "Main" });

    const result = service.createMessage({
      channelId: channel.id,
      authorId: "user-1",
      body: "@reviewer please review this",
    });

    expect(result.tasks).toEqual([
      {
        id: "task-message-1-reviewer",
        agentId: "reviewer",
        messageId: "message-1",
        threadId: "thread-1",
        status: "pending",
        createdAt: "2026-05-29T00:00:00.000Z",
      },
    ]);
  });

  it("rejects messages that mention unknown agents before storing them", () => {
    const service = createChatWorkspaceService({
      agents: [agent("reviewer")],
      now: () => "2026-05-29T00:00:00.000Z",
    });
    const channel = service.createChannel({ name: "Main" });

    expect(() =>
      service.createMessage({
        channelId: channel.id,
        authorId: "user-1",
        body: "@missing please help",
      }),
    ).toThrow('Mentioned agent "missing" does not exist.');
    expect(service.listMessages("thread-1")).toEqual([]);
  });
});
