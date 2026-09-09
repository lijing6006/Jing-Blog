---
title: Pi Coding Agent 完整上手指南：Windows 安装、模型配置与长上下文实战
date: 2026-09-09 09:30:00
updated: 2026-09-09 09:30:00
tags:
  - ai
  - coding-agent
  - cli
  - agent-skills
categories:
  - 开发调优
description: 从 Windows 安装、Provider 配置到 Spring Boot 实战，系统讲清 Pi Coding Agent 的 Session、Compaction、Skills、Extensions 与长上下文工作流。
cover: https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/images/interactive-mode.png
abbrlink: pi-coding-agent-guide
---

Pi 不是又一个把所有功能塞进 CLI 的编程助手。它更像一个小而稳定的终端 Agent 内核：默认给模型文件读写、编辑和 Shell 工具，其余能力交给 Skills、Extensions、Prompt Templates 和 Pi Packages 扩展。

这种设计的好处是工作流可以由自己定义，代价是使用者必须真正理解权限、上下文和会话的边界。本文以 **2026-09-09** 的官方资料为准，当时最新稳定版为 **v0.85.1**。

> 包名已经迁移：现在官方 npm 包是 `@earendil-works/pi-coding-agent`，仓库是 `earendil-works/pi`。旧教程中的 `@mariozechner/pi-coding-agent` 停留在旧版，不应再作为新安装入口。

## Pi 的定位：先是最小核心，再是个人工作流

Pi 默认提供 `read`、`write`、`edit` 和 `bash` 四个工具，Windows 上还可以启用 `powershell`。它有四种运行方式：

| 模式 | 用途 |
|---|---|
| 交互模式 | 在终端里持续对话、改代码、跑命令 |
| `-p` / `--print` | 执行一次任务后退出，适合脚本 |
| `--mode json` / `--mode rpc` | 交给其他程序集成 |
| SDK | 在 Node.js 程序中嵌入 Pi 的 Agent Session |

官方明确把 MCP、子 Agent、Plan Mode、内置待办、权限弹窗和后台 Bash 留在核心之外。这些能力不是不能有，而是需要通过 Extensions、Pi Packages、容器或 tmux 按自己的方式组装。

## Windows 安装

### 1. 准备 Node.js 和 Git for Windows

`v0.85.1` 的 npm 包要求 **Node.js >= 22.19.0**。Pi 在 Windows 上默认使用 Git Bash 执行 Bash 工具，所以大多数人还需要安装 Git for Windows。

先在 PowerShell 里检查：

```powershell
node --version
git --version
```

如果 Node 版本低于 `22.19.0`，先升级 Node，再安装 Pi。

### 2. 安装新包

```powershell
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi --version
Get-Command pi
```

`--ignore-scripts` 是官方安装命令的一部分，它会禁用依赖的生命周期脚本；Pi 的正常 npm 安装不依赖这些脚本。

如果以前安装过旧包，先卸载，避免两个包同时提供 `pi` 命令：

