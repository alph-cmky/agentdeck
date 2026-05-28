# Security Policy

AgentDeck 是 local-first developer tool，会涉及本地 daemon、命令执行、workspace 文件访问、runtime adapter、workflow patch 和 agent 权限。因此安全问题请优先私下报告。

## 报告安全问题

请不要在公开 issue 中披露漏洞细节。

推荐方式：

- 使用 GitHub private vulnerability reporting。
- 如果该功能暂不可用，请联系项目维护者并说明这是安全问题。

报告时请尽量包含：

- 受影响的组件。
- 复现步骤。
- 潜在影响。
- 是否涉及 secret、文件写入、命令执行、权限绕过或 workflow patch 绕过。
- 建议修复方向，如果有。

## 高敏感范围

以下问题默认按高优先级处理：

- 任意命令执行绕过审批。
- 写文件、删除文件、安装依赖、git push 绕过权限。
- 读取或展示 `~/.codex/auth.json` 等认证文件。
- token、secret、API key、password 泄露。
- Coding agent 绕过 patch proposal 直接修改 workflow 或数据库。
- Workflow validator 被绕过，导致有环图、权限越界或输入输出不匹配仍可发布。
- Audit log 被跳过或被篡改。

## 支持版本

项目尚未发布稳定版本。当前只支持 `main` 分支上的最新代码和文档。

## 安全设计原则

- 新 Agent 默认只读。
- 高风险操作默认需要审批。
- Coding agent 只能提出 patch，平台负责校验和应用。
- 所有敏感输出必须脱敏。
- 本地 daemon 只暴露最小必要能力。
