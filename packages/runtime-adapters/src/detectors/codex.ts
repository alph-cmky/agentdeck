import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

import { runProbe, type RunProbeResult } from "../probe/run-probe.js";
import {
  createMissingRuntimeResult,
  type RuntimeCapabilities,
  type RuntimeDetectionResult,
  type RuntimeScope,
  type RuntimeStatus,
  type RuntimeType,
} from "../runtime-types.js";

export interface DetectCodexRuntimeOptions {
  readonly workspaceRoot?: string;
  readonly homeDir?: string;
  readonly lastDetectedAt?: string;
  readonly runProbe?: (command: string) => Promise<RunProbeResult>;
}

const CODEX_RUNTIME_ID = "codex";
const CODEX_RUNTIME_NAME = "OpenAI Codex CLI";

export async function detectCodexRuntime(
  options: DetectCodexRuntimeOptions = {},
): Promise<RuntimeDetectionResult> {
  const probe = options.runProbe ?? runProbe;
  const lastDetectedAt = options.lastDetectedAt ?? new Date().toISOString();
  const binaryProbe = await probe("command -v codex");

  if (binaryProbe.exitCode !== 0 || binaryProbe.stdout.length === 0) {
    return createMissingRuntimeResult({
      id: CODEX_RUNTIME_ID,
      name: CODEX_RUNTIME_NAME,
      type: "codex",
      lastDetectedAt,
      warnings: collectWarnings(binaryProbe),
    });
  }

  const versionProbe = await probe("codex --version");
  const helpProbe = await probe("codex --help");
  const configPath = options.homeDir ? await findCodexConfigPath(options.homeDir) : undefined;
  const projectMarkers = await findProjectMarkers(options.workspaceRoot);
  const version =
    versionProbe.exitCode === 0 && versionProbe.stdout.length > 0
      ? versionProbe.stdout.trim()
      : undefined;
  const capabilities = parseCodexCapabilities(helpProbe.stdout, Boolean(version));
  const scope = getRuntimeScope(projectMarkers, capabilities.localProviders ?? []);
  const warnings = [...collectWarnings(versionProbe), ...collectWarnings(helpProbe)];

  const result: RuntimeDetectionResult = {
    id: CODEX_RUNTIME_ID,
    name: CODEX_RUNTIME_NAME,
    type: "codex",
    status: getCodexStatus({
      configPath,
      projectMarkers,
      localProviders: capabilities.localProviders ?? [],
    }),
    detected: true,
    path: binaryProbe.stdout.trim(),
    scope,
    capabilities,
    warnings,
    lastDetectedAt,
  };

  return {
    ...result,
    ...(version ? { version } : {}),
    ...(configPath ? { configPath } : {}),
    ...(projectMarkers ? { projectMarkers } : {}),
  };
}

async function findCodexConfigPath(homeDir: string): Promise<string | undefined> {
  const configPath = join(homeDir, ".codex", "config.toml");

  try {
    await access(configPath, constants.R_OK);
    return configPath;
  } catch {
    return undefined;
  }
}

async function findProjectMarkers(
  workspaceRoot: string | undefined,
): Promise<string[] | undefined> {
  if (!workspaceRoot) {
    return undefined;
  }

  const markerCandidates = [join(workspaceRoot, ".codex"), join(workspaceRoot, "AGENTS.md")];
  const markers: string[] = [];

  for (const marker of markerCandidates) {
    try {
      await access(marker, constants.F_OK);
      markers.push(marker);
    } catch {
      // Missing project markers are normal for workspaces that do not use Codex yet.
    }
  }

  return markers.length > 0 ? markers : undefined;
}

function parseCodexCapabilities(helpText: string, versionCommand: boolean): RuntimeCapabilities {
  const normalizedHelp = helpText.toLowerCase();
  const localProviders: RuntimeType[] = [];

  if (normalizedHelp.includes("ollama")) {
    localProviders.push("ollama");
  }

  if (normalizedHelp.includes("lmstudio") || normalizedHelp.includes("lm studio")) {
    localProviders.push("lmstudio");
  }

  return {
    exec: /\bexec\b/.test(normalizedHelp),
    mcp: /\bmcp\b/.test(normalizedHelp),
    versionCommand,
    localProviders,
  };
}

function getRuntimeScope(
  projectMarkers: readonly string[] | undefined,
  localProviders: readonly RuntimeType[],
): RuntimeScope[] {
  const scope: RuntimeScope[] = ["global"];

  if (projectMarkers && projectMarkers.length > 0) {
    scope.push("project");
  }

  if (localProviders.length > 0) {
    scope.push("localProvider");
  }

  return scope;
}

function getCodexStatus(input: {
  readonly configPath: string | undefined;
  readonly projectMarkers: readonly string[] | undefined;
  readonly localProviders: readonly RuntimeType[];
}): RuntimeStatus {
  if (input.localProviders.length > 0) {
    return "localProviderReady";
  }

  if (input.projectMarkers && input.projectMarkers.length > 0) {
    return "projectActive";
  }

  if (input.configPath) {
    return "configured";
  }

  return "ready";
}

function collectWarnings(result: RunProbeResult): string[] {
  if (result.exitCode === 0 && !result.timedOut) {
    return [];
  }

  const warning =
    result.stderr || result.stdout || (result.timedOut ? "probe timed out" : "probe failed");
  return [redactSensitiveValues(warning)];
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/\b(api[_-]?key\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(token\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(password\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(secret\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]");
}