```powershell
npm uninstall -g @mariozechner/pi-coding-agent
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

后续更新可以用：

```powershell
pi update --self
pi update --models
```

如果安装成功却找不到 `pi`，先查 npm 的全局目录，并重开终端：

```powershell
npm config get prefix
Get-Command pi -ErrorAction SilentlyContinue
```

不要在不清楚当前 prefix 的情况下随手覆盖 `PATH`，否则容易把原有 Node、Java 或 Maven 路径一起丢掉。

### 3. 理解 Windows 上的 Shell

Pi 查找 Bash 的顺序是：

1. `~/.pi/agent/settings.json` 里显式配置的 `shellPath`
2. `C:\Program Files\Git\bin\bash.exe`
3. `PATH` 里的 `bash.exe`，例如 Cygwin、MSYS2 或 WSL

如果 Git 安装在非默认目录，可以指定路径：

```json
{
  "shellPath": "D:\\Tools\\Git\\bin\\bash.exe"
}
```

如果 Java 项目更习惯 PowerShell，可以把模型可见工具改为：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

也可以在迁移期同时保留两者：

```json
{
  "defaultTools": ["read", "bash", "powershell", "edit", "write"]
}
```

需要注意，交互编辑器中的 `!command` 和 `!!command` 仍然使用 Bash，不会因为 `defaultTools` 里改成 PowerShell 而变化。

## Provider 与模型配置

### 方式一：用 `/login` 登录

在项目目录启动：

```powershell
cd D:\Workspace\order-service
pi
```

然后在 Pi 里输入：

```text
/login
```

官方内置的订阅登录包括 ChatGPT Plus/Pro（Codex）、Claude Pro/Max 和 GitHub Copilot 等。其中 Claude Pro/Max 在第三方 harness 中使用时，官方文档说明会走 extra usage 并按 Token 计费，不是简单消耗 Claude 套餐额度。这类计费规则可能变化，使用前应再看官方 Provider 页面。

### 方式二：用 API Key

临时设置 PowerShell 环境变量：

```powershell
$env:OPENAI_API_KEY = "sk-..."
pi
Remove-Item Env:OPENAI_API_KEY
```

常见变量包括 `OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`、`DEEPSEEK_API_KEY`、`OPENROUTER_API_KEY` 等。也可以通过 `/login` 把 API Key 存到 `~/.pi/agent/auth.json`。

不要把真实 Key 写进项目的 `AGENTS.md`、`.pi/settings.json` 或 Git 跟踪的脚本。

### 选择模型与思考等级

```powershell
pi --list-models openai
pi --provider openai --model model-id --thinking high
```

交互模式里使用 `/model` 或 `Ctrl+L` 切换模型，使用 `/thinking` 切换思考等级。在选择器中按 `Ctrl+S`，可以把当前项保存为默认值。

模型名称和可用性会变，不要把网上教程里的某个 ID 当成永久值。先用 `pi --list-models` 查当前目录，再写启动命令。

### 连接 Ollama 或其他 OpenAI 兼容服务

自定义模型写在 `~/.pi/agent/models.json`。以 Ollama 为例：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "qwen2.5-coder:7b",
          "reasoning": false,
          "contextWindow": 32768,
          "maxTokens": 8192,
          "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
          }
        }
      ]
    }
  }
}
```

`apiKey: "ollama"` 是占位值：Ollama 会忽略它，但 Pi 仍需要判断这个 Provider 已配置认证。`contextWindow` 和 `maxTokens` 要与实际服务端能力一致，不要盲目照抄示例数字。

`models.json` 在每次打开 `/model` 时重载，调整模型配置通常不需要重启 Pi。

## 基础使用

启动时最好给任务命名：

```powershell
cd D:\Workspace\order-service
pi --name "order idempotency"
```

然后不要立刻让 Agent 大面积改代码，先让它建立项目模型：

```text
先阅读 pom.xml、README、目录结构和与订单幂等相关的实现。
说明请求入口、事务边界、数据表和现有测试，暂时不要修改文件。
```

常用操作：

| 输入 | 作用 |
|---|---|
| `@pom.xml` | 模糊搜索并引用项目文件 |
| `!git diff` | 执行命令，并把输出加入模型上下文 |
| `!!git status --short` | 执行命令，但不把输出发给模型 |
| `/model` | 切换模型 |
| `/hotkeys` | 查看当前版本完整快捷键 |
| `/reload` | 重载配置、Skills、Extensions 和上下文文件 |

只想做一次性审查时，可以显式限制为只读工具：

```powershell
pi --tools read,grep,find,ls -p "Review this repository for correctness risks. Do not modify files."
```

Pi 核心没有内置的逐命令权限弹窗。对会写代码的任务，建议先保持 Git 工作区可回滚；对不信任的仓库或高风险脚本，放到容器或其他隔离环境里运行。

## Java / Spring Boot 项目实战

### 1. 先写项目级 `AGENTS.md`

Pi 会从当前目录向上查找 `AGENTS.md` 或 `CLAUDE.md`，并在启动时加载。对 Spring Boot 项目，我会把真正会影响产出的规则写进去：

````markdown
# Project Rules

