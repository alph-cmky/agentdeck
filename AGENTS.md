# AgentDeck Agent Instructions

This file defines project constraints for AI coding agents working in this repository.

## Project Context

AgentDeck is a local-first multi-agent workspace for developers and AI builders. The product combines:

- Chat-based multi-agent collaboration.
- Local runtime detection for Codex, Claude, Ollama, LM Studio, Node, Git, and related tools.
- Low-code Agent and Workflow DAG orchestration.
- Safe chat-to-workflow editing through patch proposals, validation, diff preview, approval, and rollback.

Primary references:

- `AGENTDECK_PRODUCT_DESIGN.md`
- `agentdeck-project-brief.md`
- `docs/development/README.md`
- `docs/development/task-backlog.md`

## Operating Rules

- Treat `docs/development/task-backlog.md` as the source of truth for planned implementation tasks.
- Keep task IDs stable once they appear in commits, issues, or PRs.
- Update the relevant task checkbox when completing a planned task.
- Keep changes small and scoped to the current task.
- Prefer project patterns and existing package boundaries over inventing new structure.
- Do not introduce large unrelated refactors while implementing a focused task.
- Keep documentation updated when behavior, architecture, permissions, or workflows change.

## Architecture Constraints

The planned repo shape is:

```text
apps/web
  Next.js / React / React Flow UI

apps/server
  Node.js control plane for agents, workflows, chat, audit, and permissions

apps/daemon
  Local runtime detection, process execution, workspace adapter, and event stream

packages/workflow-core
  DAG schema, validator, executor, versioning, and patch engine

packages/runtime-adapters
  Codex, Claude, shell, Ollama, LM Studio, Node, Git, and related adapters

packages/mcp-server
  Controlled tools for agent and workflow patch operations
```

Keep shared domain logic in packages, not hidden inside UI components or route handlers.

## Security Constraints

AgentDeck runs local commands through a daemon, so security is product-critical.

- New agents must default to read-only workspace access.
- Do not allow direct database or workflow mutation by coding agents.
- Coding agents may propose patches; platform services must validate and apply them only after approval.
- Writes, dependency installs, arbitrary commands, file deletion, commits, and pushes require explicit permission or approval.
- Never read or display raw auth files such as `~/.codex/auth.json`.
- Redact tokens, secrets, API keys, passwords, and similar values from logs, UI, test snapshots, and audit records.
- Use safe command allowlists for MVP task execution.
- Record task execution, command summaries, diffs, approvals, and rollback points in audit flows.

## Implementation Constraints

- Use TypeScript for product code unless a task explicitly chooses another language.
- Prefer strict types and schema validation at subsystem boundaries.
- Use TDD for risky domain logic such as workflow validation, runtime detection, permission policy, patch application, and audit redaction.
- Keep files focused. Split by responsibility when a module becomes hard to reason about.
- Add tests near the package or feature they cover.
- Do not add dependencies casually. Prefer small, established libraries that match the planned stack.
- Do not implement cloud execution, multi-tenant enterprise permissions, billing, plugin marketplace, full RAG, or custom model training in MVP tasks.

## UI Constraints

AgentDeck should feel like a developer workspace, not a marketing-style AI app builder.

- Default UI entry should be the workspace, not a landing page.
- Main layout should use a top bar, left sidebar, primary work area, and right inspector.
- Keep UI dense, utilitarian, and status-oriented.
- Prefer panels, tables, split views, timelines, and inspectors over decorative cards.
- Surface runtime health, task status, permissions, diffs, and approvals clearly.
- Avoid large purple/blue gradients, decorative backgrounds, and oversized hero sections.
- Use stable dimensions for toolbars, grids, node controls, counters, and inspector panels.
- Do not show secrets or raw auth content in the UI.

## Git and Documentation

- Keep `main` releasable and documented.
- Make focused commits with clear messages.
- Do not force push or rewrite shared history unless explicitly requested.
- Do not commit generated archives, local caches, secrets, or runtime auth files.
- Keep development plans in `docs/development/`.
- Keep product direction in `AGENTDECK_PRODUCT_DESIGN.md`.

## Verification

Before claiming work is complete:

- Run the relevant tests, typecheck, lint, or docs checks for the changed area.
- Read the command output and report real status.
- If a command cannot run because tooling is not scaffolded yet, state that explicitly.
- For docs-only changes, verify Markdown structure, relevant links, and git status.
