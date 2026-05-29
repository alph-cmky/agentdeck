export function renderInspectorHtml(): string {
  return `<aside class="agentdeck-inspector" aria-label="Context inspector">
  <div class="agentdeck-panel-title">Inspector</div>
  <dl class="agentdeck-inspector-list">
    <div><dt>Selection</dt><dd>Workspace overview</dd></div>
    <div><dt>Status</dt><dd>Ready</dd></div>
    <div><dt>Scope</dt><dd>Local project</dd></div>
  </dl>
</aside>`;
}
