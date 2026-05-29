# AgentDeck Task Backlog

This file is the maintained development task list for AgentDeck. Keep task IDs stable once referenced by commits, issues, or PRs.

Status markers:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

## Phase 0: Repository Foundation

### AD-001: Create Monorepo Scaffold

**Goal:** Establish the repo layout and package boundaries described in the product design.

**Files:**

- Create `package.json`
- Create `pnpm-workspace.yaml`
- Create `tsconfig.base.json`
- Create `apps/web/package.json`
- Create `apps/server/package.json`
- Create `apps/daemon/package.json`
- Create `packages/workflow-core/package.json`
- Create `packages/runtime-adapters/package.json`
- Create `packages/mcp-server/package.json`

**Tasks:**

- [x] Add workspace scripts for `dev`, `build`, `test`, `lint`, `typecheck`, and `format`.
- [x] Add package names using the `@agentdeck/*` namespace.
- [x] Configure TypeScript strict mode in the shared base config.
- [x] Verify `pnpm install` succeeds from the repo root.
- [x] Commit with message `chore: scaffold monorepo`.

**Acceptance Criteria:**

- `pnpm -r typecheck` can run even if packages only contain placeholder exports.
- Each app/package has a clear responsibility and no cross-package circular dependency.

### AD-002: Add Code Quality Tooling

**Goal:** Provide consistent formatting, linting, and test commands before feature work starts.

**Files:**

- Create `.editorconfig`
- Create `.prettierrc`
- Create `eslint.config.js`
- Create `vitest.config.ts`
- Modify `package.json`

**Tasks:**

- [x] Configure Prettier for Markdown, TypeScript, JSON, and CSS.
- [x] Configure ESLint for TypeScript and React.
- [x] Configure Vitest for package-level unit tests.
- [x] Add root scripts for `lint`, `format`, `test`, and `typecheck`.
- [x] Verify all scripts run successfully on the scaffold.
- [x] Commit with message `chore: add code quality tooling`.

**Acceptance Criteria:**

- A new contributor can run one command per quality gate from the repo root.
- Formatting changes are deterministic.

### AD-003: Add Project Documentation Skeleton

**Goal:** Create the docs structure planned for the open-source project.

**Files:**

- Create `README.md`
- Create `docs/architecture.md`
- Create `docs/runtime-adapters.md`
- Create `docs/workflow-schema.md`
- Create `docs/security-model.md`
- Create `docs/contributing.md`

**Tasks:**

- [x] Summarize product positioning in `README.md`.
- [x] Link `AGENTDECK_PRODUCT_DESIGN.md` from `README.md`.
- [x] Document the monorepo package responsibilities in `docs/architecture.md`.
- [x] Capture initial security rules in `docs/security-model.md`.
- [x] Commit with message `docs: add project documentation skeleton`.

**Acceptance Criteria:**

- A reader can understand MVP scope, local-first assumptions, and where each subsystem lives.

## Phase 1: Runtime Detector

### AD-101: Define Runtime Detection Types

**Goal:** Establish shared runtime metadata contracts.

**Files:**

- Create `packages/runtime-adapters/src/runtime-types.ts`
- Create `packages/runtime-adapters/src/index.ts`
- Create `packages/runtime-adapters/src/runtime-types.test.ts`

**Tasks:**

- [x] Define `RuntimeType` for `codex`, `claude`, `ollama`, `lmstudio`, `node`, `git`, and `code`.
- [x] Define `RuntimeStatus` for `missing`, `ready`, `configured`, `projectActive`, and `localProviderReady`.
- [x] Define `RuntimeDetectionResult` with `id`, `name`, `type`, `detected`, `path`, `version`, `scope`, `capabilities`, `warnings`, and `lastDetectedAt`.
- [x] Add tests for status ordering and required runtime fields.
- [x] Commit with message `feat: define runtime detection types`.

**Acceptance Criteria:**

- Types can represent Codex, Claude, local model providers, Node, Git, and VS Code without provider-specific branching in consumers.

### AD-102: Implement Shell Command Probe Helper

**Goal:** Safely execute read-only detection commands through a login shell.

**Files:**

- Create `packages/runtime-adapters/src/probe/run-probe.ts`
- Create `packages/runtime-adapters/src/probe/run-probe.test.ts`

**Tasks:**

