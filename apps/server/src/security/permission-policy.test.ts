import { describe, expect, it } from "vitest";

import {
  createDefaultPermissionPolicy,
  DEFAULT_AGENT_PERMISSION_GRANTS,
} from "./permission-policy.js";

describe("createDefaultPermissionPolicy", () => {
  it("allows read-only behavior for the default agent policy", () => {
    const policy = createDefaultPermissionPolicy();

    expect(DEFAULT_AGENT_PERMISSION_GRANTS).toEqual({
      read: true,
      write: false,
      safeCommands: true,
      arbitraryCommands: false,
      network: false,
      installDependencies: false,
      gitCommit: false,
      gitPush: false,
    });
    expect(policy.evaluate({ permission: "read" })).toMatchObject({
      decision: "allow",
      requiresApproval: false,
    });
  });

  it("rejects writes, installs, arbitrary commands, commits, pushes, and network by default", () => {
    const policy = createDefaultPermissionPolicy();

    for (const permission of [
      "write",
      "arbitraryCommands",
      "network",
      "installDependencies",
      "gitCommit",
      "gitPush",
    ] as const) {
      expect(policy.evaluate({ permission })).toMatchObject({
        permission,
        decision: "deny",
        requiresApproval: true,
      });
    }
  });

  it("allows safe commands and denies unsafe commands without arbitrary command approval", () => {
    const policy = createDefaultPermissionPolicy();

    expect(
      policy.evaluateCommand({
        command: "git status --short",
        safe: true,
      }),
    ).toMatchObject({
      permission: "safeCommands",
      decision: "allow",
      requiresApproval: false,
    });

    expect(
      policy.evaluateCommand({
        command: "rm -rf dist",
        safe: false,
      }),
    ).toMatchObject({
      permission: "arbitraryCommands",
      decision: "deny",
      requiresApproval: true,
      reason: 'Permission "arbitraryCommands" is not granted by the active policy.',
    });
  });

  it("allows dangerous permissions when explicitly granted", () => {
    const policy = createDefaultPermissionPolicy({
      grants: {
        write: true,
        network: true,
      },
    });

    expect(policy.evaluate({ permission: "write" })).toMatchObject({
      decision: "allow",
      requiresApproval: false,
    });
    expect(policy.evaluate({ permission: "network" })).toMatchObject({
      decision: "allow",
      requiresApproval: false,
    });
  });
});
