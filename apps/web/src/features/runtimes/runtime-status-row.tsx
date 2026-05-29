export interface RuntimeDashboardCapabilities {
  readonly exec?: boolean;
  readonly mcp?: boolean;
  readonly chat?: boolean;
  readonly versionCommand?: boolean;
  readonly localProviders?: readonly string[];
}

export interface RuntimeDashboardResult {
  readonly id: string;
  readonly name: string;
  readonly type: "codex" | "claude" | "ollama" | "lmstudio" | "node" | "git" | "code";
  readonly status: "missing" | "ready" | "configured" | "projectActive" | "localProviderReady";
  readonly detected: boolean;
  readonly path?: string;
  readonly version?: string;
  readonly scope: readonly string[];
  readonly capabilities: RuntimeDashboardCapabilities;
  readonly warnings: readonly string[];
  readonly lastDetectedAt: string;
}

export function renderRuntimeStatusRowHtml(runtime: RuntimeDashboardResult): string {
  const capabilities = formatCapabilities(runtime.capabilities);
  const warnings = runtime.warnings.map(redactSensitiveValues);
  const guidance = renderMissingGuidance(runtime);
  const warningContent = [...warnings, guidance].filter(Boolean);

  return `<tr class="runtime-row runtime-${runtime.status}">
  <th scope="row">${escapeHtml(runtime.name)}</th>
  <td><span class="runtime-status">${runtime.status}</span></td>
  <td>${escapeHtml(runtime.path ?? "Not detected")}</td>
  <td>${escapeHtml(runtime.version ?? "Unknown")}</td>
  <td>${escapeHtml(capabilities || "None")}</td>
  <td>${warningContent.map(escapeHtml).join("<br>")}</td>
</tr>`;
}

function formatCapabilities(capabilities: RuntimeDashboardCapabilities): string {
  return [
    capabilities.exec ? "exec" : undefined,
    capabilities.mcp ? "mcp" : undefined,
    capabilities.chat ? "chat" : undefined,
    capabilities.versionCommand ? "version" : undefined,
    ...(capabilities.localProviders ?? []),
  ]
    .filter(Boolean)
    .join(", ");
}

function renderMissingGuidance(runtime: RuntimeDashboardResult): string {
  if (runtime.status !== "missing") {
    return "";
  }

  return `Install or configure ${runtime.name}`;
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/\b(api[_-]?key\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(token\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(password\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(secret\s*[=:]\s*)([^\s]+)/gi, "$1[REDACTED]");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
