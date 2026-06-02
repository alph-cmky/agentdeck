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
2. Create a focused branch.
3. Keep changes scoped to the selected task.
4. Update the task checklist when the task is complete.
5. Run the strongest available verification commands.
6. Open a pull request that links the issue.

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

## Security-Sensitive Changes

Changes involving daemon execution, runtime adapters, workflow patches, permission policy, audit logs, or secret redaction require extra scrutiny and tests.
