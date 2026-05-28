# Runtime Adapters

Runtime adapters isolate AgentDeck from the details of individual CLIs, local model providers, and command runners.

## Goals

- Detect available runtimes without exposing secrets.
- Normalize runtime metadata for the Runtime Dashboard.
- Provide a common execution interface for task orchestration.
- Keep Codex, Claude, shell, Ollama, LM Studio, Node, Git, and future integrations decoupled.

## Detection Model

Each detector should return normalized metadata:

```text
RuntimeDetectionResult
  id
  name
  type
  detected
  path
  version
  scope
  capabilities
  warnings
  lastDetectedAt
```

Runtime status levels:

```text
missing
ready
configured
projectActive
localProviderReady
```

## Detection Rules

- Use read-only probes.
- Prefer login-shell probing on macOS because GUI apps often have incomplete `PATH`.
- Do not read or display raw auth files.
- Redact token-like values in warnings and logs.
- Detect project markers such as `.codex/` and `AGENTS.md` where relevant.

## Execution Interface

Runtime execution should eventually share one adapter contract:

```text
executeTask(task, context) -> event stream
cancelTask(taskId)
getCapabilities()
```

Execution events should include stdout, stderr, tool events, diffs, completion, and failure.

## Initial Runtime Targets

- Codex
- Claude
- Safe shell
- Ollama
- LM Studio
- Node
- Git
- VS Code CLI

The safe shell adapter must reject disallowed commands before execution.
