# AgentDeck 项目交接简报

日期：2026-05-27

本文档整理自一次关于“开源多 Agent 低代码编排平台”的产品调研会话，用于在新的 session 中继续进行项目设计、OpenSpec、脚手架和开发。

## 1. 项目一句话

AgentDeck 是一个面向开发者和 AI builder 的开源 local-first Agent Workspace：在一个 Chat 工作区中管理多个本地或云端 Agent，用低代码工作流编排它们，并允许用户通过自然语言让 Claude Code / Codex 等 coding agent 修改 Agent 配置、Workflow 和项目代码。

## 2. 推荐 repo 名

推荐名称：`agentdeck`

选择理由：

- 短、好记、适合开源项目。
- `agent` 直接表达核心对象。
- `deck` 暗示一组 agents、工作台、控制台、编排面板。
- 不把项目锁死在 coding agent、workflow engine 或低代码平台某一个窄方向。

备选名称：

- `agentforge`：偏构建/编排，但撞名概率较高。
- `agentboard`：直观，像多 Agent 工作台。
- `flowagents`：强调低代码 flow，但品牌感弱。
- `localagents`：强调本地优先，但范围偏窄。
- `agentmesh`：强调多 Agent 协作网络，技术感强。
- `codedeck`：更偏 Claude Code / Codex coding workspace。
- `agentstudio-local`：描述清楚，但太长。

## 3. 产品目标

目标不是再做一个 Dify、Flowise 或 Coze Studio，而是补齐社区中尚未成熟的一块：

```text
Slock-like 多 Agent 协作空间
+ Coze-like 低代码 Agent / Workflow 编排
+ Chat 中让 Claude Code / Codex 修改 Agent 和 Workflow
+ 本地 runtime 探测与 local daemon
```

用户理想体验：

```text
用户在 Chat 中说：
“把这个客服 Agent 加一个审核节点，失败时交给 Codex 修工具代码。”

系统自动：
1. 找到 Agent / Workflow
2. 生成可视化 DAG patch
3. 校验输入输出、权限、无环
4. 调用 Claude Code / Codex 修改配置或代码
5. 展示 diff
6. 用户确认后发布
```

## 4. 社区现状判断

截至 2026-05-27，社区里有很多可借鉴组件，但没有一个完整覆盖本项目设想的成熟开源方案。

| 方向 | 代表方案 | 可借鉴点 | 不足 |
| --- | --- | --- | --- |
| 多 Agent 协作空间 | Slock | Channel / DM / thread、多 Agent、local daemon、持久记忆 | 低代码编排弱，完整开源生态不明确 |
| 低代码 Agent 平台 | Coze Studio | Agent、Workflow、Plugin、RAG、可视化低代码 | 架构较重，偏平台，不是本地 coding-agent workspace |
| LLM App 平台 | Dify | 应用、Agent、Workflow、RAG、插件、API 发布 | 更偏 AI 应用发布，不偏本地代码协作 |
| 可视化 Agent 工作流 | Flowise / Langflow | Chatflow、Agentflow、可视化搭建、API/SDK/CLI | 本地 coding agent 与安全改图能力不足 |
| 多 Agent 框架 | CrewAI / AutoGen Studio / LangGraph | 多 Agent 协作、任务分发、状态图、调试 | 更偏框架或实验台，不是完整产品 |
| coding agent runtime | OpenHands / Aider / Claude Code / Codex CLI | 代码修改、命令执行、仓库任务、沙箱能力 | 缺少 Coze-like 低代码工作流产品体验 |
| 协议层 | MCP | 标准化 tools/resources/prompts，可做 Agent 修改系统的安全工具层 | 本身不是应用框架 |

结论：最优策略不是直接 fork Coze/Dify，而是借鉴它们的模型，自研本地 daemon、Chat 协作层和 workflow patch 安全层。

## 5. 核心差异化

AgentDeck 的核心差异应放在五点：

1. **Agent Workspace**
   类似 Slack/Slock 的 channel、thread、DM。用户可以 `@agent` 分配任务，查看 agent 执行状态和产物。

