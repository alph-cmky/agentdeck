import type { WorkflowNodeType } from "@agentdeck/workflow-core";

export interface WorkflowPaletteItem {
  readonly type: WorkflowNodeType;
  readonly label: string;
  readonly description: string;
}

export const WORKFLOW_PALETTE_ITEMS: readonly WorkflowPaletteItem[] = [
  { type: "start", label: "Start", description: "Entry point for one workflow run." },
  { type: "agent", label: "Agent", description: "Delegate work to a configured coding agent." },
  { type: "tool", label: "Tool", description: "Call an approved local tool or MCP action." },
  { type: "condition", label: "Condition", description: "Branch the DAG with an expression." },
  {
    type: "humanApproval",
    label: "Human Approval",
    description: "Pause until a reviewer approves the next step.",
  },
  { type: "end", label: "End", description: "Finish the workflow run." },
] as const;

export function renderNodePaletteHtml(): string {
  return `<aside class="workflow-palette" aria-label="Node palette">
  <h2>Nodes</h2>
  <div class="workflow-palette-list">
    ${WORKFLOW_PALETTE_ITEMS.map(
      (item) => `<button type="button" data-node-type="${item.type}">
      <span>${escapeHtml(item.label)}</span>
      <small>${escapeHtml(item.description)}</small>
    </button>`,
    ).join("")}
  </div>
</aside>`;
}

export function labelForWorkflowNodeType(type: WorkflowNodeType): string {
  return WORKFLOW_PALETTE_ITEMS.find((item) => item.type === type)?.label ?? type;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
