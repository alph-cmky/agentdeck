import { detectClaudeRuntime } from "./claude.js";
import { detectCodeRuntime } from "./code.js";
import { detectCodexRuntime } from "./codex.js";
import { detectGitRuntime } from "./git.js";
import { detectLmStudioRuntime } from "./lmstudio.js";
import { detectNodeRuntime } from "./node.js";
import { detectOllamaRuntime } from "./ollama.js";
import type { RunProbeResult } from "../probe/run-probe.js";
import type { RuntimeDetectionResult } from "../runtime-types.js";

export interface DetectCoreRuntimesOptions {
  readonly workspaceRoot?: string;
  readonly homeDir?: string;
  readonly ollamaHealthUrl?: string;
  readonly lmStudioHealthUrl?: string;
  readonly lastDetectedAt?: string;
  readonly runProbe?: (command: string) => Promise<RunProbeResult>;
  readonly fetchHealth?: (
    url: string,
  ) => Promise<{ readonly ok: boolean; readonly status: number }>;
}

export async function detectCoreRuntimes(
  options: DetectCoreRuntimesOptions = {},
): Promise<RuntimeDetectionResult[]> {
  const commonOptions = {
    ...(options.lastDetectedAt ? { lastDetectedAt: options.lastDetectedAt } : {}),
    ...(options.runProbe ? { runProbe: options.runProbe } : {}),
  };

  return await Promise.all([
    detectCodexRuntime({
      ...commonOptions,
      ...(options.workspaceRoot ? { workspaceRoot: options.workspaceRoot } : {}),
      ...(options.homeDir ? { homeDir: options.homeDir } : {}),
    }),
    detectClaudeRuntime(commonOptions),
    detectOllamaRuntime({
      ...commonOptions,
      ...(options.ollamaHealthUrl ? { healthUrl: options.ollamaHealthUrl } : {}),
      ...(options.fetchHealth ? { fetchHealth: options.fetchHealth } : {}),
    }),
    detectLmStudioRuntime({
      ...commonOptions,
      ...(options.lmStudioHealthUrl ? { healthUrl: options.lmStudioHealthUrl } : {}),
      ...(options.fetchHealth ? { fetchHealth: options.fetchHealth } : {}),
    }),
    detectNodeRuntime(commonOptions),
    detectGitRuntime(commonOptions),
    detectCodeRuntime(commonOptions),
  ]);
}