- Java 21, Spring Boot 3.5, Maven Wrapper.
- Preserve the existing package structure and error-response format.
- Do not change production configuration or execute database migrations.
- Never commit secrets, tokens, `.env` files, or local IDE settings.
- Keep changes scoped to the requested module.
- Run `./mvnw.cmd -q -DskipTests compile` after implementation.
- Run targeted tests first, then `./mvnw.cmd test` when practical.
- Inspect `git diff` and report any test not run.
````

Git Bash 中使用 `./mvnw.cmd`；如果已把 Pi 的模型工具改成 PowerShell，命令可改为 `.\mvnw.cmd`。

`AGENTS.md` 适合放长期有效的约束，不要把当前任务的大段需求全塞进去。任务状态更适合放在专用的 `TASK.md` 或当前 Session 里。

### 2. 分三步给任务

第一步先限定调查范围：

```text
查清 createOrder 的入口、调用链、事务边界、唯一约束和现有测试。
先汇报可验证的现状和风险，不要改代码。
```

第二步再实现聚焦的变更：

```text
在不改公开 API 的前提下，为创建订单增加幂等保护。
复用现有异常体系，补充重复请求和并发请求测试，只修改相关文件。
```

第三步做独立验证：

```text
重新阅读 git diff，按正确性、事务、并发、兼容性和测试缺口进行审查。
运行目标测试和必要的全量检查，不要用改弱断言的方式让测试通过。
```

这种拆法比一句“帮我优化下单接口”更容易控制改动范围，也便于在 Session 树上回到某个决策点重新尝试。

### 3. 把 Maven 输出当成有限资源

长上下文任务里，大量编译日志和全仓库搜索结果很容易吃掉上下文。实战中应该：

- 先跑目标模块或目标测试，再扩大范围
- 让 Agent 优先定位第一个根因，不要反复吞入同一份失败日志
- 已验证的命令、变更文件和剩余风险要写入任务记录
- 将大型日志保留在文件中，只给模型必要片段

## Session、Context 与 Compaction

这三个概念容易混在一起：

- **Session** 是保存在 `~/.pi/agent/sessions/` 中的 JSONL 会话树，按工作目录组织
- **Context** 是当前请求真正发给模型的内容，会受模型上下文窗口限制
- **Compaction** 会把旧消息总结成结构化摘要，保留较新消息继续工作

常用命令：

```powershell
pi -c
pi -r
pi --name "payment callback audit"
pi --session session-id
pi --fork session-id
pi --no-session
```

交互模式里：

| 命令 | 作用 |
|---|---|
| `/session` | 查看会话文件、ID、消息数、Token 和费用 |
| `/resume` | 选择历史会话 |
| `/tree` | 在同一个 Session 树上跳转和分支 |
| `/fork` | 从早期用户消息创建新 Session |
| `/clone` | 把当前有效分支复制为新 Session |
| `/compact [instructions]` | 手动压缩旧上下文 |

Pi 默认开启自动 Compaction。当上下文接近窗口限制或已经溢出时，它会总结旧内容并继续当前任务。默认配置是：

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

`reserveTokens` 为模型下一次回复留空间，`keepRecentTokens` 决定多少近期内容不被摘要。不建议在没有观察实际任务消耗时随意调大，否则可能没有给工具结果和最终回复留足空间。

Compaction 是有损的。完整历史仍然留在 JSONL Session 里，也可以用 `/tree` 回看，但模型继续推理时看到的是“摘要 + 保留的近期消息”，不是原封不动的全部对话。

## 一套可落地的长上下文工作流

长上下文不等于把所有文件和日志都塞给模型。我更倾向于把重要信息分为三层：

1. **稳定约束**：放在 `AGENTS.md`，例如技术栈、不能动的目录、检查命令和数据库规则
2. **任务状态**：放在 `TASK.md` 或专用记录里，包含目标、已证实现状、已修改文件、检查结果和剩余风险
3. **探索过程**：留在 Session 树里，必要时用 `/tree`、`/fork` 或 `/clone` 分支

一个较长的 Spring Boot 改造可以这样做：

