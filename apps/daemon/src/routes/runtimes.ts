import type { RuntimeDetectionResult } from "@agentdeck/runtime-adapters";

export interface RuntimeDetectionRequest {
  readonly workspaceRoot?: string;
}

export interface RuntimesResponse {
  readonly runtimes: readonly RuntimeDetectionResult[];
}

export type RuntimeDetector = (
  request: RuntimeDetectionRequest,
) => Promise<readonly RuntimeDetectionResult[]>;

export async function getRuntimesResponse(input: {
  readonly workspaceRoot?: string;
  readonly detectRuntimes: RuntimeDetector;
}): Promise<RuntimesResponse> {
  const runtimes = await input.detectRuntimes(
    input.workspaceRoot ? { workspaceRoot: input.workspaceRoot } : {},
  );

  return {
    runtimes: runtimes.map(sanitizeRuntimeResult),
  };
}

function sanitizeRuntimeResult(result: RuntimeDetectionResult): RuntimeDetectionResult {
  return {
    ...result,
    warnings: result.warnings.map(redactSensitiveValues),
  };
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/\b(api[_-]?key\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(token\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(password\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(secret\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]");
}