- [x] Implement a helper that runs `/bin/zsh -lc '<command>'` on macOS and a regular shell command elsewhere.
- [x] Capture `stdout`, `stderr`, `exitCode`, and elapsed time.
- [x] Add a timeout option with a short default.
- [x] Prevent probe helpers from accepting write-oriented commands in tests by documenting allowed usage.
- [x] Commit with message `feat: add runtime probe command helper`.

**Acceptance Criteria:**

- Tests prove successful command output, missing binary behavior, timeout behavior, and stderr capture.

### AD-103: Implement Codex Runtime Detector

**Goal:** Detect Codex CLI using binary, version, config, project marker, and capability probes.

**Files:**

- Create `packages/runtime-adapters/src/detectors/codex.ts`
- Create `packages/runtime-adapters/src/detectors/codex.test.ts`
- Modify `packages/runtime-adapters/src/index.ts`

**Tasks:**

- [x] Probe `command -v codex`.
- [x] Probe `codex --version`.
- [x] Detect `~/.codex/config.toml` existence without reading auth secrets.
- [x] Detect project markers `.codex/` and `AGENTS.md` under the selected workspace root.
- [x] Probe help text for `exec`, `mcp`, and local provider support.
- [x] Redact paths or warnings that include token-like values.
- [x] Commit with message `feat: detect codex runtime`.

**Acceptance Criteria:**

- Detector can return `ready`, `configured`, `projectActive`, or `localProviderReady`.
- Detector never reads or returns `~/.codex/auth.json` contents.

### AD-104: Implement Basic Runtime Detectors

**Goal:** Detect Claude, Node, Git, VS Code, Ollama, and LM Studio.

**Files:**

- Create `packages/runtime-adapters/src/detectors/claude.ts`
- Create `packages/runtime-adapters/src/detectors/node.ts`
- Create `packages/runtime-adapters/src/detectors/git.ts`
- Create `packages/runtime-adapters/src/detectors/code.ts`
- Create `packages/runtime-adapters/src/detectors/ollama.ts`
- Create `packages/runtime-adapters/src/detectors/lmstudio.ts`
- Create matching test files

**Tasks:**

- [x] Use read-only version/path probes for each CLI-based runtime.
- [x] Use local HTTP health checks only for Ollama and LM Studio when configured.
- [x] Normalize missing runtime warnings for UI display.
- [x] Commit with message `feat: add core runtime detectors`.

**Acceptance Criteria:**

- Runtime Dashboard can display all MVP runtime rows from one normalized result list.

## Phase 2: Local Daemon

### AD-201: Create Daemon HTTP API

**Goal:** Expose local runtime detection through a local-only daemon API.

**Files:**

- Create `apps/daemon/src/server.ts`
- Create `apps/daemon/src/routes/runtimes.ts`
- Create `apps/daemon/src/index.ts`
- Create `apps/daemon/src/server.test.ts`

**Tasks:**

- [x] Start a local server bound to `127.0.0.1`.
- [x] Add `GET /health`.
- [x] Add `GET /runtimes?workspaceRoot=<path>`.
- [x] Return normalized runtime detection results.
- [x] Reject non-localhost origins for browser requests.
- [x] Commit with message `feat: expose runtime detection daemon api`.

**Acceptance Criteria:**

- `GET /health` returns a stable health payload.
- `GET /runtimes` does not expose secrets.

### AD-202: Add Daemon Event Stream

**Goal:** Stream runtime and task events to the web/server layer.

**Files:**

- Create `apps/daemon/src/events/event-bus.ts`
- Create `apps/daemon/src/routes/events.ts`
- Create `apps/daemon/src/events/event-types.ts`
- Create tests for event subscription and unsubscribe behavior

**Tasks:**

- [x] Define event types for `runtime.detected`, `task.started`, `task.output`, `task.diff`, `task.approvalRequested`, `task.completed`, and `task.failed`.
- [x] Add SSE endpoint `GET /events`.
- [x] Broadcast runtime detection lifecycle events.
- [x] Commit with message `feat: add daemon event stream`.

**Acceptance Criteria:**

- Multiple subscribers can receive events.
- Disconnected clients are cleaned up.

## Phase 3: Agent Registry

### AD-301: Define Agent Schema

**Goal:** Establish the MVP AgentDefinition model and validation.

**Files:**

- Create `apps/server/src/agents/agent-schema.ts`
- Create `apps/server/src/agents/agent-schema.test.ts`

**Tasks:**