1. 用 `pi --name "module + goal"` 建立专用 Session
2. 先读构建文件、模块边界和少量核心文件，把已验证结论写入任务记录
3. 按“一个行为变化 + 对应测试”分段实现，每段都查 `git diff`
4. 在进入新里程碑前主动压缩，而不是等到溢出后补救
5. 最后开一个新分支或新 Session 做独立审查，避免让原实现思路影响审查视角

里程碑处可以使用带自定义指令的压缩：

```text
/compact 只保留：任务目标、已确认的根因、关键决策及理由、已修改文件、已运行检查、失败原因、未完成项和不可丢失的命令。
```

核心原则是：**Session 负责保留历史，文件负责固化事实，Compaction 负责让当前上下文可继续推理。**

## Skills：把重复流程固化成指令包

Skill 是按需加载的能力包。Pi 启动时只向模型暴露 Skill 的名称和描述，匹配任务后再读完整 `SKILL.md`，这是一种渐进式披露，比把全部工作流常驻在系统提示中更省上下文。

常用位置：

- 全局：`~/.pi/agent/skills/` 或 `~/.agents/skills/`
- 项目：`.pi/skills/` 或 `.agents/skills/`
- 命令行：`pi --skill <path>`

一个 Spring Boot 质量检查 Skill 可以放在 `.agents/skills/spring-boot-quality/SKILL.md`：

````markdown
---
name: spring-boot-quality
description: Review and verify Spring Boot changes. Use after implementing a backend feature or bug fix.
---

# Spring Boot Quality Check

1. Inspect `git diff` and list the behavior changes.
2. Check transaction boundaries, validation, authorization, null handling, and backward compatibility.
3. Run the smallest relevant test set first.
4. Run `./mvnw.cmd -q -DskipTests compile`.
5. Run `./mvnw.cmd test` when the project size and environment allow it.
6. Report failures exactly; do not weaken assertions or skip tests to obtain a green result.
````

修改 Skill 后执行 `/reload`，然后可以显式调用：

```text
/skill:spring-boot-quality
```

Pi 实现了 Agent Skills 标准，还可以在 `settings.json` 里引用 Claude Code 或 Codex 的技能目录：

```json
{
  "skills": [
    "~/.claude/skills",
    "~/.codex/skills"
  ]
}
```

Skill 可以携带脚本，也可以指示模型执行命令。从第三方安装前必须阅读内容，不要把“Markdown 文件”错当成“天然无害”。

## Extensions：改变 Pi 的行为

Skill 主要告诉模型“该怎么做”，Extension 则可以直接改变 Pi 的运行时行为。Extension 是 TypeScript 模块，可以：

- 注册模型可调用的自定义工具
- 拦截或修改工具调用与结果
- 注册斜杠命令、快捷键和自定义 UI
- 自定义 Compaction 和分支总结
- 保存跨会话状态，或集成 CI、SSH、容器和 MCP

