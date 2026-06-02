import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { detectCoreRuntimes } from "@agentdeck/runtime-adapters";

import { createEventBus, type EventBus } from "./events/event-bus.js";
import { handleEventsStream } from "./routes/events.js";
import { getRuntimesResponse, type RuntimeDetector } from "./routes/runtimes.js";

export interface CreateDaemonServerOptions {
  readonly detectRuntimes?: RuntimeDetector;
  readonly eventBus?: EventBus;
}

const HEALTH_RESPONSE = {
  ok: true,
  service: "agentdeck-daemon",
  version: "0.0.0",
} as const;

export function createDaemonServer(options: CreateDaemonServerOptions = {}): Server {
  const detectRuntimes = options.detectRuntimes ?? detectCoreRuntimes;
  const eventBus = options.eventBus ?? createEventBus();

  return createServer(async (request, response) => {
    try {
      if (!isAllowedOrigin(request.headers.origin)) {
        writeJson(response, 403, {
          error: "origin_not_allowed",
          message: "Only localhost origins can access the AgentDeck daemon.",
        });
        return;
      }

      const requestUrl = getRequestUrl(request);

      if (request.method === "GET" && requestUrl.pathname === "/health") {
        writeJson(response, 200, HEALTH_RESPONSE);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/runtimes") {
        const workspaceRoot = requestUrl.searchParams.get("workspaceRoot") ?? undefined;
        const body = await getRuntimesResponse({
          ...(workspaceRoot ? { workspaceRoot } : {}),
          detectRuntimes,
        });
        for (const runtime of body.runtimes) {
          eventBus.publish({
            id: `runtime.${runtime.id}.${Date.now()}`,
            type: "runtime.detected",
            createdAt: new Date().toISOString(),
            payload: {
              runtimeId: runtime.id,
              status: runtime.status,
            },
          });
        }
        writeJson(response, 200, body);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/events") {
        handleEventsStream(response, eventBus);
        return;
      }

      writeJson(response, 404, {
        error: "not_found",
        message: "Route not found.",
      });
    } catch {
      writeJson(response, 500, {
        error: "internal_error",
        message: "AgentDeck daemon request failed.",
      });
    }
  });
}

export function listenOnLocalhost(server: Server, port: number): void {
  server.listen(port, "127.0.0.1");
}

function getRequestUrl(request: IncomingMessage): URL {
  return new URL(request.url ?? "/", "http://127.0.0.1");
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}
