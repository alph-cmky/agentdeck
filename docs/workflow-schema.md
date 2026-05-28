# Workflow Schema

AgentDeck workflows are low-code DAGs that connect agents, tools, conditions, human approvals, and final outputs.

## MVP Node Types

```text
Start
  Workflow entry. Receives user input and context variables.

Agent
  Calls an AgentDefinition.

Tool
  Calls an MCP tool or built-in platform tool.

Condition
  Branches based on structured fields or expressions.

Human Approval
  Pauses execution until the user approves or rejects.

End
  Produces final output.
```

## Workflow Definition

```text
WorkflowDefinition
  id
  version
  nodes
  edges
  variables
  permissions
  status
  createdAt
  updatedAt
```

## Validation Requirements

The workflow validator must reject:

- Missing start node.
- Missing end node.
- Multiple start nodes when the schema requires exactly one.
- Cycles.
- Edges pointing to missing nodes.
- Node input/output mismatches.
- References to missing agents or tools.
- Permission requests that exceed workflow or agent policy.

## Versioning

Workflow changes must produce new versions. Every applied patch should keep a rollback point and audit record.

## Patch Model

Coding agents must not directly mutate workflow state. They can only propose patches:

```text
PatchProposal
  id
  targetType
  targetId
  baseVersion
  jsonPatch
  validationResult
  approvalState
  diffPreview
```

The platform validates, previews, and applies only approved patches.