全局扩展放在 `~/.pi/agent/extensions/`，项目扩展放在 `.pi/extensions/`。下面是一个最小的 Bash 高风险命令确认示例：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return;

    const command = String(event.input.command ?? "");
    const touchesProduction = /\b(prod|production)\b/i.test(command);
    const runsMigration = /\b(flyway|liquibase)\b/i.test(command);

    if (touchesProduction || runsMigration) {
      const allowed = await ctx.ui.confirm(
        "High-risk command",
        `Allow this command?\n\n${command}`,
      );

      if (!allowed) {
        return { block: true, reason: "Blocked by project safety extension" };
      }
    }
  });
}
```

放到自动发现目录后可用 `/reload` 热重载。临时测试单个扩展：

```powershell
pi -e ./.pi/extensions/protect-production.ts
```

项目级 `.pi` 资源只会在项目被信任后加载。但信任项目代表允许执行其 Extension，所以在陌生仓库中看到信任提示时，先审查 `.pi/extensions/` 和已安装 Pi Packages，再做决定。

共享扩展、Skills、Prompts 和主题可以打包成 Pi Package：

```powershell
pi install npm:@scope/pi-tools
pi install git:github.com/owner/pi-tools@v1
pi list
pi update --extensions
pi remove npm:@scope/pi-tools
```

Pi Package 中的 Extension 拥有当前用户的系统权限。第三方包应优先钉住 tag 或 commit，安装前审查源码和依赖。

## 与 Claude Code、Codex CLI 的定位差异

这三个工具都能读仓库、改文件和运行命令，但产品取舍不同：

| 维度 | Pi Coding Agent | Claude Code | Codex CLI |
|---|---|---|---|
| 核心取向 | 最小内核 + 高可扩展 harness | Claude 生态内的完整编程产品 | OpenAI 生态内的终端 Agent |
| 模型与 Provider | 内置多 Provider，也易接本地或兼容 API | 主要围绕 Claude，终端和 IDE 也支持部分第三方 Provider | 主要围绕 OpenAI / ChatGPT 认证和 Codex 工作流 |
| 默认工作流 | 刻意精简，让用户自己组装 | 开箱集成 MCP、Skills、Hooks、子 Agent 和多端体验 | 开箱提供权限/沙箱、审查、子 Agent、Web、MCP 和云端衔接 |
| 会话分支 | JSONL 树、`/tree`、`/fork`、`/clone` 是核心特色 | 更强调产品化的会话、IDE、桌面和 Web 协同 | 支持恢复本地会话，并可与 Codex Cloud 衔接 |
| 权限边界 | 核心无逐命令权限弹窗，靠容器或 Extension 定制 | 内置权限与 Hooks 等工作流 | 内置可配置的沙箱和批准机制 |

如果需要“安装完就有完整工作流”，Claude Code 或 Codex CLI 更直接。如果需要在多个 Provider、本地模型、自定义工具和会话树之间自己做取舍，Pi 的最小内核更有吸引力。

对 Java / Spring Boot 开发，我会这样选：

- 团队已经统一 Claude 生态，并需要 IDE、MCP、Hooks 和子 Agent 开箱可用：优先 Claude Code
- 团队在 OpenAI 生态，重视沙箱、审查、Web 检索、子 Agent 或本地与云任务衔接：优先 Codex CLI
- 希望一套 CLI 灵活切换多个 Provider，并愿意自己固化安全策略和工作流：优先 Pi

工具只是执行层，项目里是否有准确的 `AGENTS.md`、可运行的测试、可回滚的 Git 状态和清晰的任务边界，往往比换一个 CLI 更影响最终质量。

## 最后的落地清单

1. 用 Node.js `22.19.0` 或更新版本，安装 Git for Windows
2. 使用 `npm install -g --ignore-scripts @earendil-works/pi-coding-agent`，不再使用旧包名
3. 通过 `/login` 或环境变量配置 Provider，不把 Key 写进 Git
4. 在仓库中先写精简、可执行的 `AGENTS.md`
5. 一个明确目标对应一个命名 Session，里程碑处主动 `/compact`
6. 把可复用检查流程做成 Skill，把需要代码拦截或新工具的能力做成 Extension
7. 对高风险项目使用只读工具或容器，不要把 Project Trust 当成命令级沙箱

## 参考资料

- [Pi 官方文档](https://pi.dev/docs/latest)
- [Pi Quickstart](https://pi.dev/docs/latest/quickstart.md)
- [Pi Windows Setup](https://pi.dev/docs/latest/windows.md)
- [Pi Providers](https://pi.dev/docs/latest/providers.md)
- [Pi Sessions](https://pi.dev/docs/latest/sessions.md)
- [Pi Compaction](https://pi.dev/docs/latest/compaction.md)
- [Pi Skills](https://pi.dev/docs/latest/skills.md)
- [Pi Extensions](https://pi.dev/docs/latest/extensions.md)
- [Pi Custom Models](https://pi.dev/docs/latest/models.md)
- [Pi GitHub 仓库](https://github.com/earendil-works/pi)
- [Pi v0.85.1 Release](https://github.com/earendil-works/pi/releases/tag/v0.85.1)
- [Pi npm 包](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [OpenAI Docs：Codex CLI](https://developers.openai.com/codex/cli/)