- [x] Define schema fields for `id`, `name`, `description`, `prompt`, `model`, `tools`, `permissions`, `memoryScope`, `runtimePreference`, and `workspaceRoot`.
- [x] Require new agents to default to read-only permissions.
- [x] Validate workspace root is explicit.
- [x] Commit with message `feat: define agent schema`.

**Acceptance Criteria:**

- Invalid permissions and missing prompts fail validation.
- New agent defaults do not permit writes, installs, arbitrary commands, commits, or pushes.

### AD-302: Implement Agent Registry Persistence

**Goal:** Persist agent definitions locally for MVP.

**Files:**

- Create `apps/server/src/agents/agent-repository.ts`
- Create `apps/server/src/agents/agent-service.ts`
- Create `apps/server/src/agents/agent-service.test.ts`

**Tasks:**

- [x] Implement create, list, get, update, and delete operations.
- [x] Enforce schema validation before persistence.
- [x] Preserve created/updated timestamps.
- [x] Commit with message `feat: add agent registry service`.

**Acceptance Criteria:**

- Agent definitions survive server restart using the selected local persistence layer.

## Phase 4: Chat Workspace

### AD-401: Define Conversation and Task Models

**Goal:** Model channels, threads, messages, mentions, and task references.

**Files:**

- Create `apps/server/src/chat/chat-schema.ts`
- Create `apps/server/src/tasks/task-schema.ts`
- Create matching tests

**Tasks:**

- [x] Define `Conversation`, `Channel`, `Thread`, `Message`, and `TaskRef`.
- [x] Parse `@agent` mentions into structured references.
- [x] Validate that mentioned agents exist before task creation.
- [x] Commit with message `feat: define chat and task schemas`.

**Acceptance Criteria:**

- A chat message with `@reviewer` can become a pending task linked to an agent.

### AD-402: Implement Chat API

**Goal:** Provide server routes for channels, messages, and agent mentions.

**Files:**

- Create `apps/server/src/chat/chat-routes.ts`
- Create `apps/server/src/chat/chat-service.ts`
- Create `apps/server/src/chat/chat-service.test.ts`

**Tasks:**

- [x] Add channel creation and listing.
- [x] Add message creation and listing.
- [x] Create task refs when messages contain valid `@agent` mentions.
- [x] Commit with message `feat: add chat workspace api`.

**Acceptance Criteria:**

- Posting a message can create a task without starting runtime execution yet.

## Phase 5: Runtime Adapters and Task Execution

### AD-501: Define Runtime Adapter Interface

**Goal:** Decouple task orchestration from specific CLIs.

**Files:**

- Create `packages/runtime-adapters/src/execution/runtime-adapter.ts`
- Create `packages/runtime-adapters/src/execution/task-events.ts`
- Create tests for adapter contracts

**Tasks:**

- [x] Define adapter capabilities for `executeTask`, `cancelTask`, and `getCapabilities`.
- [x] Define streamed task events for stdout, stderr, tool events, diff, completion, and failure.
- [x] Commit with message `feat: define runtime adapter interface`.

**Acceptance Criteria:**

- Codex, Claude, and shell execution can share one orchestration interface.

### AD-502: Implement Safe Shell Adapter

**Goal:** Provide a constrained adapter for safe command execution.

**Files:**

- Create `packages/runtime-adapters/src/execution/shell-adapter.ts`
- Create `packages/runtime-adapters/src/execution/shell-adapter.test.ts`

**Tasks:**

- [x] Allow only configured safe commands.
- [x] Stream stdout and stderr events.
- [x] Reject arbitrary commands unless permission policy allows them.
- [x] Commit with message `feat: add safe shell runtime adapter`.

**Acceptance Criteria:**

- Tests prove disallowed commands are rejected before execution.

## Phase 6: Workflow Core

### AD-601: Define Workflow DAG Schema

**Goal:** Implement the workflow model described in the product design.

**Files:**

- Create `packages/workflow-core/src/workflow-schema.ts`
- Create `packages/workflow-core/src/workflow-schema.test.ts`

**Tasks:**

- [x] Define node types: `start`, `agent`, `tool`, `condition`, `humanApproval`, and `end`.
- [x] Define edges, variables, permissions, status, version, and timestamps.
- [x] Validate exactly one start node and at least one end node.
- [x] Commit with message `feat: define workflow dag schema`.

**Acceptance Criteria:**

- Invalid node types, missing start node, and missing end node fail validation.

### AD-602: Implement Workflow Validator

**Goal:** Validate graph safety before execution or patch application.

**Files:**

- Create `packages/workflow-core/src/validator.ts`
- Create `packages/workflow-core/src/validator.test.ts`

