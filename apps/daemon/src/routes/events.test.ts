import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createEventBus } from "../events/event-bus.js";
import type { DaemonEvent } from "../events/event-types.js";
import { createDaemonServer } from "../server.js";

const servers: Server[] = [];
const abortControllers: AbortController[] = [];

async function startTestServer(options: Parameters<typeof createDaemonServer>[0]): Promise<string> {
  const server = createDaemonServer(options);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function runtimeDetectedEvent(): DaemonEvent {
  return {
    id: "event-1",
    type: "runtime.detected",
    createdAt: "2026-05-28T00:00:00.000Z",
    payload: {
      runtimeId: "node",
      status: "ready",
    },
  };
}

afterEach(async () => {
  for (const abortController of abortControllers.splice(0)) {
    abortController.abort();
  }

  await Promise.all(servers.splice(0).map(closeServer));
});

describe("GET /events", () => {
  it("streams daemon events over SSE and removes disconnected clients", async () => {
    const eventBus = createEventBus();
    const baseUrl = await startTestServer({ eventBus });
    const abortController = new AbortController();
    abortControllers.push(abortController);

    const response = await fetch(`${baseUrl}/events`, {
      signal: abortController.signal,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(eventBus.subscriberCount()).toBe(1);

    eventBus.publish(runtimeDetectedEvent());

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const text = await readUntil(reader, "event: runtime.detected");

    expect(text).toContain("event: runtime.detected");
    expect(text).toContain('"runtimeId":"node"');

    try {
      abortController.abort();
      await reader?.cancel();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(eventBus.subscriberCount()).toBe(0);
  });

  it("broadcasts runtime detection events when runtimes are requested", async () => {
    const eventBus = createEventBus();
    const received: DaemonEvent[] = [];
    eventBus.subscribe((event) => received.push(event));
    const baseUrl = await startTestServer({
      eventBus,
      detectRuntimes: async () => [
        {
          id: "node",
          name: "Node.js",
          type: "node",
          status: "ready",
          detected: true,
          scope: ["global"],
          capabilities: {},
          warnings: [],
          lastDetectedAt: "2026-05-28T00:00:00.000Z",
        },
      ],
    });

    const response = await fetch(`${baseUrl}/runtimes`);

    expect(response.status).toBe(200);
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      type: "runtime.detected",
      payload: {
        runtimeId: "node",
        status: "ready",
      },
    });
  });
});

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
  expectedText: string,
): Promise<string> {
  if (!reader) {
    throw new Error("Response body reader is not available.");
  }

  const decoder = new TextDecoder();
  let text = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const chunk = await reader.read();
    text += decoder.decode(chunk.value, { stream: !chunk.done });

    if (text.includes(expectedText) || chunk.done) {
      return text;
    }
  }

  return text;
}
