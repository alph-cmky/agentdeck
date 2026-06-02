import { describe, expect, it } from "vitest";

import { getProbeShellInvocation, runProbe } from "./run-probe.js";

describe("getProbeShellInvocation", () => {
  it("uses zsh login shell on macOS so GUI-launched apps get user PATH", () => {
    expect(getProbeShellInvocation("command -v codex", { platform: "darwin" })).toEqual({
      command: "/bin/zsh",
      args: ["-lc", "command -v codex"],
    });
  });

  it("uses a regular login shell on non-macOS platforms", () => {
    expect(
      getProbeShellInvocation("command -v node", {
        platform: "linux",
        shell: "/bin/bash",
      }),
    ).toEqual({
      command: "/bin/bash",
      args: ["-lc", "command -v node"],
    });
  });
});

describe("runProbe", () => {
  it("captures stdout, exit code, and elapsed time for successful read-only probes", async () => {
    const result = await runProbe("printf 'codex-cli 0.128.0'");

    expect(result.stdout).toBe("codex-cli 0.128.0");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("captures stderr and non-zero exit code without throwing", async () => {
    const result = await runProbe("printf 'missing runtime' >&2; exit 7");

    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("missing runtime");
    expect(result.exitCode).toBe(7);
    expect(result.timedOut).toBe(false);
  });

  it("returns a normalized timeout result", async () => {
    const result = await runProbe('node -e "setTimeout(() => {}, 500)"', {
      timeoutMs: 50,
    });

    expect(result.exitCode).toBeNull();
    expect(result.timedOut).toBe(true);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
