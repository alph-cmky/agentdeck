# AgentDeck Claude Code 指令

在本仓库中工作的 Claude Code agent 必须遵守 `AGENTS.md` 中的共享项目约束。

## 主要工作流程

1. 阅读 `AGENTS.md`。
2. 阅读 `docs/development/README.md`。
3. 在 `docs/development/task-backlog.md` 中找到相关任务。
4. 编辑文件前确认任务范围。
5. 只实现当前任务或用户明确要求的变更。
6. 运行相关验证命令。
7. 必要时更新任务 checkbox 和文档。
8. 只有在用户要求 commit 时，才提交聚焦且有意图明确的变更。

## Claude 专用约束

- 实现产品行为时，不得绕过 AgentDeck 的 patch / approval 模型。
- 不要编写允许模型绕过平台校验、直接修改 workflow 状态的代码。
- 不要读取、打印、总结或持久化本地 auth 文件中的 secret。
- 不要使用会修改无关文件的宽泛 shell 命令。
- 除非用户明确要求，不要运行 `git reset --hard`、`git checkout --`、force push 等破坏性 git 命令。
- 如果发现用户或其他流程产生的未预期变更，必须保留并基于它们继续工作。
- 搜索文件和文本时优先使用 `rg`。
- 优先使用小 patch，避免大范围重写。
- 实现 backlog 任务时，commit message 应引用对应任务 ID。

## 预期技术方向

除非任务文档另有说明，使用计划中的技术栈：

- TypeScript
- `apps/web` 使用 Next.js / React
- Workflow canvas 使用 React Flow
- `apps/server` 使用 Node.js + Hono 或 Fastify
- `apps/daemon` 使用 Node.js 或 Rust；在 runtime 需求证明有必要前，优先 Node.js
- 单元测试使用 Vitest
- 浏览器级 UI 检查使用 Playwright
- 面向 agent 的受控工具使用 MCP SDK

## 产品边界

MVP 应保持：

- Local-first
- 默认单用户
- 权限感知
- 审计友好
- Agent 和 Workflow 变更必须 patch-driven
- 聚焦 Codex / Claude / 本地 runtime 协作

不要把 MVP 扩展到：

- 多租户企业管理
- 云端托管执行
- Billing
- Plugin marketplace
- 完整 RAG 平台
- 自定义模型训练
- 完整 Dify 或 Coze 式应用发布

## UI 边界

构建 UI 时遵循 `AGENTDECK_PRODUCT_DESIGN.md` 中的产品方向：

- 第一屏构建真实 workspace 体验。
- 使用左侧导航、中间工作区、右侧 inspector。
- 设计应偏开发者工具，信息密度高，视觉克制。
- 优先呈现 runtime status row、task timeline、diff preview、permission control 和 workflow inspector。
- 除非用户明确要求，不要创建营销 landing page。

## 验证要求

在声称变更完成前，运行当前变更区域可用的最强检查：

- Runtime / domain logic：unit tests 和 typecheck。
- UI 变更：typecheck；如已有 component tests 则运行；存在 dev server 时进行浏览器验证。
- 文档变更：检查已编辑 Markdown，并验证 git status。

如果仓库脚手架或工具尚不存在，明确说明哪些验证无法运行以及原因。
