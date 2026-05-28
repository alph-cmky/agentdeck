# AgentDeck Agent 指令

本文档定义 AI coding agent 在本仓库中工作时必须遵守的项目约束。

## 项目上下文

AgentDeck 是一个面向开发者和 AI builder 的 local-first 多 Agent 工作区。产品组合了：

- 基于 Chat 的多 Agent 协作。
- 对 Codex、Claude、Ollama、LM Studio、Node、Git 等本地 runtime 的探测。
- 低代码 Agent 和 Workflow DAG 编排。
- 通过 patch proposal、校验、diff preview、审批和回滚实现安全的 chat-to-workflow 编辑。

主要参考文档：

- `AGENTDECK_PRODUCT_DESIGN.md`
- `agentdeck-project-brief.md`
- `docs/development/README.md`
- `docs/development/task-backlog.md`

## 工作规则

- 将 `docs/development/task-backlog.md` 作为计划任务的事实来源。
- 任务 ID 一旦出现在 commit、issue 或 PR 中，就必须保持稳定。
- 完成计划任务时，更新对应任务的 checkbox。
- 修改必须小而聚焦，只覆盖当前任务范围。
- 优先遵循项目已有模式和既定 package 边界，不随意发明新结构。
- 实现聚焦任务时，不做大范围无关重构。
- 当行为、架构、权限或 workflow 发生变化时，同步更新文档。

## 架构约束

计划中的仓库结构如下：

```text
apps/web
  Next.js / React / React Flow UI

apps/server
  Node.js control plane，负责 agents、workflows、chat、audit 和 permissions

apps/daemon
  本地 runtime 探测、进程执行、workspace adapter 和 event stream

packages/workflow-core
  DAG schema、validator、executor、versioning 和 patch engine

packages/runtime-adapters
  Codex、Claude、shell、Ollama、LM Studio、Node、Git 等 adapter

packages/mcp-server
  面向 agent 的受控工具，用于 agent 和 workflow patch 操作
```

共享领域逻辑应放在 packages 中，不要隐藏在 UI 组件或 route handler 内部。

## 安全约束

AgentDeck 会通过本地 daemon 执行命令，因此安全是产品核心能力。

- 新 Agent 默认只能读取 workspace。
- 不允许 coding agent 直接修改数据库或 workflow 状态。
- Coding agent 可以提出 patch；平台服务必须先校验，且只在审批后应用。
- 写文件、安装依赖、任意命令、删除文件、commit、push 都必须有显式权限或审批。
- 永远不要读取或展示原始认证文件，例如 `~/.codex/auth.json`。
- 日志、UI、测试快照和审计记录中必须脱敏 token、secret、API key、password 等敏感值。
- MVP 的任务执行必须使用安全命令 allowlist。
- 任务执行、命令摘要、diff、审批和 rollback point 必须进入审计流程。

## 实现约束

- 产品代码默认使用 TypeScript，除非任务明确指定其他语言。
- 子系统边界处优先使用严格类型和 schema validation。
- 对 workflow validation、runtime detection、permission policy、patch application、audit redaction 等高风险领域逻辑使用 TDD。
- 文件职责要聚焦。模块变得难以理解时，应按责任拆分。
- 测试应靠近被测 package 或 feature。
- 不要随意添加依赖。优先选择小而成熟、符合计划技术栈的库。
- MVP 任务中不要实现 cloud execution、多租户企业权限、billing、plugin marketplace、完整 RAG 或 custom model training。

## UI 约束

AgentDeck 应该像开发者工作区，而不是营销型 AI app builder。

- 默认入口应是 workspace，而不是 landing page。
- 主布局应包含 top bar、left sidebar、primary work area 和 right inspector。
- UI 要高密度、工具化、强调状态。
- 优先使用 panel、table、split view、timeline 和 inspector，少用装饰性 card。
- 清楚展示 runtime health、task status、permissions、diff 和 approval。
- 避免大面积紫蓝渐变、装饰背景和超大 hero section。
- toolbar、grid、node control、counter 和 inspector panel 要有稳定尺寸。
- UI 中不得展示 secret 或原始 auth 内容。

## Git 和文档

- 保持 `main` 可发布且文档同步。
- Commit 要聚焦，message 要清晰。
- 除非用户明确要求，不要 force push 或重写共享历史。
- 不要提交生成的 archive、本地 cache、secret 或 runtime auth 文件。
- 开发计划维护在 `docs/development/`。
- 产品方向维护在 `AGENTDECK_PRODUCT_DESIGN.md`。

## 验证要求

在声明工作完成前：

- 运行变更区域对应的 test、typecheck、lint 或 docs check。
- 阅读命令输出，并报告真实状态。
- 如果因为脚手架或工具尚未建立导致命令无法运行，必须明确说明。
- 对纯文档变更，检查 Markdown 结构、相关链接和 git status。
