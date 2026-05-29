import type { Channel, Message } from "./chat-schema.js";
import type {
  ChatWorkspaceService,
  CreateChannelInput,
  CreateMessageInput,
  CreateMessageResult,
} from "./chat-service.js";

export interface ChatRoutes {
  readonly createChannel: (input: CreateChannelInput) => { readonly channel: Channel };
  readonly listChannels: () => { readonly channels: readonly Channel[] };
  readonly createMessage: (input: CreateMessageInput) => CreateMessageResult;
  readonly listMessages: (input: { readonly threadId: string }) => {
    readonly messages: readonly Message[];
  };
}

export function createChatRoutes(input: { readonly service: ChatWorkspaceService }): ChatRoutes {
  return {
    createChannel(channelInput) {
      return {
        channel: input.service.createChannel(channelInput),
      };
    },
    listChannels() {
      return {
        channels: input.service.listChannels(),
      };
    },
    createMessage(messageInput) {
      return input.service.createMessage(messageInput);
    },
    listMessages(messageInput) {
      return {
        messages: input.service.listMessages(messageInput.threadId),
      };
    },
  };
}
