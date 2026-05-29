export const workflowCorePackageName = "@agentdeck/workflow-core";

export {
  WORKFLOW_NODE_TYPES,
  WORKFLOW_STATUSES,
  createWorkflowDefinition,
  validateWorkflowDefinition,
} from "./workflow-schema.js";
export type {
  AgentNode,
  ConditionNode,
  EndNode,
  HumanApprovalNode,
  StartNode,
  ToolNode,
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeBase,
  WorkflowNodeType,
  WorkflowPermissions,
  WorkflowSchemaResult,
  WorkflowStatus,
  WorkflowValidationResult,
} from "./workflow-schema.js";

export { validateWorkflowSafety } from "./validator.js";
export type {
  WorkflowIoContract,
  WorkflowPermissionRequest,
  WorkflowSafetyError,
  WorkflowSafetyResult,
  WorkflowSafetyValidatorOptions,
  WorkflowValidationErrorCode,
} from "./validator.js";
