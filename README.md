# AgentDeck

AgentDeck is a local-first workspace for multi-agent coding and low-code orchestration.

The project is in early development. Current work is focused on turning the product design into a small, testable monorepo: runtime detection, local daemon, agent registry, chat workspace, workflow core, workflow canvas, and safe patch approval.

## What AgentDeck Is

AgentDeck is designed to combine:

- Slack-like multi-agent collaboration in channels and threads.
- Local runtime detection for Codex, Claude, Ollama, LM Studio, Node, Git, and related tools.
- Low-code Agent and Workflow DAG orchestration.
- Safe chat-to-workflow editing through patch proposals, validation, diff preview, approval, and rollback.

## MVP Scope

The MVP focuses on:

- Runtime Detector
- Agent Registry
- Chat Workspace
- Local Daemon
- Workflow Canvas
- Workflow Patch Approval

The MVP intentionally excludes multi-tenant enterprise permissions, cloud-hosted execution, billing, plugin marketplace, full RAG, custom model training, and full Dify/Coze-style app publishing.

## Project Documents

- Product design: [`AGENTDECK_PRODUCT_DESIGN.md`](AGENTDECK_PRODUCT_DESIGN.md)
- Original project brief: [`agentdeck-project-brief.md`](agentdeck-project-brief.md)
- Development plan: [`docs/development/README.md`](docs/development/README.md)
- Task backlog: [`docs/development/task-backlog.md`](docs/development/task-backlog.md)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Runtime adapters: [`docs/runtime-adapters.md`](docs/runtime-adapters.md)
- Workflow schema: [`docs/workflow-schema.md`](docs/workflow-schema.md)
- Security model: [`docs/security-model.md`](docs/security-model.md)
- Contributing guide: [`docs/contributing.md`](docs/contributing.md)
- Agent instructions: [`AGENTS.md`](AGENTS.md)
- Claude Code instructions: [`CLAUDE.md`](CLAUDE.md)

## License

AgentDeck is open source under the [MIT License](LICENSE).
