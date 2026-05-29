# Basic Agent Workspace

This example shows a small local-first AgentDeck workspace with one reviewer agent and one review workflow. It is meant to be inspected directly from the repository before a user creates their own workspace.

## Contents

- `agents/reviewer.json`: a read-only code reviewer agent.
- `workflows/review-flow.json`: a review workflow with Start, Agent, Human Approval, and End nodes.

## Local Inspection

From the repository root:

```bash
cat examples/basic-agent-workspace/agents/reviewer.json
cat examples/basic-agent-workspace/workflows/review-flow.json
```

To check the example while developing:

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

## Demo Flow

1. A user asks for a review of the current diff.
2. The `reviewer` agent reads repository context and summarizes risks.
3. The workflow pauses for a maintainer approval decision before any follow-up action.
4. The run ends after the approval step records the decision.

The reviewer agent intentionally defaults to read-only permissions. It can inspect code and produce review notes, but it cannot write files, install dependencies, run arbitrary commands, commit, or push.