2. **Local Runtime Hub**
   自动探测并接入本机 `codex`、`claude`、`ollama`、`lmstudio`、`openhands` 等 runtime。

3. **Low-code Agent Graph**
   用可视化 DAG 定义 Agent、工具、条件、人审、代码执行、发布流程。

4. **Chat-to-Workflow Editing**
   用户在 Chat 里提出修改，系统生成 patch，校验后展示 diff，确认再发布。

5. **Coding Agent Bridge**
   Claude Code / Codex 不只是被调用执行任务，还能通过受控 MCP/API 修改 Agent 定义、workflow JSON、配置文件和项目代码。

## 6. 推荐 MVP 范围

第一版只做六个能力，避免范围失控：

```text
1. Runtime Detector
   探测 codex / claude / ollama / lmstudio / node / git

2. Agent Registry
   创建 Agent：名称、system prompt、模型、工具权限、工作目录

3. Chat Workspace
   Channel + @agent mention + 任务状态流

4. Local Daemon
   本机启动 codex exec / claude / shell command，并回传事件

5. Workflow Canvas
   Start / Agent / Tool / Condition / Human Approval / End

6. Workflow Patch
   Chat 生成 workflow patch，平台 validate + preview diff + approve + apply
```

第一版不做：

- 多租户企业权限。
- 插件市场。
- 完整 RAG 平台。
- 复杂 billing。
- 云端托管执行。
- 自定义模型训练。
- 完整 Coze/Dify 级别应用发布平台。

## 7. 推荐技术架构

```text
apps/web
  Next.js / React / React Flow
  Chat、Agent Studio、Workflow Canvas、Runtime Dashboard

apps/server
  Node.js / Hono or Fastify
  Agent registry、workflow registry、conversation、audit、auth

apps/daemon
  Node.js or Rust
  Runtime detection、process runner、workspace adapter、local event stream

packages/workflow-core
  DAG schema、validator、executor、versioning、patch engine

packages/runtime-adapters
  codex adapter、claude adapter、ollama adapter、openhands adapter

packages/mcp-server
  expose tools:
    get_agent
    propose_agent_patch
    validate_workflow
    propose_workflow_patch
    apply_patch_with_approval
```

高层数据流：

```text
Web / Desktop App
  ├─ Chat: channel / DM / thread
  ├─ Agent Studio: 自定义 Agent 低代码配置
  ├─ Workflow Canvas: Coze-like DAG 编排
  └─ Runtime Monitor: 本地 Codex / Claude / Ollama / tools 状态

Backend / Control Plane
  ├─ Agent Registry: agent 定义、角色、模型、工具权限
  ├─ Workflow Registry: DAG schema、版本、发布状态
  ├─ Conversation Service: channel、消息、mentions、任务分发
  ├─ Orchestrator: 调度 agent / workflow / human approval
  ├─ Memory Service: agent 记忆、项目知识、执行摘要
  └─ Audit & Permission: 每次修改、命令、文件写入都留痕

Local Daemon
  ├─ Runtime Detector: codex / claude / ollama / lmstudio
  ├─ Process Runner: 启动 Claude Code / Codex CLI session
  ├─ Workspace Adapter: git worktree / repo / sandbox
  ├─ MCP Bridge: 暴露平台工具给 Claude/Codex
  └─ Event Stream: stdout、tool event、diff、状态回传
```

## 8. 关键数据模型

```text
AgentDefinition
  id
  name
  description
  prompt
  model
  tools
  permissions
  memoryScope
  runtimePreference
  workspaceRoot

WorkflowDefinition
  id
  version
  nodes
  edges
  variables
  permissions
  status
  createdAt
  updatedAt

Runtime
  id
  type
  path
  version
  capabilities
  health
  lastDetectedAt

Conversation
  id
  channelId
  threadId
  messages
  mentions
  taskRefs

PatchProposal
  id
  targetType
  targetId
  baseVersion
  jsonPatch
  validationResult
  approvalState
  diffPreview
```

## 9. Runtime Detector 设计要点

本地 runtime 探测不要只依赖 `command -v`，需要多个信号：

