import { describe, expect, it } from "vitest";

import { createMessage } from "../chat/chat-schema.js";
import { createTaskRefsForMessage, validateMentionedAgentsExist } from "./task-schema.js";
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

describe("task schema", () => {
  it("turns a chat message with @reviewer into a pending task linked to an agent", () => {
    const message = createMessage({
      id: "message-1",
      threadId: "thread-1",
      authorId: "user-1",
      body: "@reviewer please review this diff",
      createdAt: "2026-05-29T00:01:00.000Z",
    });

    const result = createTaskRefsForMessage({
      message,
      agents: [agent("reviewer")],
      now: () => "2026-05-29T00:02:00.000Z",
    });

    expect(result).toEqual({
      success: true,
      value: [
        {
          id: "task-message-1-reviewer",
          agentId: "reviewer",
          messageId: "message-1",
          threadId: "thread-1",
          status: "pending",
          createdAt: "2026-05-29T00:02:00.000Z",
        },
      ],
    });
  });

  it("rejects task creation when mentioned agents do not exist", () => {
    const message = createMessage({
      id: "message-1",
      threadId: "thread-1",
      authorId: "user-1",
      body: "@reviewer and @missing please help",
      createdAt: "2026-05-29T00:01:00.000Z",
    });

    expect(validateMentionedAgentsExist(message.mentions, [agent("reviewer")])).toEqual({
      success: false,
      errors: ['Mentioned agent "missing" does not exist.'],
    });
  });
});
