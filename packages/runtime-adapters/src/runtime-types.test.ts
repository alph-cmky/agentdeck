import { describe, expect, it } from "vitest";

import {
  RUNTIME_STATUS_RANK,
  RUNTIME_TYPES,
  createMissingRuntimeResult,
  isRuntimeAtLeastStatus,
  type RuntimeDetectionResult,
  type RuntimeStatus,
  type RuntimeType,
} from "./runtime-types.js";

describe("runtime type contracts", () => {
  it("defines the MVP runtime types without provider-specific branching", () => {
    const expectedRuntimeTypes: RuntimeType[] = [
      "codex",
      "claude",
      "ollama",
      "lmstudio",
      "node",
      "git",
      "code",
    ];

    expect(RUNTIME_TYPES).toEqual(expectedRuntimeTypes);
  });

  it("orders runtime statuses by readiness level", () => {
    const expectedStatuses: RuntimeStatus[] = [
      "missing",
      "ready",
      "configured",
      "projectActive",
      "localProviderReady",
    ];

    expect(Object.keys(RUNTIME_STATUS_RANK)).toEqual(expectedStatuses);
    expect(isRuntimeAtLeastStatus("projectActive", "configured")).toBe(true);
    expect(isRuntimeAtLeastStatus("ready", "projectActive")).toBe(false);
  });

  it("represents a complete detected runtime result", () => {
    const result: RuntimeDetectionResult = {
      id: "codex",
      name: "OpenAI Codex CLI",
      type: "codex",
      status: "projectActive",
      detected: true,
      path: "/usr/local/bin/codex",
      version: "codex-cli 0.128.0",
      scope: ["global", "project"],
      configPath: "/Users/example/.codex/config.toml",
      projectMarkers: ["/workspace/.codex", "/workspace/AGENTS.md"],
      capabilities: {
        exec: true,
        mcp: true,
        localProviders: ["ollama"],
      },
      warnings: [],
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
    };

    expect(result.type).toBe("codex");
    expect(result.capabilities.localProviders).toEqual(["ollama"]);
  });

  it("creates a normalized missing runtime result", () => {
    expect(
      createMissingRuntimeResult({
        id: "ollama",
        name: "Ollama",
        type: "ollama",
        lastDetectedAt: "2026-05-28T00:00:00.000Z",
        warnings: ["ollama was not found on PATH"],
      }),
    ).toEqual({
      id: "ollama",
      name: "Ollama",
      type: "ollama",
      status: "missing",
      detected: false,
      scope: [],
      capabilities: {},
      warnings: ["ollama was not found on PATH"],
      lastDetectedAt: "2026-05-28T00:00:00.000Z",
    });
  });
});