```text
Runtime Registry
  └─ codex
      ├─ binary candidates: codex, /Applications/Codex.app/.../codex, npm global bins
      ├─ version command: codex --version
      ├─ config paths: ~/.codex/config.toml, <project>/.codex/config.toml
      ├─ project markers: .codex/, AGENTS.md
      ├─ capabilities probe: codex --help, codex exec --help, codex mcp list
      └─ local model providers: --oss, --local-provider ollama|lmstudio
```

macOS GUI/daemon 启动时 PATH 经常不完整，探测时建议使用登录 shell：

```bash
/bin/zsh -lc 'command -v codex && codex --version'
```

本 session 中已在当前机器探测到：

```text
codex path: /Users/gaoyinrun/Library/Application Support/Herd/config/nvm/versions/node/v20.19.5/bin/codex
codex version: codex-cli 0.128.0
CODEX_HOME: /Users/gaoyinrun/.codex
claude: /Users/gaoyinrun/.local/bin/claude
code: /usr/local/bin/code
ollama: 未在 PATH 中
lmstudio: 未在 PATH 中
```

建议 Codex runtime 状态分层：

```text
ready:
  codex binary exists + version command succeeds

configured:
  ready + ~/.codex/config.toml exists

projectActive:
  configured + 当前项目存在 .codex/ 或 AGENTS.md

localProviderReady:
  codex supports --oss + ollama/lmstudio 任一服务可访问
```

Runtime 输出建议：

```json
{
  "id": "codex",
  "name": "OpenAI Codex CLI",
  "detected": true,
  "path": "/Users/.../bin/codex",
  "version": "codex-cli 0.128.0",
  "scope": ["global", "project"],
  "configPath": "/Users/gaoyinrun/.codex/config.toml",
  "projectMarker": "/Users/gaoyinrun/Desktop/qy/gut-health-ai/.codex",
  "capabilities": {
    "exec": true,
    "mcp": true,
    "oss": true,
    "localProviders": ["ollama", "lmstudio"]
  },
  "warnings": []
}
```

安全边界：

- 只读版本、路径、capabilities。
- 不读取或展示 `~/.codex/auth.json` 原文。
- 配置文件展示必须脱敏 token、secret、api key、password。

## 10. Chat 修改 Agent / Workflow 的安全机制

不要让 Claude Code / Codex 直接改数据库或任意改 workflow 文件。推荐所有修改都走受控工具层：

```text
用户: “把这个 Agent 加一个代码审查节点，并在失败时走人工确认”
  ↓
Chat Orchestrator
  ↓
Claude/Codex 调用 MCP 工具:
  - get_agent_schema(agentId)
  - propose_workflow_patch(workflowId, jsonPatch)
  - validate_workflow_patch(patch)
  - preview_workflow_diff(patch)
  - apply_workflow_patch(patchId) 需要用户确认
  ↓
平台校验:
  - DAG 无环
  - 节点输入输出类型匹配
  - 权限不越界
  - 运行时可用
  - 版本可回滚
```

核心原则：

- Agent 只能提出 patch。
- 平台负责 schema validate、DAG validate、权限校验和版本落库。
- 用户确认后才能 apply。
- 每次修改必须有 audit log 和 rollback version。

## 11. Workflow 节点 MVP

第一版节点保持克制：

```text
Start
  工作流入口，接收用户输入和上下文变量

Agent
  调用一个 AgentDefinition

Tool
  调用 MCP tool 或平台内置工具

Condition
  根据结构化字段或表达式分支

Human Approval
  暂停执行，等待用户确认

End
  输出最终结果
```

后续可扩展：

- Code Execution
- Memory Read / Write
- Retrieval
- Webhook
- Scheduler
- Sub-workflow
- Parallel
- Loop

## 12. 权限模型

本地 daemon 能执行命令，所以权限是产品核心，而不是后补功能。

建议权限分级：

```text
read_workspace
  读取指定 workspace 文件

write_workspace
  写入指定 workspace 文件

run_safe_commands
  运行白名单命令，例如 test、typecheck、lint

run_arbitrary_commands
  运行任意命令，默认需要人审

network_access
  允许访问网络

install_dependencies
  允许 npm/pnpm/brew/pip 等安装依赖

git_commit
  允许创建 commit

git_push
  允许 push，默认强人审
```

