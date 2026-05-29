# Contributing

This document supplements the root `CONTRIBUTING.md` with development-specific guidance.

## Before Starting

Read:

- `AGENTDECK_PRODUCT_DESIGN.md`
- `docs/development/README.md`
- `docs/development/task-backlog.md`
- `AGENTS.md`

## Task Flow

1. Pick an open `AD-*` issue from GitHub or `docs/development/task-backlog.md`.
2. Create a focused branch using the task ID.
3. Keep changes scoped to the selected task.
4. Update the task checklist when the task is complete.
5. Run the strongest available verification commands.
6. Open a pull request that links the issue.

## Branch Naming

Use a short branch prefix that matches the work type, followed by the task ID and a concise slug:

```text
feat/ad-101-agent-schema
fix/ad-402-runtime-events
docs/ad-1001-basic-agent-workspace
chore/ad-1002-contributor-workflow
```

Use `feat/` for product behavior, `fix/` for defects, `docs/` for documentation or examples, and `chore/` for repository workflow or maintenance changes.

## Commit Style

Use conventional, imperative commit messages:

```text
feat: add workflow canvas mvp
fix: stabilize daemon event cleanup test
docs: add basic agent workspace example
chore: add contributor workflow
```

Keep each commit focused on one task. Include docs, tests, and task checklist updates in the same commit when they are part of the task completion.

## Verification Commands

For the current scaffold:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

## Pull Request Notes

Mention:

- Related `AD-*` issue.
- Verification commands and results.
- Security impact.
- UI impact, with screenshots when relevant.
- Documentation updates.

Pull requests should pass the same quality gates locally and in CI: install, lint, format, typecheck, test, and build.

## Security-Sensitive Changes

Changes involving daemon execution, runtime adapters, workflow patches, permission policy, audit logs, or secret redaction require extra scrutiny and tests.