**Tasks:**

- [x] Detect cycles.
- [x] Validate node input/output compatibility.
- [x] Validate referenced agents and tools exist through injected resolvers.
- [x] Validate requested permissions do not exceed workflow permissions.
- [x] Commit with message `feat: add workflow validator`.

**Acceptance Criteria:**

- Validator returns actionable errors for schema, DAG, IO, reference, and permission failures.

## Phase 7: Web UI

### AD-701: Scaffold Web App Shell

**Goal:** Create the three-panel developer workspace layout.

**Files:**

- Create `apps/web/src/app/page.tsx`
- Create `apps/web/src/components/app-shell.tsx`
- Create `apps/web/src/components/sidebar.tsx`
- Create `apps/web/src/components/inspector.tsx`
- Create `apps/web/src/styles/globals.css`

**Tasks:**

- [x] Implement top bar, left sidebar, main work area, and right inspector.
- [x] Add navigation entries for Chat, Agents, Workflows, Tasks, Runtimes, Audit, and Settings.
- [x] Use dense tool-style layout with stable panel widths.
- [x] Commit with message `feat: add web app shell`.

**Acceptance Criteria:**

- Desktop layout clearly shows navigation, primary work area, and contextual inspector.

### AD-702: Build Runtime Dashboard UI

**Goal:** Display runtime detection results from the daemon/server.

**Files:**

- Create `apps/web/src/features/runtimes/runtime-dashboard.tsx`
- Create `apps/web/src/features/runtimes/runtime-status-row.tsx`
- Create tests for status rendering

**Tasks:**

- [x] Render runtime name, status, path, version, capabilities, and warnings.
- [x] Show install/configuration guidance for missing runtimes.
- [x] Avoid rendering secret-like values.
- [x] Commit with message `feat: add runtime dashboard ui`.

**Acceptance Criteria:**

- Codex, Claude, Ollama, LM Studio, Node, Git, and VS Code can render in one table.

## Phase 8: Workflow Canvas and Patch Approval

### AD-801: Build Workflow Canvas MVP

**Goal:** Provide a visual DAG editor backed by `workflow-core`.

**Files:**

- Create `apps/web/src/features/workflows/workflow-canvas.tsx`
- Create `apps/web/src/features/workflows/node-inspector.tsx`
- Create `apps/web/src/features/workflows/node-palette.tsx`

**Tasks:**

- [x] Support Start, Agent, Tool, Condition, Human Approval, and End nodes.
- [x] Open selected node settings in the right inspector.
- [x] Run validation before saving.
- [x] Commit with message `feat: add workflow canvas mvp`.

**Acceptance Criteria:**

- A user can create a valid workflow and see validation errors for invalid DAGs.

### AD-802: Implement Patch Proposal Model

**Goal:** Represent proposed agent/workflow changes without directly applying them.

**Files:**

- Create `apps/server/src/patches/patch-schema.ts`
- Create `apps/server/src/patches/patch-service.ts`
- Create `apps/server/src/patches/patch-service.test.ts`

**Tasks:**

- [x] Define `PatchProposal` with target type, target ID, base version, JSON patch, validation result, approval state, and diff preview.
- [x] Validate workflow patches through `workflow-core`.
- [x] Require approval before apply.
- [x] Commit with message `feat: add patch proposal service`.

**Acceptance Criteria:**

- A valid patch can be proposed and previewed without changing the target workflow.

## Phase 9: Security and Audit

### AD-901: Implement Permission Policy

**Goal:** Centralize runtime and workflow permission decisions.

**Files:**

- Create `apps/server/src/security/permission-policy.ts`
- Create `apps/server/src/security/permission-policy.test.ts`

**Tasks:**

- [x] Implement permissions for read, write, safe commands, arbitrary commands, network, install dependencies, git commit, and git push.
- [x] Require approval for dangerous permissions by default.
- [x] Commit with message `feat: add permission policy`.

**Acceptance Criteria:**

- Default agent policy allows read-only behavior and rejects writes, installs, arbitrary commands, commits, and pushes.

### AD-902: Implement Audit Log

**Goal:** Record task execution, patch proposals, approvals, and sensitive actions.

**Files:**

- Create `apps/server/src/audit/audit-schema.ts`
- Create `apps/server/src/audit/audit-service.ts`
- Create `apps/server/src/audit/audit-service.test.ts`

**Tasks:**

