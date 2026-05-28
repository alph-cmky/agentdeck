import { pathToFileURL } from "node:url";

import { createDaemonServer, listenOnLocalhost } from "./server.js";

export { createDaemonServer, listenOnLocalhost } from "./server.js";
export { createEventBus } from "./events/event-bus.js";
export { DAEMON_EVENT_TYPES } from "./events/event-types.js";
export { handleEventsStream } from "./routes/events.js";
export type { DaemonEvent, DaemonEventType } from "./events/event-types.js";
export type { EventBus, EventSubscription } from "./events/event-bus.js";
export { getRuntimesResponse } from "./routes/runtimes.js";
export type {
  RuntimeDetectionRequest,
  RuntimeDetector,
  RuntimesResponse,
} from "./routes/runtimes.js";

export const daemonAppName = "@agentdeck/daemon";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.AGENTDECK_DAEMON_PORT ?? "17345");
  const server = createDaemonServer();
  listenOnLocalhost(server, port);
}
