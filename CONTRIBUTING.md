# Contributing to AgentDeck

感谢你对 AgentDeck 感兴趣。本项目仍处于早期设计和脚手架阶段，贡献应优先围绕文档、架构、开发计划和 MVP 任务展开。

## 开始前

请先阅读：

- `AGENTDECK_PRODUCT_DESIGN.md`
- `docs/development/README.md`
- `docs/development/task-backlog.md`
- `AGENTS.md`

## 贡献原则

- 先对齐任务范围，再开始实现。
- 优先选择 `docs/development/task-backlog.md` 中已有任务。
- 如果新增任务，请保持任务 ID 和阶段结构清晰。
- 修改应小而聚焦，避免无关重构。
- 涉及安全、权限、daemon、runtime execution、workflow patch 的变更必须包含测试或明确验证方式。
- 不要提交 secret、本地认证文件、生成的 archive、cache 或临时产物。

## 分支和 Commit

推荐分支命名：

```text
docs/<short-topic>
feat/AD-001-monorepo-scaffold
fix/<short-topic>
```

推荐 commit message：

```text
docs: update product design
feat: add runtime detector types
fix: redact runtime warning secrets
```

实现 backlog 任务时，优先在 commit 或 PR 中引用任务 ID，例如 `AD-101`。

## Pull Request 要求

PR 应包含：

- 变更摘要。
- 关联任务 ID 或 issue。
- 已运行的验证命令。
- 安全影响说明，特别是 daemon、命令执行、权限、secret redaction、workflow patch。
- UI 变更截图或录屏，如果涉及界面。
- 文档是否已同步更新。

## 本地验证

项目脚手架完成前，至少检查：

```text
git status --short
```

脚手架完成后，PR 应运行相关命令：

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
