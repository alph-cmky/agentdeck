# AgentDeck Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when implementing task groups from this plan. Each task is tracked in `docs/development/task-backlog.md` with checkbox syntax.

**Goal:** Build AgentDeck as a local-first multi-agent workspace with runtime detection, agent registry, chat task dispatch, workflow DAG editing, and safe chat-to-workflow patch approval.

**Architecture:** AgentDeck is planned as a monorepo with a web app, server/control plane, local daemon, shared workflow core, runtime adapters, and MCP-facing tools. The implementation should stay local-first in the MVP, with explicit permission boundaries and approval gates before code or workflow changes are applied.

**Tech Stack:** TypeScript, Next.js/React, React Flow, Node.js, Hono or Fastify, SQLite or local file-backed persistence for MVP, WebSocket/SSE event streaming, Vitest, Playwright, MCP SDK.

---

## Source Documents

- Product design: `AGENTDECK_PRODUCT_DESIGN.md`
- Original brief: `agentdeck-project-brief.md`
- Task backlog: `docs/development/task-backlog.md`

## Development Principles

- Build the product as a developer workspace, not a marketing-style AI app builder.
- Keep MVP local-first and single-user unless a task explicitly says otherwise.
- Prefer small, independently testable packages over large shared files.
- Treat local command execution as a security-sensitive capability from day one.
- Coding agents must propose patches; platform services validate and apply only after approval.
- Every phase should leave the repo in a runnable, demonstrable state.

## Phase Map

| Phase | Name | Outcome |
| --- | --- | --- |
| 0 | Repository Foundation | Monorepo scaffold, tooling, docs, CI-quality local commands |
| 1 | Runtime Detector | Detect Codex, Claude, Node, Git, Ollama, LM Studio with safe metadata collection |
| 2 | Local Daemon | Run local detection and stream events to the app/server |
| 3 | Agent Registry | Create, edit, validate, and persist agent definitions with permissions |
| 4 | Chat Workspace | Channels, messages, `@agent` mentions, task creation, task status stream |
| 5 | Runtime Adapters | Codex/Claude/shell adapter contracts and first executable task path |
| 6 | Workflow Core | DAG schema, node types, validation, versioning, execution trace model |
| 7 | Workflow Canvas | Visual DAG editor with node inspector and validation feedback |
| 8 | Patch Approval | Chat-generated workflow/agent patch proposals, diff preview, approval, rollback |
| 9 | Security & Audit | Permission enforcement, redaction, audit log, safe command policy |
| 10 | Packaging & Examples | Local dev setup, sample agents/workflows, contributor docs |

## Recommended Build Order

1. Complete Phase 0 so contributors can run, test, and format the project consistently.
2. Build Phase 1 and Phase 2 before UI-heavy work; runtime detection is the local-first differentiator.
3. Build Phase 3 and Phase 4 together enough to support the first `@agent` task.
4. Build Phase 5 to make one real coding-agent execution path work end to end.
5. Build Phase 6 before Phase 7 so the canvas has a real schema and validator behind it.
6. Build Phase 8 only after workflow versioning exists; patch approval depends on stable base versions.
7. Harden Phase 9 throughout, then finish Phase 10 for first external users.

## Definition of Done

A task is done only when:

- Code and docs are updated for the specific behavior.
- Unit or integration tests cover the behavior where practical.
- Security-sensitive outputs are redacted in tests or snapshots.
- Local verification commands are run and recorded in the PR or commit notes.
- The related checkbox in `docs/development/task-backlog.md` is updated.

## Current Scope Boundary

The MVP intentionally excludes:

- Multi-tenant enterprise permissions.
- Cloud-hosted execution.
- Billing.
- Plugin marketplace.
- Full RAG platform.
- Custom model training.
- Full Dify/Coze-style application publishing.