默认策略：

- 新 Agent 默认只读。
- 写文件、安装依赖、push、删除文件都需要明确授权。
- 对 coding agent 使用 git worktree 或 sandbox。
- 每个 task 记录命令、stdout/stderr 摘要、diff 和审批人。

## 13. 推荐开源策略

建议从第一天就按社区项目设计：

```text
License: Apache-2.0 或 MIT
Repo: monorepo

Docs:
  README.md
  docs/architecture.md
  docs/runtime-adapters.md
  docs/workflow-schema.md
  docs/security-model.md
  docs/contributing.md
  examples/
```

项目 tagline：

```text
Open-source local-first Agent Workspace for Claude Code, Codex, and low-code agent workflows.
```

更短版本：

```text
Local-first workspace for multi-agent coding and low-code orchestration.
```

## 14. 分阶段路线图

```text
Phase 0: 项目定义和竞品文档
  - README
  - architecture
  - security model
  - workflow schema draft
  - runtime adapter interface draft

Phase 1: Runtime Detector + Local Daemon
  - 探测 codex / claude / ollama / lmstudio / node / git
  - 本地 daemon WebSocket/SSE 事件流
  - runtime dashboard

Phase 2: Agent Registry + Chat @agent
  - 创建 Agent
  - Channel / thread / message
  - @agent mention 触发任务
  - task status stream

Phase 3: Workflow DAG + 执行器
  - Start / Agent / Tool / Condition / Human Approval / End
  - DAG validator
  - workflow versioning
  - execution trace

Phase 4: Chat 修改 Agent/Workflow
  - propose patch
  - validate patch
  - preview diff
  - human approval
  - apply + rollback

Phase 5: Memory、Audit、Plugin/MCP 市场
  - agent memory
  - knowledge attachments
  - MCP tool registry
  - examples gallery
```

## 15. 最大风险

1. **安全**
   本地 daemon 可以执行命令，必须默认最小权限、人审、审计、workspace sandbox。

2. **Workflow 被模型改坏**
   所有修改必须走 patch、schema validate、DAG validate、版本回滚。

3. **Claude/Codex API 不统一**
   需要 adapter 层，不要把平台绑定到某一个 CLI。

4. **范围过大**
   第一版不要做 RAG、插件市场、多租户、企业权限。先把本地 Agent workspace 跑通。

5. **现有平台诱惑**
   直接 fork Coze/Dify 会带来架构包袱。建议先轻量自研核心，借鉴它们的产品模型。

## 16. 下一次 session 建议开场 prompt

可以把下面这段直接发给新的 session：

```text
我想启动一个新开源项目，repo 名叫 agentdeck。它是一个 local-first Agent Workspace，目标是融合 Slock-like 多 Agent Chat 协作、Coze-like 低代码 Agent/Workflow 编排，以及 Claude Code/Codex 通过 Chat 修改 Agent 配置和 Workflow 的能力。

请先阅读 /Users/gaoyinrun/Desktop/qy/agentdeck-project-brief.md，然后帮我进入项目创建前的设计流程：确认 MVP 范围、技术栈、repo 结构、OpenSpec/README 初稿、TDD 开发计划。不要直接写代码，先输出方案并让我确认。
```

如果新 session 不在本机，也可以把本文档全文粘贴过去。

## 17. 已参考的公开资料

- Slock: https://slock.ai/
- Coze Studio: https://github.com/coze-dev/coze-studio
- Dify: https://dify.ai/
- Flowise: https://flowiseai.com/
- Langflow: https://docs.langflow.org/
- CrewAI: https://docs.crewai.com/introduction
- AutoGen Studio paper: https://arxiv.org/abs/2408.15247
- OpenHands: https://www.openhands.one/
- Claude Code Subagents: https://code.claude.com/docs/en/sub-agents
- OpenAI Codex CLI: https://developers.openai.com/codex/cli
- Ollama Codex integration: https://docs.ollama.com/integrations/codex
- Model Context Protocol: https://modelcontextprotocol.wiki/en/introduction

