import {
  validateWorkflowSafety,
  type WorkflowDefinition,
  type WorkflowNode,
} from "@agentdeck/workflow-core";

import { renderNodeInspectorHtml } from "./node-inspector.js";
import { labelForWorkflowNodeType, renderNodePaletteHtml } from "./node-palette.js";

export interface WorkflowCanvasState {
  readonly workflow: WorkflowDefinition;
  readonly selectedNodeId?: string;
}

export async function renderWorkflowCanvasHtml(state: WorkflowCanvasState): Promise<string> {
  const selectedNode = state.workflow.nodes.find((node) => node.id === state.selectedNodeId);
  const validation = await validateWorkflowSafety(state.workflow);
  const canSave = validation.success;

  return `<section class="workflow-canvas-shell" aria-label="Workflow canvas">
  ${renderNodePaletteHtml()}
  <main class="workflow-canvas-main">
    <header class="workflow-canvas-header">
      <div>
        <h1>${escapeHtml(state.workflow.name)}</h1>
        <p>${state.workflow.nodes.length} nodes, ${state.workflow.edges.length} edges</p>
      </div>
      <button type="button"${canSave ? "" : " disabled"}>${canSave ? "Ready to save" : "Save disabled"}</button>
    </header>
    <div class="workflow-canvas-board" role="list" aria-label="Workflow DAG nodes">
      ${state.workflow.nodes.map((node) => renderCanvasNodeHtml(node, node.id === state.selectedNodeId)).join("")}
    </div>
    <div class="workflow-edge-list" aria-label="Workflow DAG edges">
      ${state.workflow.edges
        .map(
          (edge) => `<div class="workflow-edge" data-edge-id="${escapeHtml(edge.id)}">
        <span>${escapeHtml(edge.id)}</span>
        <code>${escapeHtml(edge.from)} -> ${escapeHtml(edge.to)}</code>
        ${edge.condition ? `<small>${escapeHtml(edge.condition)}</small>` : ""}
      </div>`,
        )
        .join("")}
    </div>
    ${renderValidationHtml(validation.errors)}
  </main>
  ${renderNodeInspectorHtml(selectedNode)}
</section>`;
}

function renderCanvasNodeHtml(node: WorkflowNode, selected: boolean): string {
  return `<article class="workflow-node${selected ? " workflow-node-selected" : ""}" data-node-id="${escapeHtml(node.id)}" role="listitem">
  <strong>${escapeHtml(node.label)}</strong>
  <span>${escapeHtml(labelForWorkflowNodeType(node.type))}</span>
</article>`;
}

function renderValidationHtml(errors: readonly { readonly message: string }[]): string {
  if (errors.length === 0) {
    return `<section class="workflow-validation" aria-label="Workflow validation"><p>Ready to save</p></section>`;
  }

  return `<section class="workflow-validation" aria-label="Workflow validation">
  <h2>Validation errors</h2>
  <ul>
    ${errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join("")}
  </ul>
</section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
