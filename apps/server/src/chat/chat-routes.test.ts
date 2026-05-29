import { describe, expect, it } from "vitest";

import { createChatRoutes } from "./chat-routes.js";
import { createChatWorkspaceService } from "./chat-service.js";

describe("createChatRoutes", () => {
  it("exposes route handlers for channels and messages", () => {
    const service = createChatWorkspaceService({
      now: () => "2026-05-29T00:00:00.000Z",
    });
    const routes = createChatRoutes({ service });

    const channelResponse = routes.createChannel({ name: "Main" });
    const messageResponse = routes.createMessage({
      channelId: channelResponse.channel.id,
      authorId: "user-1",
      body: "Hello",
    });

    expect(routes.listChannels()).toEqual({ channels: [channelResponse.channel] });
    expect(messageResponse.tasks).toEqual([]);
    expect(routes.listMessages({ threadId: messageResponse.message.threadId })).toEqual({
      messages: [messageResponse.message],
    });
  });
});
