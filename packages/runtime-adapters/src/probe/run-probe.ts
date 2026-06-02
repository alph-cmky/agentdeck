import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

export interface ProbeShellInvocation {
  readonly command: string;
  readonly args: readonly string[];
}

export interface ProbeShellOptions {
  readonly platform?: NodeJS.Platform;
  readonly shell?: string;
}

export interface RunProbeOptions extends ProbeShellOptions {
  readonly timeoutMs?: number;
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export interface RunProbeResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
  readonly elapsedMs: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export function getProbeShellInvocation(
  probeCommand: string,
  options: ProbeShellOptions = {},
): ProbeShellInvocation {
  const platform = options.platform ?? process.platform;

  if (platform === "darwin") {
    return {
      command: "/bin/zsh",
      args: ["-lc", probeCommand],
    };
  }

  if (platform === "win32") {
    return {
      command: options.shell ?? "cmd.exe",
      args: ["/d", "/s", "/c", probeCommand],
    };
  }

  return {
    command: options.shell ?? process.env.SHELL ?? "/bin/sh",
    args: ["-lc", probeCommand],
  };
}

/**
 * Runs a read-only runtime detection probe.
 *
 * This helper is intentionally for metadata probes such as `command -v`,
 * `tool --version`, and `tool --help`. Do not use it for write-oriented
 * commands, installs, file mutation, git mutation, or long-running tasks.
 */
export async function runProbe(
  probeCommand: string,
  options: RunProbeOptions = {},
): Promise<RunProbeResult> {
  const startedAt = performance.now();
  const invocation = getProbeShellInvocation(probeCommand, options);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return await new Promise<RunProbeResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(invocation.command, [...invocation.args], {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve({
        stdout: stdout.trimEnd(),
        stderr: (stderr + error.message).trimEnd(),
        exitCode: null,
        signal: null,
        timedOut,
        elapsedMs: performance.now() - startedAt,
      });
    });

    child.on("close", (exitCode, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: timedOut ? null : exitCode,
        signal,
        timedOut,
        elapsedMs: performance.now() - startedAt,
      });
    });
  });
}
