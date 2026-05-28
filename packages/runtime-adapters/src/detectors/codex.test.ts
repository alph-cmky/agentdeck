import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { detectCodexRuntime } from "./codex.js";
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

async function createTempDir(prefix: string): Promise<string> {
  return await mkdtemp(join(tmpdir(), prefix));
}

describe("detectCodexRuntime", () => {
  it("returns a missing result when the codex binary cannot be found", async () => {
    const result = await detectCodexRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        expect(command).toBe("command -v codex");
        return probeResult({
          exitCode: 1,
          stderr: "codex not found",
        });
      },
    });

    expect(result).toEqual({
      id: "codex",
      name: "OpenAI Codex CLI",
      type: "codex",
      status: "missing",
      detected: false,
      scope: [],
      capabilities: {},
      warnings: ["codex not found"],
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
    });
  });

  it("returns ready when binary and version probes succeed", async () => {
    const commands: string[] = [];
    const result = await detectCodexRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        commands.push(command);
        if (command === "command -v codex") {
          return probeResult({ stdout: "/usr/local/bin/codex" });
        }
        if (command === "codex --version") {
          return probeResult({ stdout: "codex-cli 0.128.0" });
        }
        return probeResult({ stdout: "Usage: codex\nCommands:\n  exec\n  mcp" });
      },
    });

    expect(commands).toEqual(["command -v codex", "codex --version", "codex --help"]);
    expect(result.status).toBe("ready");
    expect(result.detected).toBe(true);
    expect(result.path).toBe("/usr/local/bin/codex");
    expect(result.version).toBe("codex-cli 0.128.0");
    expect(result.capabilities).toEqual({
      exec: true,
      mcp: true,
      versionCommand: true,
      localProviders: [],
    });
  });

  it("returns configured when ~/.codex/config.toml exists without reading auth files", async () => {
    const homeDir = await createTempDir("agentdeck-codex-home-");
    await mkdir(join(homeDir, ".codex"), { recursive: true });
    await writeFile(join(homeDir, ".codex", "config.toml"), 'model = "gpt-5"\n');
    await writeFile(join(homeDir, ".codex", "auth.json"), '{"token":"super-secret-token"}\n');

    const result = await detectCodexRuntime({
      homeDir,
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v codex") {
          return probeResult({ stdout: "/usr/local/bin/codex" });
        }
        if (command === "codex --version") {
          return probeResult({ stdout: "codex-cli 0.128.0" });
        }
        return probeResult({ stdout: "Usage: codex\nCommands:\n  exec" });
      },
    });

    expect(result.status).toBe("configured");
    expect(result.configPath).toBe(join(homeDir, ".codex", "config.toml"));
    expect(JSON.stringify(result)).not.toContain("super-secret-token");
    expect(JSON.stringify(result)).not.toContain("auth.json");
  });

  it("returns projectActive when project markers exist", async () => {
    const workspaceRoot = await createTempDir("agentdeck-codex-workspace-");
    await mkdir(join(workspaceRoot, ".codex"), { recursive: true });
    await writeFile(join(workspaceRoot, "AGENTS.md"), "# instructions\n");

    const result = await detectCodexRuntime({
      workspaceRoot,
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v codex") {
          return probeResult({ stdout: "/usr/local/bin/codex" });
        }
        if (command === "codex --version") {
          return probeResult({ stdout: "codex-cli 0.128.0" });
        }
        return probeResult({ stdout: "Usage: codex\nCommands:\n  exec\n  mcp" });
      },
    });

    expect(result.status).toBe("projectActive");
    expect(result.scope).toEqual(["global", "project"]);
    expect(result.projectMarkers).toEqual([
      join(workspaceRoot, ".codex"),
      join(workspaceRoot, "AGENTS.md"),
    ]);
  });

  it("returns localProviderReady when Codex help exposes local provider support", async () => {
    const result = await detectCodexRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v codex") {
          return probeResult({ stdout: "/usr/local/bin/codex" });
        }
        if (command === "codex --version") {
          return probeResult({ stdout: "codex-cli 0.128.0" });
        }
        return probeResult({
          stdout:
            "Usage: codex --oss --local-provider ollama --local-provider lmstudio\nCommands:\n  exec\n  mcp",
        });
      },
    });

    expect(result.status).toBe("localProviderReady");
    expect(result.scope).toEqual(["global", "localProvider"]);
    expect(result.capabilities.localProviders).toEqual(["ollama", "lmstudio"]);
  });

  it("redacts token-like values from warnings", async () => {
    const result = await detectCodexRuntime({
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
      runProbe: async (command) => {
        if (command === "command -v codex") {
          return probeResult({ stdout: "/usr/local/bin/codex" });
        }
        if (command === "codex --version") {
          return probeResult({
            exitCode: 1,
            stderr: "failed with api_key=abc123 and token: xyz789",
          });
        }
        return probeResult({ stdout: "" });
      },
    });

    expect(result.warnings.join("\n")).toContain("api_key=[REDACTED]");
    expect(result.warnings.join("\n")).toContain("token: [REDACTED]");
    expect(result.warnings.join("\n")).not.toContain("abc123");
    expect(result.warnings.join("\n")).not.toContain("xyz789");
  });
});
