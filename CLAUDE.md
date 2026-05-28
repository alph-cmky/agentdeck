# AgentDeck Claude Code Instructions

Claude Code agents working in this repository must follow the shared project constraints in `AGENTS.md`.

## Primary Workflow

1. Read `AGENTS.md`.
2. Read `docs/development/README.md`.
3. Find the relevant task in `docs/development/task-backlog.md`.
4. Confirm the task scope before editing files.
5. Implement only the current task or the explicitly requested change.
6. Run the relevant verification commands.
7. Update task checkboxes and docs when appropriate.
8. Commit only focused, intentional changes when asked to commit.

## Claude-Specific Constraints

- Do not bypass AgentDeck's patch/approval model when implementing product behavior.
- Do not write code that lets a model directly mutate workflow state without platform validation.
- Do not read, print, summarize, or persist secrets from local auth files.
- Do not use broad shell commands that alter unrelated files.
- Do not run destructive git commands such as `git reset --hard`, `git checkout --`, or force pushes unless the user explicitly requests them.
- If unexpected user changes appear, preserve them and work around them.
- Prefer `rg` for searching files and text.
- Prefer small patches over large rewrites.
- Use clear commit messages that reference the task ID when implementing backlog work.

## Expected Technical Direction

Use the planned stack unless a task document changes it:

- TypeScript
- Next.js / React for `apps/web`
- React Flow for workflow canvas
- Node.js with Hono or Fastify for `apps/server`
- Node.js or Rust for `apps/daemon`, with Node.js preferred until runtime needs prove otherwise
- Vitest for unit tests
- Playwright for browser-level UI checks
- MCP SDK for controlled agent-facing tools

## Product Guardrails

The MVP should remain:

- Local-first
- Single-user by default
- Permission-aware
- Audit-friendly
- Patch-driven for Agent and Workflow changes
- Focused on Codex / Claude / local runtime collaboration

Do not expand MVP scope into:

- Multi-tenant enterprise administration
- Cloud-hosted execution
- Billing
- Plugin marketplace
- Full RAG platform
- Custom model training
- Full Dify or Coze application publishing

## UI Guardrails

When building UI, follow the product direction in `AGENTDECK_PRODUCT_DESIGN.md`:

- Build the actual workspace experience as the first screen.
- Use left navigation, central work area, and right inspector.
- Keep the design developer-oriented, dense, and calm.
- Prefer runtime status rows, task timelines, diff previews, permission controls, and workflow inspectors.
- Do not create marketing landing pages unless explicitly requested.

## Verification Expectations

Before saying a change is done, run the strongest available check for the touched area:

- Runtime/domain logic: unit tests and typecheck.
- UI changes: typecheck, component tests if present, and browser verification when a dev server exists.
- Docs changes: inspect the edited Markdown and verify git status.

If the repo scaffold or tooling does not exist yet, say which verification could not run and why.