- [x] Record who/what initiated each action.
- [x] Record task ID, runtime ID, command summary, diff summary, approval decision, and timestamps.
- [x] Redact secrets before persistence.
- [x] Commit with message `feat: add audit log service`.

**Acceptance Criteria:**

- Audits can answer who changed what, when, through which agent/runtime, and with which approval.

## Phase 10: Packaging and Examples

### AD-1001: Add Example Workspace

**Goal:** Provide a small demo showing the local-first workflow.

**Files:**

- Create `examples/basic-agent-workspace/README.md`
- Create `examples/basic-agent-workspace/agents/reviewer.json`
- Create `examples/basic-agent-workspace/workflows/review-flow.json`

**Tasks:**

- [x] Add one code reviewer agent.
- [x] Add one review workflow with Start, Agent, Human Approval, and End.
- [x] Document how to run the demo locally.
- [x] Commit with message `docs: add basic agent workspace example`.

**Acceptance Criteria:**

- A new user can inspect a realistic agent and workflow without creating one from scratch.

### AD-1002: Add Contributor Workflow

**Goal:** Make open-source contribution flow explicit.

**Files:**

- Modify `docs/contributing.md`
- Create `.github/pull_request_template.md`
- Create `.github/workflows/ci.yml`

**Tasks:**

- [x] Document branch naming, commit style, and local verification commands.
- [x] Add PR checklist for tests, docs, and security-sensitive behavior.
- [x] Add CI steps for install, lint, typecheck, and test.
- [x] Commit with message `chore: add contributor workflow`.

**Acceptance Criteria:**

- Pull requests have the same quality gates as local development.

## Phase 11: MVP Integration

### AD-1101: Implement Workflow Registry Persistence

**Goal:** Persist workflow definitions behind a server-side registry service.

**Files:**

- Create `apps/server/src/workflows/workflow-repository.ts`
- Create `apps/server/src/workflows/workflow-service.ts`
- Create `apps/server/src/workflows/workflow-service.test.ts`
- Modify `apps/server/src/index.ts`

**Tasks:**

- [x] Save, list, get, update, and delete workflow definitions.
- [x] Validate workflow definitions through `workflow-core` before persistence.
- [x] Preserve `createdAt` and update `updatedAt` on edits.
- [x] Commit with message `feat: add workflow registry persistence`.

**Acceptance Criteria:**

- A valid workflow can be persisted, updated, loaded by ID, listed, and deleted without bypassing `workflow-core` validation.

### AD-1102: Add Workflow HTTP Routes

**Goal:** Expose workflow registry operations through the server control plane.

**Files:**

- Create `apps/server/src/workflows/workflow-routes.ts`
- Create `apps/server/src/workflows/workflow-routes.test.ts`
- Modify `apps/server/src/index.ts`

**Tasks:**

- [x] Add routes to create, list, get, update, and delete workflows.
- [x] Return validation errors without persisting invalid workflows.
- [x] Keep route handlers thin and delegate to `workflow-service`.
- [x] Commit with message `feat: add workflow routes`.

**Acceptance Criteria:**

- The web app or MCP layer can manage workflows through server APIs instead of local mocks.

### AD-1103: Add Patch Application Integration

**Goal:** Connect approved patch proposals to workflow persistence.

**Files:**

- Modify `apps/server/src/patches/patch-service.ts`
- Modify `apps/server/src/patches/patch-service.test.ts`
- Modify `apps/server/src/workflows/workflow-service.ts`

**Tasks:**

- [x] Apply approved workflow patch proposals through the workflow registry.
- [x] Reject stale base versions before apply.
- [x] Audit approved and rejected apply attempts.
- [x] Commit with message `feat: integrate patch apply workflow persistence`.

**Acceptance Criteria:**

- Approved workflow patches update the persisted workflow and stale patches are rejected.

### AD-1104: Add Real Web Dev Runtime

**Goal:** Replace the placeholder web package with a runnable local app.

**Files:**

- Modify `apps/web/package.json`
- Create or modify Next.js app config files under `apps/web`
- Modify existing `apps/web/src/app/page.tsx`

**Tasks:**

- [ ] Add a real `pnpm --filter @agentdeck/web dev` server.
- [ ] Render the app shell, runtime dashboard, and workflow canvas in the browser.
- [ ] Add browser smoke verification for the first viewport.
- [ ] Commit with message `feat: add runnable web app`.

**Acceptance Criteria:**

- A contributor can run the web app locally and inspect the MVP UI in a browser.
