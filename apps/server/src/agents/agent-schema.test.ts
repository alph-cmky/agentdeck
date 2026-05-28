import { describe, expect, it } from "vitest";

import {
  AGENT_MEMORY_SCOPES,
  AGENT_RUNTIME_PREFERENCES,
  createAgentDefinition,
  validateAgentDefinition,
} from "./agent-schema.js";

const baseAgentInput = {
  id: "agent-reviewer",
  name: "Reviewer",
  description: "Reviews code changes",
  prompt: "Review the current diff and report risks.",
  model: "gpt-5",
  tools: ["git.diff", "repo.read"],
  memoryScope: "workspace",
  runtimePreference: "codex",
  workspaceRoot: "/tmp/agentdeck",
} as const;

describe("agent schema constants", () => {
  it("defines MVP memory scopes and runtime preferences", () => {
    expect(AGENT_MEMORY_SCOPES).toEqual(["none", "workspace", "project"]);
    expect(AGENT_RUNTIME_PREFERENCES).toEqual(["codex", "claude", "auto"]);
  });
});

describe("createAgentDefinition", () => {
  it("normalizes all MVP agent fields and defaults permissions to read-only", () => {
    const result = createAgentDefinition(baseAgentInput);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(result.errors.join("\n"));
    }

    expect(result.value).toEqual({
      ...baseAgentInput,
      permissions: {
        read: true,
        write: false,
        install: false,
        arbitraryCommands: false,
        commit: false,
        push: false,
      },
    });
  });

  it("rejects missing prompts and non-explicit workspace roots", () => {
    const result = createAgentDefinition({
      ...baseAgentInput,
      prompt: "   ",
      workspaceRoot: "",
    });

    expect(result).toEqual({
      success: false,
      errors: ["prompt is required.", "workspaceRoot must be an explicit absolute path."],
    });
  });

  it("rejects invalid permissions that allow writes, installs, commands, commits, or pushes", () => {
    const result = createAgentDefinition({
      ...baseAgentInput,
      permissions: {
        read: true,
        write: true,
        install: true,
        arbitraryCommands: true,
        commit: true,
        push: true,
      },
    });

    expect(result).toEqual({
      success: false,
      errors: [
        "permissions.write must default to false for new agents.",
        "permissions.install must default to false for new agents.",
        "permissions.arbitraryCommands must default to false for new agents.",
        "permissions.commit must default to false for new agents.",
        "permissions.push must default to false for new agents.",
      ],
    });
  });
});

describe("validateAgentDefinition", () => {
  it("accepts an already normalized read-only agent definition", () => {
    const result = validateAgentDefinition({
      ...baseAgentInput,
      permissions: {
        read: true,
        write: false,
        install: false,
        arbitraryCommands: false,
        commit: false,
        push: false,
      },
    });

    expect(result).toEqual({ success: true, errors: [] });
  });
});
