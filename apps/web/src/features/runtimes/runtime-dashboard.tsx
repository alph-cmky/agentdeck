import { renderRuntimeStatusRowHtml, type RuntimeDashboardResult } from "./runtime-status-row.js";

export type { RuntimeDashboardResult } from "./runtime-status-row.js";

export function renderRuntimeDashboardHtml(runtimes: readonly RuntimeDashboardResult[]): string {
  return `<section class="runtime-dashboard" aria-label="Runtime dashboard">
  <header class="runtime-dashboard-header">
    <div>
      <h2>Runtimes</h2>
      <p>Local runtime detection across CLIs and local model providers.</p>
    </div>
  </header>
  <table class="runtime-table">
    <thead>
      <tr>
        <th scope="col">Runtime</th>
        <th scope="col">Status</th>
        <th scope="col">Path</th>
        <th scope="col">Version</th>
        <th scope="col">Capabilities</th>
        <th scope="col">Warnings</th>
      </tr>
    </thead>
    <tbody>
      ${runtimes.map(renderRuntimeStatusRowHtml).join("")}
    </tbody>
  </table>
</section>`;
}
