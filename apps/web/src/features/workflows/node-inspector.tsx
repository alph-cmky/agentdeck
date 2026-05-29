import type { WorkflowNode } from "@agentdeck/workflow-core";

import { labelForWorkflowNodeType } from "./node-palette.js";

export function renderNodeInspectorHtml(node: WorkflowNode | undefined): string {
  if (!node) {
    return `<aside class="workflow-node-inspector" aria-label="Node inspector">
  <h2>Node Settings</h2>
  <p>Select a node to edit its settings.</p>
</aside>`;
  }

  return `<aside class="workflow-node-inspector" aria-label="Node inspector">
  <h2>Node Settings</h2>
  <dl>
    <div><dt>Label</dt><dd>${escapeHtml(node.label)}</dd></div>
    <div><dt>Type</dt><dd>${escapeHtml(labelForWorkflowNodeType(node.type))}</dd></div>
    ${renderNodeSpecificSettings(node)}
  </dl>
</aside>`;
}

function renderNodeSpecificSettings(node: WorkflowNode): string {
  switch (node.type) {
    case "agent":
      return `<div><dt>Agent ID</dt><dd>${escapeHtml(node.agentId)}</dd></div>`;
    case "tool":
      return `<div><dt>Tool ID</dt><dd>${escapeHtml(node.toolId)}</dd></div>`;
    case "condition":
      return `<div><dt>Expression</dt><dd>${escapeHtml(node.expression)}</dd></div>`;
    case "humanApproval":
      return `<div><dt>Approver role</dt><dd>${escapeHtml(node.approverRole)}</dd></div>`;
    case "start":
    case "end":
      return `<div><dt>Settings</dt><dd>No additional settings</dd></div>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
