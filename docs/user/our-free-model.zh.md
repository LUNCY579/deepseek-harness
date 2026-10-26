# 使用 Harness 与 Our Free Model 做实验

[English](our-free-model.md) | 中文

## 摘要

本指南从全新 checkout 开始，带你在 Harness 界面获得模型回复，然后连接本地模型、API Key 提供商、账号渠道和其他客户端。插件已包含在 `plugins/our-free-model/` 中；[根目录快速入门](../../README.zh.md#run)是启动组合应用的最短路径。

## 目录

- [前提条件](#prerequisites)
- [启动组合应用](#start-the-combined-application)
- [首次调用与开始会话](#make-a-first-call-and-start-a-conversation)
- [连接本地模型](#connect-a-local-model)
- [连接 API Key 提供商](#connect-an-api-key-provider)
- [从其他应用使用插件](#use-the-plugin-from-another-app)
- [功能设置参考](#feature-setup-reference)
- [故障排查](#troubleshooting)
- [编辑与检查](#edit-and-check)
- [源码与更新管理](#source-and-update-ownership)
- [限制](#limitations)

<a id="prerequisites"></a>

## 前提条件

安装 Git 2.26 或更新版本、完整的 Node.js 24.9 或更新版本，以及根目录 `package.json` 固定的 pnpm 版本（`11.28.5`）。[根目录快速入门](../../README.zh.md#run-from-source)包含安装命令。仅有 Node 二进制文件不足以在 macOS/Linux 上构建源码：构建需要该安装目录的 `bin` 旁边存在 `include/node/node_api.h`。

| 平台 | 源码构建要求 |
|---|---|
| macOS | C 编译器（通常由 Xcode Command Line Tools 提供）以及 Node 开发头文件。 |
| Linux | 可通过 `cc` 调用的 C 编译器以及 Node 开发头文件。如果没有可用的预编译二进制文件，原生依赖还可能需要 Python 3、`make` 和 C++ 编译器。 |
| 原生 Windows | 受支持的 Node 安装；如果原生依赖需要编译，请安装 Python 3 和 Visual Studio C++ Build Tools。可选的随附 Magpie 引擎面向 Windows x64。 |
| WSL 2 | 使用 Linux 工具链，并将 checkout 放在 Linux 文件系统中。依赖应与原生 Windows checkout 分别安装。WSL 是可选的，不会将 Linux 进程变为 Windows Magpie 宿主。 |

安装会下载依赖。远程模型调用需要网络访问；本地推理（inference）需要另行安装并运行模型服务器，且已下载、加载模型。本仓库不会安装模型权重，也不会授予上游账号或额度。Python SDK、外部 MCP 服务器和可选桌面前端的其他前提条件见各自链接的指南。

<a id="start-the-combined-application"></a>

## 启动组合应用

在仓库根目录安装依赖、构建并启动：

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

打开终端打印的完整 URL，包括其中的登录令牌，并保持终端进程运行。服务器通常监听 `http://127.0.0.1:3080`。需要自行打开网页时使用 `pnpm start --no-open`；3080 端口被占用时使用 `pnpm start --port 3081`。按 Ctrl+C 停止服务器。

`pnpm start` 会加载[本地插件覆盖配置](https://github.com/LUNCY579/deepseek-harness/blob/master/apps/cli/config/examples/our-free-model.patch.yml)。根目录安装会提供插件所需的 Harness 依赖，并从仓库内归档分片恢复可选 Magpie 可执行文件，同时进行 SHA-256 校验。请勿在此 profile 中再安装一份插件。

如果实验需要独立的设置和凭据，请在启动前选择隔离的 `DSH_HOME`。在 macOS 或 Linux 中：

```sh
DSH_HOME="$PWD/.dsh-experiments/our-free-model" pnpm start --no-open
```

在 PowerShell 中：

```powershell
$env:DSH_HOME = Join-Path $PWD '.dsh-experiments/our-free-model'
pnpm start --no-open
```

后续启动使用同一目录，可保留实验配置。未覆盖时，插件将状态保存在 `~/.dsh/our-free-model`。上方实验目录已被 Git 忽略；其中包含私有设置和凭据，不应随源码共享。

只检查组合配置而不启动应用：

```sh
pnpm run start:our-free-model --dump-config
```

解析后的配置包含一个 `our-free-model` 条目，其设置为 `distribution: managed`。条目重复错误表示该目录已有另一份安装的插件；请使用新的实验目录，或从 profile 中移除重复副本。

<a id="make-a-first-call-and-start-a-conversation"></a>

## 首次调用与开始会话

打开**设置 → Our Free Model → 免费模型**。如显示介绍面板，关闭后继续。等待模型列表，或点击**刷新清单**。匿名路由默认启用；如果之前关闭过，可通过**插件设置 → 启用免费模型**开关恢复。

在模型卡片上点击**文本测试**。它会通过该模型的插件路由发送 `Reply with exactly: OK`。卡片显示耗时和返回的**模型回复**，最多 2,000 个字符。测试是真实生成请求，会使用提供商的额度。失败时会显示返回原因；请尝试其他模型，或使用自己可控制的提供商。**已列出 · 未实测**是目录状态，不代表调用成功。

如需自定义提示词，在 Harness 侧栏找到**工作区**，点击**添加工作区**。选择项目目录或空实验目录，然后点击**打开**；已有目录可通过**选择工作区**选中。新建会话，打开输入框的模型选择器，然后在 **Our Free Model** 下选择模型。发送：

> Reply with exactly: Hello from the integrated plugin.

成功意味着助手回复出现在会话中，且输入框显示你选择的插件模型。独立文本测试不会创建聊天会话，也不会替你选择模型。即使只发送文字提示词，聊天输入框也要求选择工作区；插件文本测试不要求工作区。

如需使用工作区工具，可要求模型只列出文件、不作修改，并审查出现的权限提示。随后再尝试你希望在该工作区执行的任务。选择模型并不授予工具或图片能力：模型及其上游协议都必须支持相应能力。[Web UI 指南](guide/index.zh.md)和[模型配置指南](guide/providers.zh.md)介绍普通 Harness 会话与提供商选择。

<a id="connect-a-local-model"></a>

## 连接本地模型

本路径适用于在自己机器上提供服务的模型，包括兼容的微调模型。另行启动推理服务器、加载模型，并在服务器中确认准确模型 ID。插件向服务器发送请求，不会自行加载权重。

1. 打开**设置 → Our Free Model → 聚合渠道**。
2. 搜索 **LM Studio**、**Ollama** 或 **LLaMA.cpp**，然后点击对应提供商卡片的**连接**。
3. 保持**启用**开启。将**Base URL**设为服务器的 OpenAI 兼容 API 根地址，包含 `/v1`。这些免密钥本地提供商条目的 **API Key** 留空。
4. 在**模型覆盖**中输入已加载模型的准确 ID，不添加插件的提供商前缀。多个 ID 可用逗号或换行分隔。点击**添加**；后续修改使用**保存**。
5. 在已选工作区中新建 Harness 聊天，并在 **Our Free Model** 下选择该提供商的模型。先发送简短的纯文本提示词。

| 提供商卡片 | 注册表默认 API 根地址 | 插件模型 ID |
|---|---|---|
| LM Studio | `http://localhost:1234/v1` | `lmstudio/<loaded-model-id>` |
| Ollama | `http://localhost:11434/v1` | `ollama/<loaded-model-id>` |
| LLaMA.cpp | `http://localhost:8080/v1` | `llamacpp/<loaded-model-id>` |

这些是插件注册表默认值，并不保证与你的服务器端口配置一致。请使用服务器实际提供的端点和模型 ID。本地条目未声明模型列表 URL，因此**发现模型**和提供商的**测试**无法验证它们；必须明确填写**模型覆盖**。空的本地模型列表不会提供可选模型。

对于小型本地模型，将**免费模型 → 插件设置 → 单次输出上限（token）**降低到服务器接受的值，例如首次简短实验使用 `512`，然后点击**应用**。默认请求预算可能超过小型服务器配置的上下文或输出限制。

此处 `localhost` 指运行 Harness 的机器，可能与浏览器所在机器不同。对于需要 API Key 的端点，请使用下文插件内的自定义 API 导入。也可以使用独立提供商路由的 [Harness 自定义模型 API 设置](guide/providers.zh.md)。

<a id="connect-an-api-key-provider"></a>

## 连接 API Key 提供商

打开 **Our Free Model → 聚合渠道**，找到提供商并点击**连接**。输入 **API Key**，保持**启用**开启；只有账号或网关需要不同于显示默认值的端点时，才填写**Base URL**。需要指定模型 ID 时填写**模型覆盖**；否则使用提供商声明的目录。测试前先点击**添加**或**保存**。

提供商的**测试**在受支持时检查模型列表，不会生成文本。**无法验证**可能表示提供商未声明模型列表，并非密钥被拒绝。对于声明了列表的提供商，**发现模型**可以填充 ID。确认推理能力时，请在 Harness 会话中选择已保存的模型并发送简短提示词。

空的密钥输入框会保留已保存密钥。**清除已保存的 Key**会删除它。标为**不可驱动**的提供商需要此聚合页面无法完成的 OAuth 或云凭据流程；请使用它们支持的账号流程，或普通 [Harness 模型设置](guide/providers.zh.md)。API Key 提供商可能按照账号规则收取生成费用。

对于注册表没有列出的需认证自定义端点，打开**模型工作台 → 订阅账号 → 导入账号**，将提供商选择为 **API**。填写账号名称、准确的**模型 ID**、**Base URL**、**API 格式**（`openai-chat`、`openai-responses` 或 `anthropic-messages`）和非空 **API Key**，然后点击**确认导入**。在 **Our Free Model** 下选择生成的模型并发起聊天请求。此路径仍在插件内部，不需要 Windows 工作台。

也可以通过**设置 → 模型 → DeepSeek**使用直接 DeepSeek API 账号。这是另一条 Harness 路由；如果测试目的是验证集成插件，请选择 **Our Free Model** 模型。

<a id="use-the-plugin-from-another-app"></a>

## 从其他应用使用插件

保持 Harness 运行，并先配置至少一个可用模型。插件提供两个独立配置的网关接口；请选择提供已配置模型的接口。

1. 使用插件转发服务时，打开**免费模型 → 本地转发（OpenAI 兼容）**，开启**启用转发端口**，然后点击**应用**。
2. 复制该区域显示的实际**Base URL**和 **API Key**。如果首选端口被占用，请使用启动后显示的实际端口。
3. 打开**网关设置 → 接入客户端**，查看生成的客户端配置和可用模型 ID。为其他应用配置该 URL、密钥，以及此监听器列表中的准确模型 ID。
4. 对于 **EAC router** 管理的账号渠道模型，使用**网关设置 → 渠道模型网关（OpenAI 兼容）→ 启用网关**，然后复制该网关自己的端点和密钥。其凭据和端口与**本地转发**独立。

转发服务支持模型列表和 OpenAI Chat Completions/Responses，也提供 Anthropic Messages 路由。客户端必须使用所连接监听器支持的协议。Harness 内聊天直接调用插件，无需启用网关。

连接其他设备时，开启对应监听器的局域网选项，并使用显示的网络地址和独立中继密钥。回环地址只能从同一机器访问。只向可信客户端分享局域网密钥：这些客户端可以消耗所连接账号的额度。单机实验请保持局域网访问关闭。

<a id="feature-setup-reference"></a>

## 功能设置参考

没有一个开关能自动配置所有外部服务。组合应用包含界面和路由代码；请为所需功能使用对应设置路径。

| 功能 | 设置与验证 |
|---|---|
| 匿名免费模型 | **免费模型** → 刷新列表 → **文本测试**。提供商可用性和额度可能变化；这些路由无需账号或 DeepSeek 密钥。 |
| EAC 模型池 | **EAC 模型** → **使用 GitHub 登录**，完成服务授权后测试模型。资格与服务可用性由上游决定。 |
| 账号渠道 | **EAC router** → 展开提供商 → **添加账号** → 完成登录 → 启用账号/模型。使用卡片的测试和余额控件，然后发起聊天请求。各提供商需要相应受支持账号及使用资格。 |
| API Key 与本地服务器 | **聚合渠道** → 按上文连接/配置提供商。本地条目要求明确填写模型 ID。 |
| 已有订阅凭据 | **模型工作台 → 订阅账号** → **查找本机账号**或**导入账号** → 审查提供商与模型 ID → **确认导入**。只导入有权使用的账号。导入后仍需有效凭据和额度。 |
| 可选内嵌工作台 | **模型工作台 → 工作台**启动随附的 Magpie 引擎。仓库内可执行文件仅支持 Windows x64；普通 Harness 聊天、聚合提供商和订阅账号面板不依赖此工作台。 |
| 回退及其他路由策略 | **路由** → 创建命名链，添加已配置模型 ID，选择策略并保存。在聊天中选择其 `combo:<name>` 模型。没有可用成员的链无法处理请求。 |
| 请求压缩与回复风格 | **省 Token**控制工具输出压缩、提示词风格和本地应答。这些设置可能改变请求或回答；实验需要原始请求时请关闭。 |
| 用量与错误 | **数据看板**和**运行日志**显示记录的渠道用量和失败；**免费模型**页也有自己的用量看板。调用后检查这些信息，不要将模型列表视为连接测试。 |
| 代理出口 | **免费模型 → 出口代理（订阅分流）**支持单个代理或订阅。订阅模式需要本机 mihomo 可执行文件。只在网络需要时配置。 |
| 其他 Harness 功能 | 工作区文件工具遵循所选会话权限。可选集成各有设置步骤：[MCP 记忆](guide/mcp-memory.zh.md)、[定时任务](guide/schedule.zh.md)、[插件市场](guide/plugin-market.zh.md)和 [Python SDK](guide/python-sdk.zh.md)。 |
| 可选独立/桌面前端 | 源码和独立设置说明位于 `plugins/our-free-model/packages/`；请遵循[导入的插件文档](https://github.com/LUNCY579/deepseek-harness/blob/master/plugins/our-free-model/README_EN.md)。`pnpm start` 启动的是组合 Harness Web UI。 |

Gemini OAuth 客户端密钥必须在启动 Harness 前通过环境变量提供。导入的 Gemini CLI（命令行界面）订阅凭据需要刷新令牌时，请设置 `OUR_FREE_MODEL_GEMINI_CLIENT_SECRET`。使用 Gemini 账号渠道登录或刷新令牌前，请设置 `CMDC_PAK_GOOGLE_CLIENT_SECRET`。这两种流程均保留默认的公开客户端 ID；账号渠道还支持通过 `CMDC_PAK_GOOGLE_CLIENT_ID` 指定与密钥匹配的自定义 OAuth 客户端。匿名提供商、其他提供商以及仍有效的 Gemini 访问令牌均不需要这些密钥。

<a id="troubleshooting"></a>

## 故障排查

| 现象 | 检查内容 |
|---|---|
| 找不到 `pnpm` 或版本不同 | 安装根目录快速入门指定的版本，或启用 Corepack 管理的 pnpm。在 checkout 内运行 `pnpm --version`。 |
| 构建报告 `Node-API headers missing` | 使用完整官方 Node 发行包，或在运行的 Node 二进制文件旁包含开发头文件的版本管理器安装。单独复制的 Node 可执行文件没有这些头文件。 |
| 缺少 `cc` 或原生编译失败 | 安装[前提条件](#prerequisites)中的平台工具。Node、依赖和 checkout 应位于同一操作系统环境。 |
| 构建拒绝 TypeScript 类型擦除设置 | 从启动设置移除 `--no-experimental-strip-types`，并使用受支持的完整 Node 构建；详见[开发前提条件](../development.zh.md)。 |
| 缺少 Web 产物或包模块 | 先完成 `pnpm install --frozen-lockfile` 和 `pnpm run build`，再执行 `pnpm start`。启动命令不会重新构建整个仓库。 |
| 没有 **Our Free Model** 设置页 | 确认从本 checkout 运行了 `pnpm start`，而非上游 `npx` 或普通 `start:web`。通过 `--dump-config` 检查本地插件条目，再检查服务器日志。 |
| 聊天输入框不可用 | 通过**选择工作区**选中工作区，再选择可用模型。插件文本测试不要求工作区。 |
| 免费模型列表为空，或调用返回 401、403、429、超时 | 阅读错误，检查提供商凭据/资格/额度与网络访问，然后刷新或选择其他模型。反复重试不会产生访问资格或额度。共享服务不可用时，可配置本地模型或自己的 API 提供商。 |
| 本地提供商保存后仍无可选模型 | 在**模型覆盖**填写准确的已加载 ID。本地注册表条目不支持自动发现。确认服务器运行，且基础地址包含 `/v1`。 |
| 模型能回复文字，但工具或图片调用失败 | 检查模型/服务器能力及协议。先测试纯文本，再分别测试所需能力；不要假定每个目录条目都支持 agent（智能体）任务。 |
| 网关客户端报告未授权或找不到模型 | 从与所配置 URL 相同的监听器复制密钥和模型 ID。渠道网关、本地转发和局域网中继的凭据彼此独立。 |
| 工作台在 macOS/Linux 无法启动 | 随附 Magpie 二进制文件仅支持 Windows x64。请在这些平台使用普通 Harness 聊天和其他插件页面。 |
| Magpie 归档恢复报告分片缺失/损坏 | 从 Git 恢复报告的归档分片，再运行 `node scripts/prepare-our-free-model.mjs`。已有可执行文件不符时，脚本会保留它；请审查并明确移走该文件后再重试。 |
| 插件升级不可用 | 本 checkout 使用 managed 模式。按照下方步骤通过 Git 更新并重新构建。 |

如果构建进程因机器内存不足被终止，可减少并行构建步骤后重试。macOS/Linux：

```sh
DSH_GATE_CONCURRENCY=1 pnpm run build
```

PowerShell：

```powershell
$env:DSH_GATE_CONCURRENCY = '1'
pnpm run build
```

这会减少并行工作，但不会减少单个编译器或打包步骤所需的内存。

<a id="edit-and-check"></a>

## 编辑与检查

运行 `pnpm run dev:our-free-model` 可进入组合开发流程。Harness client bundle 会通过现有 Web 开发流程重新构建。修改插件 host JavaScript 后请重启进程；managed 模式会禁用插件自己的热重载。修改插件浏览器入口后请重新加载页面。

从仓库根目录运行插件的离线贡献者测试套件与适配器类型检查：

```sh
pnpm run test:our-free-model
pnpm run typecheck:our-free-model
```

贡献者检查不需要原发布者的发布签名密钥。签名发布检查和真实提供商探测独立执行。请通过文本测试或聊天请求验证已配置的真实提供商，再测试需要的各项工具或图片能力；离线检查通过并不能证明提供商当前可用。[开发指南](../development.zh.md)介绍 Harness 检查与常规构建流程。

<a id="source-and-update-ownership"></a>

## 源码与更新管理

更新前停止服务器。拉取前审查本地修改，然后运行：

```sh
git pull --ff-only
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

使用与之前相同的 `DSH_HOME` 可保留设置。managed 模式将代码更新交给本仓库管理，并禁用插件的上游自更新、公告轮询和自身热重载。请将插件的 MIT 许可证及随附第三方声明保留在对应源码旁。导入的发布记录描述的是上游发布，并非本合并 fork 的签名发布。

| 位置 | 负责的工作 |
|---|---|
| `packages/`, `apps/` | Harness 服务、profile 和 UI |
| `plugins/our-free-model/index.js`, `src/`, `client.js` | 插件 host、模型路由和浏览器 UI |
| `plugins/our-free-model/vendor/` | 导入的渠道实现和支持资产 |
| `plugins/our-free-model/packages/` | 可选独立服务与桌面前端 |
| `plugins/our-free-model/worker/` | 可选网关工具 |

<a id="limitations"></a>

## 限制

导入此插件不保证任何第三方模型、账号登录、额度活动或远程服务当前可用。提供商账号、授权、额度和条款仍是前提条件。请在计划使用的机器和账号上执行首次调用步骤；目录条目、构建成功或离线测试均不代表真实提供商调用结果。

随附工作台的 Windows 限制并不适用于所有插件路由。本地推理性能、上下文容量、工具调用和图片输入取决于模型服务器与硬件。对于远程路由，提示词会离开本机并发送给所选上游；发送私有数据前，请查看插件显示的提供商信息和条款。
