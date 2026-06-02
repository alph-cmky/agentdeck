import type { ServerResponse } from "node:http";

import type { EventBus } from "../events/event-bus.js";
import type { DaemonEvent } from "../events/event-types.js";

export function handleEventsStream(response: ServerResponse, eventBus: EventBus): void {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });
  response.write(": connected\n\n");

  const subscription = eventBus.subscribe((event) => {
    response.write(formatServerSentEvent(event));
  });

  response.on("close", () => {
    subscription.unsubscribe();
  });
}

function formatServerSentEvent(event: DaemonEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
