# 使用 Harness 与 Our Free Model 做实验

[English](our-free-model.md) | 中文

## 摘要

本 fork 可让你在同一份源码中编辑 Harness 与 Our Free Model，并一起启动。完整插件源码、测试、可选前端和网关工具位于 `plugins/our-free-model/`；原插件 fork 仍作为独立的上游参考保留。

## 目录

- [启动组合应用](#start-the-combined-application)
- [编辑与检查](#edit-and-check)
- [源码与更新管理](#source-and-update-ownership)
- [限制](#limitations)

<a id="start-the-combined-application"></a>

## 启动组合应用

请使用 Node.js 24.9 或更新版本，以及根目录 `package.json` 固定的 pnpm 版本。在本仓库根目录安装依赖并构建：

```sh
pnpm install
pnpm run build
pnpm start
```

根目录的 `pnpm install` 会从仓库内的 17 个压缩归档分片恢复可选的 Magpie 可执行文件并校验其 SHA-256，无需下载该可执行文件。

`pnpm start` 通过[本地插件覆盖配置](https://github.com/LUNCY579/deepseek-harness/blob/master/apps/cli/config/examples/our-free-model.patch.yml)启动 Web profile。它会加载 host 入口，并从插件自身的清单发现浏览器入口。根目录安装会提供本地 Harness 依赖；请勿在同一 profile 中再安装一份该插件。

如果实验需要独立的设置和凭据，请在启动前选择隔离的 `DSH_HOME`。在 macOS 或 Linux 中：

```sh
DSH_HOME="$PWD/.dsh-experiments/our-free-model" pnpm start --no-open
```

在 PowerShell 中：

```powershell
$env:DSH_HOME = Join-Path $PWD '.dsh-experiments/our-free-model'
pnpm start --no-open
```

实验目录已被 Git 忽略。命令会打印 Web UI 地址。如需只检查组合配置而不启动应用：

```sh
pnpm run start:our-free-model --dump-config
```

解析后的配置包含一个 `our-free-model` 条目，其设置为 `distribution: managed`。如果 loader 报告条目重复，请使用新的实验目录，或从该 profile 中移除单独安装的插件副本。

<a id="edit-and-check"></a>

## 编辑与检查

运行 `pnpm run dev:our-free-model` 可进入组合开发流程。Harness client bundle 会通过现有 Web 开发流程重新构建。修改插件 host JavaScript 后请重启进程；managed 模式会禁用插件自身的热重载机制。

从仓库根目录运行插件的离线贡献者测试套件与 adapter 类型检查：

```sh
pnpm run test:our-free-model
pnpm run typecheck:our-free-model
```

贡献者检查不需要原发布者的发布签名密钥。签名发布检查和真实提供方探测仍独立执行；离线检查通过并不能证明提供方当前可用。修改插件生成资产或可选前端时，请遵循[导入的插件文档](https://github.com/LUNCY579/deepseek-harness/blob/master/plugins/our-free-model/README_EN.md)。

<a id="source-and-update-ownership"></a>

## 源码与更新管理

| 位置 | 负责的工作 |
|---|---|
| `packages/`, `apps/` | Harness 服务、profile 和 UI |
| `plugins/our-free-model/index.js`, `src/`, `client.js` | 插件 host、模型路由和浏览器 UI |
| `plugins/our-free-model/vendor/` | 导入的渠道实现和支持资产 |
| `plugins/our-free-model/packages/` | 可选的独立服务与桌面前端 |
| `plugins/our-free-model/worker/` | 可选网关工具 |

managed 模式将代码更新交给本仓库管理。它会禁用插件的上游自更新、公告轮询和自身热重载，同时保留模型访问功能。请通过 Git 拉取和审查源码变更，并将插件的 MIT 许可证及随附第三方声明保留在对应源码旁。导入的发布记录描述的是上游发布，并非本合并 fork 的签名发布。

<a id="limitations"></a>

## 限制

提供方各自的账号、授权、额度和条款仍然适用。导入插件并不保证免费服务持续可用。随附的 Magpie 引擎仅包含 Windows x64 可执行文件；该可选组件支持的平台范围比 JavaScript 插件更窄。

Gemini OAuth 客户端密钥必须通过环境变量提供。导入的 Gemini CLI 订阅凭据需要刷新令牌时，请设置 `OUR_FREE_MODEL_GEMINI_CLIENT_SECRET`。使用 Gemini 账号渠道登录或刷新令牌前，请设置 `CMDC_PAK_GOOGLE_CLIENT_SECRET`。这两种流程均保留默认的公开客户端 ID；账号渠道还支持通过 `CMDC_PAK_GOOGLE_CLIENT_ID` 指定与密钥匹配的自定义 OAuth 客户端。匿名提供方、其他提供方以及仍有效的 Gemini 访问令牌均不需要这些密钥。
