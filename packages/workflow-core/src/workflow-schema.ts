export const WORKFLOW_NODE_TYPES = [
  "start",
  "agent",
  "tool",
  "condition",
  "humanApproval",
  "end",
] as const;

export const WORKFLOW_STATUSES = ["draft", "active", "paused", "archived"] as const;

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export interface WorkflowPermissions {
  readonly read: boolean;
  readonly write: boolean;
  readonly install: boolean;
  readonly arbitraryCommands: boolean;
  readonly commit: boolean;
  readonly push: boolean;
}

export interface WorkflowNodeBase<TType extends WorkflowNodeType = WorkflowNodeType> {
  readonly id: string;
  readonly type: TType;
  readonly label: string;
}

export type StartNode = WorkflowNodeBase<"start">;
export type EndNode = WorkflowNodeBase<"end">;

export interface AgentNode extends WorkflowNodeBase<"agent"> {
  readonly agentId: string;
}

export interface ToolNode extends WorkflowNodeBase<"tool"> {
  readonly toolId: string;
}

export interface ConditionNode extends WorkflowNodeBase<"condition"> {
  readonly expression: string;
}

export interface HumanApprovalNode extends WorkflowNodeBase<"humanApproval"> {
  readonly approverRole: string;
}

export type WorkflowNode =
  | StartNode
  | AgentNode
  | ToolNode
  | ConditionNode
  | HumanApprovalNode
  | EndNode;

export interface WorkflowEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly condition?: string;
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly status: WorkflowStatus;
  readonly variables: Readonly<Record<string, string>>;
  readonly permissions: WorkflowPermissions;
  readonly nodes: readonly WorkflowNode[];
  readonly edges: readonly WorkflowEdge[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type WorkflowSchemaResult<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly errors: readonly string[];
    };

export interface WorkflowValidationResult {
  readonly success: boolean;
  readonly errors: readonly string[];
}

export function createWorkflowDefinition(
  input: WorkflowDefinition,
): WorkflowSchemaResult<WorkflowDefinition> {
  const workflow: WorkflowDefinition = {
    id: input.id.trim(),
    name: input.name.trim(),
    version: input.version,
    status: input.status,
    variables: { ...input.variables },
    permissions: { ...input.permissions },
    nodes: input.nodes.map(normalizeNode),
    edges: input.edges.map(normalizeEdge),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
  const validation = validateWorkflowDefinition(workflow);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  return {
    success: true,
    value: workflow,
  };
}

export function validateWorkflowDefinition(workflow: WorkflowDefinition): WorkflowValidationResult {
  const errors: string[] = [];

  if (!workflow.id.trim()) {
    errors.push("id is required.");
  }

  if (!workflow.name.trim()) {
    errors.push("name is required.");
  }

  if (!Number.isInteger(workflow.version) || workflow.version < 1) {
    errors.push("version must be a positive integer.");
  }

  if (!isWorkflowStatus(workflow.status)) {
    errors.push(`workflow status "${workflow.status}" is invalid.`);
  }

  for (const node of workflow.nodes) {
    if (!isWorkflowNodeType(node.type)) {
      errors.push(`node "${node.id}" has invalid type "${node.type}".`);
    }
  }

  const startNodeCount = workflow.nodes.filter((node) => node.type === "start").length;
  const endNodeCount = workflow.nodes.filter((node) => node.type === "end").length;

  if (startNodeCount !== 1) {
    errors.push("workflow must contain exactly one start node.");
  }

  if (endNodeCount < 1) {
    errors.push("workflow must contain at least one end node.");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

function normalizeNode(node: WorkflowNode): WorkflowNode {
  return {
    ...node,
    id: node.id.trim(),
    label: node.label.trim(),
  };
}

function normalizeEdge(edge: WorkflowEdge): WorkflowEdge {
  return {
    id: edge.id.trim(),
    from: edge.from.trim(),
    to: edge.to.trim(),
    ...(edge.condition ? { condition: edge.condition.trim() } : {}),
  };
}

function isWorkflowNodeType(value: string): value is WorkflowNodeType {
  return WORKFLOW_NODE_TYPES.includes(value as WorkflowNodeType);
}

function isWorkflowStatus(value: string): value is WorkflowStatus {
  return WORKFLOW_STATUSES.includes(value as WorkflowStatus);
}
