import { runProbe, type RunProbeResult } from "../probe/run-probe.js";
import {
  createMissingRuntimeResult,
  type RuntimeCapabilities,
  type RuntimeDetectionResult,
  type RuntimeScope,
  type RuntimeStatus,
  type RuntimeType,
} from "../runtime-types.js";

export interface DetectCliRuntimeOptions {
  readonly lastDetectedAt?: string;
  readonly runProbe?: (command: string) => Promise<RunProbeResult>;
}

export interface DetectLocalProviderRuntimeOptions extends DetectCliRuntimeOptions {
  readonly healthUrl?: string;
  readonly fetchHealth?: (
    url: string,
  ) => Promise<{ readonly ok: boolean; readonly status: number }>;
}

export interface CliRuntimeDefinition {
  readonly id: RuntimeType;
  readonly name: string;
  readonly binary: string;
  readonly versionCommand: string;
  readonly capabilities: RuntimeCapabilities;
}

export interface LocalProviderRuntimeDefinition extends CliRuntimeDefinition {
  readonly defaultHealthUrl?: string;
}

export async function detectCliRuntime(
  definition: CliRuntimeDefinition,
  options: DetectCliRuntimeOptions = {},
): Promise<RuntimeDetectionResult> {
  const probe = options.runProbe ?? runProbe;
  const lastDetectedAt = options.lastDetectedAt ?? new Date().toISOString();
  const pathProbe = await probe(`command -v ${definition.binary}`);

  if (pathProbe.exitCode !== 0 || pathProbe.stdout.trim().length === 0) {
    return createMissingRuntimeResult({
      id: definition.id,
      name: definition.name,
      type: definition.id,
      lastDetectedAt,
      warnings: [`${definition.name} was not found on PATH.`],
    });
  }

  const versionProbe = await probe(definition.versionCommand);
  const version = versionProbe.exitCode === 0 ? firstOutputLine(versionProbe.stdout) : undefined;
  const warnings = collectProbeWarnings(versionProbe);
  const capabilities = {
    ...definition.capabilities,
    versionCommand: Boolean(version),
  };

  return {
    id: definition.id,
    name: definition.name,
    type: definition.id,
    status: "ready",
    detected: true,
    path: pathProbe.stdout.trim(),
    scope: ["global"],
    capabilities,
    warnings,
    lastDetectedAt,
    ...(version ? { version } : {}),
  };
}

export async function detectLocalProviderRuntime(
  definition: LocalProviderRuntimeDefinition,
  options: DetectLocalProviderRuntimeOptions = {},
): Promise<RuntimeDetectionResult> {
  const cliResult = await detectCliRuntime(definition, options);

  if (!cliResult.detected) {
    return cliResult;
  }

  const healthUrl = options.healthUrl ?? definition.defaultHealthUrl;
  if (!healthUrl) {
    return cliResult;
  }

  const fetchHealth = options.fetchHealth ?? defaultFetchHealth;
  const healthResult = await fetchHealth(healthUrl);

  if (!healthResult.ok) {
    return {
      ...cliResult,
      warnings: [
        ...cliResult.warnings,
        `${definition.name} health check failed with HTTP ${healthResult.status}.`,
      ],
    };
  }

  return {
    ...cliResult,
    status: "localProviderReady" satisfies RuntimeStatus,
    scope: ["global", "localProvider"] satisfies RuntimeScope[],
  };
}

function firstOutputLine(output: string): string | undefined {
  const firstLine = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine;
}

function collectProbeWarnings(result: RunProbeResult): string[] {
  if (result.exitCode === 0 && !result.timedOut) {
    return [];
  }

  if (result.timedOut) {
    return ["Version probe timed out."];
  }

  const warning = result.stderr.trim() || result.stdout.trim();
  return warning ? [warning] : ["Version probe failed."];
}

async function defaultFetchHealth(
  url: string,
): Promise<{ readonly ok: boolean; readonly status: number }> {
  const response = await fetch(url);
  return { ok: response.ok, status: response.status };
}
