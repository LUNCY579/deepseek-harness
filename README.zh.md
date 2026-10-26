# DeepSeek Harness

[English](README.md) | 中文

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

文档：[https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

本 fork 将 Harness 与 Our Free Model 插件合并到同一份源码中。按照下方源码安装步骤，即可打开组合 Web UI、测试模型，并通过集成插件聊天。[完整设置指南](docs/user/our-free-model.zh.md)介绍本地模型、API Key、账号、网关、故障排查和开发。

## 开发者预览

DeepSeek Harness 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

<a id="run-from-source"></a>

### 从源码运行

安装 [Node.js](https://nodejs.org/) **24.9 或更新版本**以及 Git **2.26 或更新版本**。macOS/Linux 的源码构建还需要 C 编译器和 Node 开发头文件；原生依赖构建失败时，请参阅[平台前提条件](docs/user/our-free-model.zh.md#prerequisites)。使用 `package.json` 固定的 pnpm 版本：

```sh
npm install --global pnpm@11.28.5
git clone https://github.com/LUNCY579/deepseek-harness.git
cd deepseek-harness
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

如果已经通过 Corepack 管理 pnpm，请继续使用该安装方式，并在此目录运行 `pnpm --version`，确认与固定版本一致。后续命令均在仓库根目录执行。使用界面时请保持终端进程运行。

打开终端打印的完整 URL，包括其中的登录令牌。服务器通常监听 `http://127.0.0.1:3080`。本机启动会自动打开浏览器；`pnpm start --no-open` 只打印地址而不打开浏览器。需要其他端口时，使用 `pnpm start --port 3081`。

`pnpm start` 会加载仓库内 `plugins/our-free-model/` 中的插件。尝试其匿名模型路由无需再次克隆、单独安装插件或提供 DeepSeek API Key。各上游服务仍决定可用性、额度和访问权限。安装还会恢复并校验随附的 Windows 专用 Magpie 可执行文件；普通插件聊天不需要该可选引擎。

<a id="make-your-first-model-call"></a>

### 发起第一次模型调用

1. 打开**设置 → Our Free Model → 免费模型**。如显示介绍面板，关闭后继续。等待模型列表，或点击**刷新清单**。
2. 在模型卡片上点击**文本测试**。该操作会向模型发送界面显示的提示词 `Reply with exactly: OK`。
3. 在耗时结果下方的**模型回复**中查看返回文本。列出的模型不一定能连接；如果调用失败，请根据显示的错误排查、尝试其他模型，或按下方说明配置自己的提供商。

文本测试无需工作区。它会发起真实请求，可能消耗所选提供商的额度。回复面板最多显示 2,000 个字符；自己的提示词和更长的回答请通过正常聊天发送。

<a id="chat-through-the-plugin"></a>

### 通过插件聊天

1. 在 Harness 侧栏找到**工作区**，点击**添加工作区**（带加号的文件夹按钮）。选择项目目录或空实验目录，然后点击**打开**。已有目录可通过**选择工作区**选中。选择工作区之前，聊天输入框不可用。
2. 新建会话。打开输入框旁的模型选择器，在 **Our Free Model** 下选择刚才测试的模型。
3. 发送 `Reply with exactly: Hello from the integrated plugin.`，并检查助手回复。输入框显示的模型应为你选择的插件模型。
4. 如需尝试文件工具，发送 `List the files in this workspace without changing them.`，并审查出现的权限提示。工具调用和图片支持取决于所选模型；文字回复成功并不证明具备这些能力。

选择模型还会设置新会话的默认值；已发送请求的会话保留其记录的选择。工作区和权限行为详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="configure-the-remaining-features"></a>

### 配置其余功能

| 要使用的功能 | 设置路径 |
|---|---|
| 本地模型，包括自己部署的模型 | **Our Free Model → 聚合渠道** → 连接 **LM Studio**、**Ollama** 或 **LLaMA.cpp**；填写服务器的 `/v1` 基础地址和已加载模型的准确 ID。[本地模型步骤](docs/user/our-free-model.zh.md#connect-a-local-model)。 |
| 自己的提供商 API Key | **Our Free Model → 聚合渠道** → 连接提供商，输入密钥并保存，然后在聊天中选择其模型。[API Key 步骤](docs/user/our-free-model.zh.md#connect-an-api-key-provider)。 |
| 账号渠道、订阅账号或可选工作台 | 按照[功能设置参考](docs/user/our-free-model.zh.md#feature-setup-reference)配置各功能所需的账号和平台。 |
| 供其他应用使用的 API 端点 | 启用**免费模型 → 本地转发**，然后在**网关设置 → 接入客户端**中查看实际 URL、密钥和示例。[网关步骤](docs/user/our-free-model.zh.md#use-the-plugin-from-another-app)。 |
| 模型路由、token 设置、用量和请求错误 | 使用插件内的**路由**、**省 Token**、**数据看板**和**运行日志**。[功能设置参考](docs/user/our-free-model.zh.md#feature-setup-reference)。 |

如需隔离实验目录、解决安装问题、空模型列表或提供商错误，或更新应用，请继续阅读[完整设置指南](docs/user/our-free-model.zh.md)。

<a id="run-the-upstream-application-from-npm"></a>

### 通过 `npm` 运行上游应用

仍可单独使用上游发布的应用：

```sh
npx @deepseek-ai/dsh web
```

该命令会安装上游发布的包，不会运行本 checkout，也不会加载此 fork 的集成插件。测试组合仓库请使用上方的 `pnpm start`。

## 社区与支持

- 通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群！扫描下方二维码填写入群问卷，小助手会定期发送入群邀请。

<table>
  <thead>
    <tr>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

`pnpm run dev:our-free-model` 会启动组合开发流程。重启要求和离线检查见[实验指南](docs/user/our-free-model.zh.md#edit-and-check)。现有的 `dev:web` 和 Make target 仍可用于 Harness 开发。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 引用

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
