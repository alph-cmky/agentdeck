import {
  validateWorkflowDefinition,
  type AgentNode,
  type ToolNode,
  type WorkflowDefinition,
  type WorkflowNode,
  type WorkflowPermissions,
} from "./workflow-schema.js";

export type WorkflowValidationErrorCode =
  | "schema.missingStart"
  | "schema.missingEnd"
  | "schema.invalid"
  | "dag.cycle"
  | "io.incompatible"
  | "reference.agentMissing"
  | "reference.toolMissing"
  | "permission.exceedsWorkflow";

export interface WorkflowSafetyError {
  readonly code: WorkflowValidationErrorCode;
  readonly message: string;
}

export interface WorkflowSafetyResult {
  readonly success: boolean;
  readonly errors: readonly WorkflowSafetyError[];
}

export interface WorkflowIoContract {
  readonly accepts?: readonly string[];
  readonly produces?: readonly string[];
}

export type WorkflowPermissionRequest = Partial<WorkflowPermissions>;

export interface WorkflowSafetyValidatorOptions {
  readonly resolveAgent?: (agentId: string) => Promise<boolean> | boolean;
  readonly resolveTool?: (toolId: string) => Promise<boolean> | boolean;
  readonly toolPermissions?: Readonly<Record<string, WorkflowPermissionRequest>>;
  readonly toolIo?: Readonly<Record<string, WorkflowIoContract>>;
  readonly nodeIo?: Readonly<Record<string, WorkflowIoContract>>;
}

export async function validateWorkflowSafety(
  workflow: WorkflowDefinition,
  options: WorkflowSafetyValidatorOptions = {},
): Promise<WorkflowSafetyResult> {
  const schemaErrors = mapSchemaErrors(validateWorkflowDefinition(workflow).errors);
  if (schemaErrors.length > 0) {
    return {
      success: false,
      errors: schemaErrors,
    };
  }

  const errors: WorkflowSafetyError[] = [];
  errors.push(...(await validateReferences(workflow, options)));
  errors.push(...validatePermissions(workflow, options));
  errors.push(...validateIoCompatibility(workflow, options));
  errors.push(...validateAcyclic(workflow));

  return {
    success: errors.length === 0,
    errors,
  };
}

function mapSchemaErrors(errors: readonly string[]): WorkflowSafetyError[] {
  return errors.map((message) => {
    if (message === "workflow must contain exactly one start node.") {
      return {
        code: "schema.missingStart",
        message,
      };
    }

    if (message === "workflow must contain at least one end node.") {
      return {
        code: "schema.missingEnd",
        message,
      };
    }

    return {
      code: "schema.invalid",
      message,
    };
  });
}

async function validateReferences(
  workflow: WorkflowDefinition,
  options: WorkflowSafetyValidatorOptions,
): Promise<WorkflowSafetyError[]> {
  const errors: WorkflowSafetyError[] = [];

  for (const node of workflow.nodes) {
    if (isAgentNode(node) && options.resolveAgent && !(await options.resolveAgent(node.agentId))) {
      errors.push({
        code: "reference.agentMissing",
        message: `agent "${node.agentId}" referenced by node "${node.id}" does not exist.`,
      });
    }

    if (isToolNode(node) && options.resolveTool && !(await options.resolveTool(node.toolId))) {
      errors.push({
        code: "reference.toolMissing",
        message: `tool "${node.toolId}" referenced by node "${node.id}" does not exist.`,
      });
    }
  }

  return errors;
}

function validatePermissions(
  workflow: WorkflowDefinition,
  options: WorkflowSafetyValidatorOptions,
): WorkflowSafetyError[] {
  const errors: WorkflowSafetyError[] = [];

  for (const node of workflow.nodes) {
    if (!isToolNode(node)) {
      continue;
    }

    const requestedPermissions = options.toolPermissions?.[node.toolId] ?? {};
    for (const permission of Object.keys(requestedPermissions) as Array<
      keyof WorkflowPermissions
    >) {
      if (requestedPermissions[permission] && !workflow.permissions[permission]) {
        errors.push({
          code: "permission.exceedsWorkflow",
          message: `tool "${node.toolId}" requests ${permission} permission, but workflow does not allow it.`,
        });
      }
    }
  }

  return errors;
}

function validateIoCompatibility(
  workflow: WorkflowDefinition,
  options: WorkflowSafetyValidatorOptions,
): WorkflowSafetyError[] {
  const errors: WorkflowSafetyError[] = [];
  const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]));

  for (const edge of workflow.edges) {
    const fromNode = nodesById.get(edge.from);
    const toNode = nodesById.get(edge.to);
    if (!fromNode || !toNode) {
      continue;
    }

    const fromProduces = getNodeIoContract(fromNode, options).produces ?? [];
    const toAccepts = getNodeIoContract(toNode, options).accepts ?? [];
    if (fromProduces.length === 0 || toAccepts.length === 0) {
      continue;
    }

    const compatible = fromProduces.some((output) => toAccepts.includes(output));
    if (!compatible) {
      errors.push({
        code: "io.incompatible",
        message: `edge "${edge.id}" sends ${fromProduces.join(" or ")} to node "${toNode.id}", which expects ${toAccepts.join(" or ")}.`,
      });
    }
  }

  return errors;
}

function validateAcyclic(workflow: WorkflowDefinition): WorkflowSafetyError[] {
  const adjacency = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of workflow.edges) {
    adjacency.get(edge.from)?.push(edge.to);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  for (const node of workflow.nodes) {
    const cycleNode = findCycleNode(node.id, adjacency, visiting, visited);
    if (cycleNode) {
      return [
        {
          code: "dag.cycle",
          message: `workflow contains a cycle involving node "${cycleNode}".`,
        },
      ];
    }
  }

  return [];
}

function findCycleNode(
  nodeId: string,
  adjacency: ReadonlyMap<string, readonly string[]>,
  visiting: Set<string>,
  visited: Set<string>,
): string | undefined {
  if (visiting.has(nodeId)) {
    return nodeId;
  }

  if (visited.has(nodeId)) {
    return undefined;
  }

  visiting.add(nodeId);
  for (const nextNodeId of adjacency.get(nodeId) ?? []) {
    const cycleNode = findCycleNode(nextNodeId, adjacency, visiting, visited);
    if (cycleNode) {
      return cycleNode;
    }
  }
  visiting.delete(nodeId);
  visited.add(nodeId);

  return undefined;
}

function getNodeIoContract(
  node: WorkflowNode,
  options: WorkflowSafetyValidatorOptions,
): WorkflowIoContract {
  if (isToolNode(node)) {
    return options.toolIo?.[node.toolId] ?? options.nodeIo?.[node.id] ?? {};
  }

  return options.nodeIo?.[node.id] ?? {};
}

function isAgentNode(node: WorkflowNode): node is AgentNode {
  return node.type === "agent";
}

function isToolNode(node: WorkflowNode): node is ToolNode {
  return node.type === "tool";
}
