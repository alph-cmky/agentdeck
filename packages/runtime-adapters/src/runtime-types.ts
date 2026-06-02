export const RUNTIME_TYPES = [
  "codex",
  "claude",
  "ollama",
  "lmstudio",
  "node",
  "git",
  "code",
] as const;

export type RuntimeType = (typeof RUNTIME_TYPES)[number];

export const RUNTIME_STATUS_RANK = {
  missing: 0,
  ready: 1,
  configured: 2,
  projectActive: 3,
  localProviderReady: 4,
} as const;

export type RuntimeStatus = keyof typeof RUNTIME_STATUS_RANK;

export type RuntimeScope = "global" | "project" | "localProvider";

export interface RuntimeCapabilities {
  readonly exec?: boolean;
  readonly mcp?: boolean;
  readonly chat?: boolean;
  readonly versionCommand?: boolean;
  readonly localProviders?: readonly RuntimeType[];
}

export interface RuntimeDetectionResult {
  readonly id: string;
  readonly name: string;
  readonly type: RuntimeType;
  readonly status: RuntimeStatus;
  readonly detected: boolean;
  readonly path?: string;
  readonly version?: string;
  readonly scope: readonly RuntimeScope[];
  readonly configPath?: string;
  readonly projectMarkers?: readonly string[];
  readonly capabilities: RuntimeCapabilities;
  readonly warnings: readonly string[];
  readonly lastDetectedAt: string;
}

export function isRuntimeAtLeastStatus(
  actualStatus: RuntimeStatus,
  minimumStatus: RuntimeStatus,
): boolean {
  return RUNTIME_STATUS_RANK[actualStatus] >= RUNTIME_STATUS_RANK[minimumStatus];
}

export function createMissingRuntimeResult(input: {
  readonly id: string;
  readonly name: string;
  readonly type: RuntimeType;
  readonly lastDetectedAt: string;
  readonly warnings?: readonly string[];
}): RuntimeDetectionResult {
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    status: "missing",
    detected: false,
    scope: [],
    capabilities: {},
    warnings: input.warnings ?? [],
    lastDetectedAt: input.lastDetectedAt,
  };
}
