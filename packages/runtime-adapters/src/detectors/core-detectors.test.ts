import { describe, expect, it } from "vitest";

import { detectClaudeRuntime } from "./claude.js";
import { detectCodeRuntime } from "./code.js";
import { detectCoreRuntimes } from "./core-runtimes.js";
import { detectGitRuntime } from "./git.js";
import { detectLmStudioRuntime } from "./lmstudio.js";
import { detectNodeRuntime } from "./node.js";
import { detectOllamaRuntime } from "./ollama.js";
import type { RunProbeResult } from "../probe/run-probe.js";

function probeResult(overrides: Partial<RunProbeResult>): RunProbeResult {
  return {
    stdout: "",
    stderr: "",
    exitCode: 0,
    signal: null,
    timedOut: false,
    elapsedMs: 1,
    ...overrides,
  };
}

describe("core CLI runtime detectors", () => {
  it("detects Claude from path and version probes", async () => {
    const commands: string[] = [];
    const result = await detectClaudeRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        commands.push(command);
        if (command === "command -v claude") {
          return probeResult({ stdout: "/opt/homebrew/bin/claude" });
        }
        return probeResult({ stdout: "1.2.3" });
      },
    });

    expect(commands).toEqual(["command -v claude", "claude --version"]);
    expect(result).toMatchObject({
      id: "claude",
      name: "Claude Code",
      type: "claude",
      status: "ready",
      detected: true,
      path: "/opt/homebrew/bin/claude",
      version: "1.2.3",
      scope: ["global"],
      capabilities: { exec: true, versionCommand: true },
      warnings: [],
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
    });
  });

  it("normalizes missing CLI runtime warnings for UI display", async () => {
    const result = await detectCodeRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async () => probeResult({ exitCode: 1, stderr: "" }),
    });

    expect(result).toEqual({
      id: "code",
      name: "Visual Studio Code CLI",
      type: "code",
      status: "missing",
      detected: false,
      scope: [],
      capabilities: {},
      warnings: ["Visual Studio Code CLI was not found on PATH."],
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
    });
  });

  it("detects Node, Git, and VS Code with normalized result rows", async () => {
    const detectors = [
      {
        detect: detectNodeRuntime,
        pathCommand: "command -v node",
        versionCommand: "node --version",
        version: "v24.1.0",
        id: "node",
      },
      {
        detect: detectGitRuntime,
        pathCommand: "command -v git",
        versionCommand: "git --version",
        version: "git version 2.50.0",
        id: "git",
      },
      {
        detect: detectCodeRuntime,
        pathCommand: "command -v code",
        versionCommand: "code --version",
        version: "1.101.0\nabcdef",
        id: "code",
      },
    ] as const;

    const results = await Promise.all(
      detectors.map((runtime) =>
        runtime.detect({
          lastDetectedAt: "2026-05-28T00:00:00.000Z",
          runProbe: async (command) => {
            if (command === runtime.pathCommand) {
              return probeResult({ stdout: `/usr/local/bin/${runtime.id}` });
            }
            expect(command).toBe(runtime.versionCommand);
            return probeResult({ stdout: runtime.version });
          },
        }),
      ),
    );

    expect(results.map((result) => result.id)).toEqual(["node", "git", "code"]);
    expect(results.every((result) => result.detected)).toBe(true);
    expect(results.every((result) => result.status === "ready")).toBe(true);
    expect(results.every((result) => result.scope.join(",") === "global")).toBe(true);
  });
});

describe("local provider runtime detectors", () => {
  it("detects Ollama local provider readiness from CLI and configured HTTP health check", async () => {
    const result = await detectOllamaRuntime({
      healthUrl: "http://127.0.0.1:11434/api/tags",
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v ollama") {
          return probeResult({ stdout: "/usr/local/bin/ollama" });
        }
        return probeResult({ stdout: "ollama version is 0.9.0" });
      },
      fetchHealth: async (url) => {
        expect(url).toBe("http://127.0.0.1:11434/api/tags");
        return { ok: true, status: 200 };
      },
    });

    expect(result.status).toBe("localProviderReady");
    expect(result.scope).toEqual(["global", "localProvider"]);
    expect(result.capabilities).toEqual({ chat: true, versionCommand: true });
  });

  it("keeps LM Studio ready when no HTTP health check is configured", async () => {
    let healthCalled = false;
    const result = await detectLmStudioRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v lms") {
          return probeResult({ stdout: "/usr/local/bin/lms" });
        }
        return probeResult({ stdout: "0.3.0" });
      },
      fetchHealth: async () => {
        healthCalled = true;
        return { ok: true, status: 200 };
      },
    });

    expect(healthCalled).toBe(false);
    expect(result.status).toBe("ready");
    expect(result.scope).toEqual(["global"]);
  });
});

describe("detectCoreRuntimes", () => {
  it("returns one normalized result list for all MVP runtime rows", async () => {
    const result = await detectCoreRuntimes({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async () => probeResult({ exitCode: 1 }),
    });

    expect(result.map((runtime) => runtime.id)).toEqual([
      "codex",
      "claude",
      "ollama",
      "lmstudio",
      "node",
      "git",
      "code",
    ]);
    expect(result.every((runtime) => runtime.lastDetectedAt === "2026-05-28T00:00:00.000Z")).toBe(
      true,
    );
  });
});
