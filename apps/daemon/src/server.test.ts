import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createDaemonServer } from "./server.js";
import type { RuntimeDetectionResult } from "@agentdeck/runtime-adapters";

const servers: Server[] = [];

async function startTestServer(
  options: Parameters<typeof createDaemonServer>[0] = {},
): Promise<string> {
  const server = createDaemonServer(options);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function runtimeResult(overrides: Partial<RuntimeDetectionResult> = {}): RuntimeDetectionResult {
  return {
    id: "node",
    name: "Node.js",
    type: "node",
    status: "ready",
    detected: true,
    path: "/usr/local/bin/node",
    version: "v24.1.0",
    scope: ["global"],
    capabilities: { exec: true, versionCommand: true },
    warnings: [],
    lastDetectedAt: "2026-05-28T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(async (server) => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }),
  );
});

describe("daemon HTTP API", () => {
  it("returns a stable health payload from a localhost-bound server", async () => {
    const baseUrl = await startTestServer();

    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "agentdeck-daemon",
      version: "0.0.0",
    });
  });

  it("returns normalized runtime detection results for a workspace root", async () => {
    const calls: string[] = [];
    const baseUrl = await startTestServer({
      detectRuntimes: async (options) => {
        calls.push(options.workspaceRoot ?? "");
        return [runtimeResult()];
      },
    });

    const response = await fetch(`${baseUrl}/runtimes?workspaceRoot=/tmp/agentdeck`);

    expect(response.status).toBe(200);
    expect(calls).toEqual(["/tmp/agentdeck"]);
    expect(await response.json()).toEqual({
      runtimes: [runtimeResult()],
    });
  });

  it("rejects non-localhost browser origins", async () => {
    const baseUrl = await startTestServer();

    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://example.com" },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "origin_not_allowed",
      message: "Only localhost origins can access the AgentDeck daemon.",
    });
  });

  it("redacts token-like values from runtime responses", async () => {
    const baseUrl = await startTestServer({
      detectRuntimes: async () => [
        runtimeResult({
          warnings: ["failed with api_key=abc123 and token: xyz789"],
        }),
      ],
    });

    const response = await fetch(`${baseUrl}/runtimes`);
    const body = JSON.stringify(await response.json());

    expect(body).toContain("api_key=[REDACTED]");
    expect(body).toContain("token: [REDACTED]");
    expect(body).not.toContain("abc123");
    expect(body).not.toContain("xyz789");
  });
});
