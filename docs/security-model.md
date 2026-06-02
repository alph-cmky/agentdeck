# Security Model

AgentDeck executes local commands and gives agents access to workspace context, so security is a core product capability.

## Core Principles

- New agents default to read-only workspace access.
- Dangerous actions require explicit permission or approval.
- Coding agents may propose patches but cannot apply them directly.
- The platform owns schema validation, DAG validation, permission checks, versioning, audit, and rollback.
- Secrets must never be read, displayed, logged, snapshotted, or persisted.

## Permission Levels

```text
read_workspace
  Read files under an approved workspace root.

write_workspace
  Write files under an approved workspace root.

run_safe_commands
  Run allowlisted commands such as test, typecheck, and lint.

run_arbitrary_commands
  Run arbitrary commands. Requires approval by default.

network_access
  Access the network.

install_dependencies
  Install dependencies through npm, pnpm, brew, pip, or similar tools.

git_commit
  Create git commits.

git_push
  Push to remotes. Requires strong approval by default.
```

## Secret Handling

Never read or display raw auth files such as:

```text
~/.codex/auth.json
```

Redact values matching or labeled as:

- token
- secret
- api key
- password
- credential
- authorization header

## Local Daemon Boundary

The daemon should:

- Bind to localhost by default.
- Reject non-local browser origins.
- Expose minimal runtime detection and execution APIs.
- Stream summarized events instead of exposing sensitive raw data.
- Record command summaries and outputs in an audit-friendly format.

## Workflow Patch Safety

Patch application requires:

- Target version match.
- Schema validation.
- DAG validation.
- Input/output compatibility checks.
- Permission boundary checks.
- Diff preview.
- User approval.
- Audit log.
- Rollback version.
