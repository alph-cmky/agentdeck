export const PERMISSION_NAMES = [
  "read",
  "write",
  "safeCommands",
  "arbitraryCommands",
  "network",
  "installDependencies",
  "gitCommit",
  "gitPush",
] as const;

export type PermissionName = (typeof PERMISSION_NAMES)[number];
export type PermissionDecision = "allow" | "deny";

export type PermissionGrants = Readonly<Record<PermissionName, boolean>>;

export interface PermissionEvaluationRequest {
  readonly permission: PermissionName;
}

export interface CommandPermissionEvaluationRequest {
  readonly command: string;
  readonly safe: boolean;
}

export interface PermissionEvaluationResult {
  readonly permission: PermissionName;
  readonly decision: PermissionDecision;
  readonly requiresApproval: boolean;
  readonly reason: string;
}

export interface PermissionPolicy {
  readonly grants: PermissionGrants;
  readonly evaluate: (request: PermissionEvaluationRequest) => PermissionEvaluationResult;
  readonly evaluateCommand: (
    request: CommandPermissionEvaluationRequest,
  ) => PermissionEvaluationResult;
}

export interface CreateDefaultPermissionPolicyOptions {
  readonly grants?: Partial<PermissionGrants>;
}

export const DEFAULT_AGENT_PERMISSION_GRANTS: PermissionGrants = {
  read: true,
  write: false,
  safeCommands: true,
  arbitraryCommands: false,
  network: false,
  installDependencies: false,
  gitCommit: false,
  gitPush: false,
};

const DANGEROUS_PERMISSIONS = new Set<PermissionName>([
  "write",
  "arbitraryCommands",
  "network",
  "installDependencies",
  "gitCommit",
  "gitPush",
]);

export function createDefaultPermissionPolicy(
  options: CreateDefaultPermissionPolicyOptions = {},
): PermissionPolicy {
  const grants = {
    ...DEFAULT_AGENT_PERMISSION_GRANTS,
    ...options.grants,
  };

  return {
    grants,
    evaluate(request) {
      return evaluatePermission(grants, request.permission);
    },
    evaluateCommand(request) {
      return evaluatePermission(grants, request.safe ? "safeCommands" : "arbitraryCommands");
    },
  };
}

function evaluatePermission(
  grants: PermissionGrants,
  permission: PermissionName,
): PermissionEvaluationResult {
  const granted = grants[permission];

  if (granted) {
    return {
      permission,
      decision: "allow",
      requiresApproval: false,
      reason: `Permission "${permission}" is granted by the active policy.`,
    };
  }

  return {
    permission,
    decision: "deny",
    requiresApproval: DANGEROUS_PERMISSIONS.has(permission),
    reason: `Permission "${permission}" is not granted by the active policy.`,
  };
}
