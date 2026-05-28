# AgentDeck Architecture

AgentDeck is planned as a local-first monorepo with clear package boundaries between UI, control-plane services, local runtime execution, workflow domain logic, runtime adapters, and MCP-facing tools.

## Monorepo Layout

```text
apps/web
  Next.js / React / React Flow UI

apps/server
  Control plane for agents, workflows, chat, tasks, permissions, audit, and patch proposals

apps/daemon
  Local runtime detection, process execution, workspace adapter, and event stream

packages/workflow-core
  DAG schema, validator, executor, versioning, and patch engine

packages/runtime-adapters
  Runtime detection and execution adapters for Codex, Claude, shell, Ollama, LM Studio, Node, Git, and related tools

packages/mcp-server
  Controlled MCP tools for reading definitions, proposing patches, validating patches, previewing diffs, and applying approved changes
```

## Primary Data Flow

```text
User
  -> Web Chat Workspace
  -> Server Orchestrator
  -> Agent / Workflow / Permission Services
  -> Local Daemon
  -> Runtime Adapter
  -> Codex / Claude / shell / local model provider
  -> Event Stream
  -> Web Task Inspector
```

## Design Boundaries

- UI components should not contain workflow validation, runtime detection, permission policy, or patch application logic.
- Server routes should delegate domain behavior to focused services.
- The daemon should expose only local runtime and process capabilities needed by the control plane.
- Workflow schema and validation must live in `packages/workflow-core`.
- Runtime-specific behavior must live in `packages/runtime-adapters`.
- Coding agents must use controlled tools and patch proposals instead of direct database or workflow mutation.

## MVP Persistence

The MVP can use SQLite or local file-backed persistence. The persistence layer should be hidden behind repositories/services so later storage changes do not affect UI or domain packages.

## Eventing

The daemon and server should stream task lifecycle events:

- `runtime.detected`
- `task.started`
- `task.output`
- `task.diff`
- `task.approvalRequested`
- `task.completed`
- `task.failed`

These events power the Chat Workspace and Task Inspector.
