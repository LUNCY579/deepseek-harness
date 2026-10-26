# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

This fork combines Harness and the Our Free Model plugin in one checkout. Follow the source setup below to open the combined Web UI, test a model, and chat through the integrated plugin. The [complete setup guide](docs/user/our-free-model.md) covers local models, API keys, accounts, gateways, troubleshooting, and development.

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from source

Install [Node.js](https://nodejs.org/) **24.9 or newer** and Git **2.26 or newer**. Source builds also need a C compiler and the Node development headers on macOS/Linux; see the [platform prerequisites](docs/user/our-free-model.md#prerequisites) if a native dependency fails to build. Use the pnpm version pinned in `package.json`:

```sh
npm install --global pnpm@11.28.5
git clone https://github.com/LUNCY579/deepseek-harness.git
cd deepseek-harness
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

If pnpm is already managed by Corepack, use that installation and check `pnpm --version` from this directory against the pin. Run all remaining commands from the repository root. Keep the terminal running while using the interface.

Open the complete URL printed in the terminal, including its login token. The server normally listens at `http://127.0.0.1:3080`. A local launch opens the browser automatically; `pnpm start --no-open` prints the address without opening it. For a different port, use `pnpm start --port 3081`.

`pnpm start` loads the checked-in plugin from `plugins/our-free-model/`. No second checkout, separate plugin installation, or DeepSeek API key is needed to try its anonymous model routes. Each upstream service still controls availability, quotas, and access. The install also restores and verifies the bundled Windows-only Magpie executable; ordinary plugin chat does not require that optional engine.

### Make your first model call

1. Open **Settings → Our Free Model → Free models**. Dismiss the introductory panels if shown. Wait for the model roster, or choose **Refresh roster**.
2. On a model card, click **Text test**. This sends the displayed prompt, `Reply with exactly: OK`, to that model.
3. Read the returned text in **Response** beneath the timing results. A listed model is not necessarily reachable; if the call fails, use the displayed error, try another model, or configure your own provider below.

The text test needs no workspace. It makes a real request and can consume the selected provider's quota. Its response panel shows up to 2,000 characters; use normal chat for your own prompts and longer answers.

### Chat through the plugin

1. In the Harness sidebar, find **Workspaces** and click **Add workspace** (the folder-plus button). Choose a project or empty experiment folder and click **Open**. Use **Choose workspace** to select a folder you have already added. The chat composer stays unavailable until you select a workspace.
2. Start a new session. Open the model picker beside the composer and choose the tested model under **Our Free Model**.
3. Send `Reply with exactly: Hello from the integrated plugin.` and check the assistant reply. The model shown in the composer must be the plugin model you selected.
4. To try file tools, ask `List the files in this workspace without changing them.` Review any permission prompts. Tool calling and image support depend on the selected model; a successful text reply does not establish those capabilities.

Selecting a model also sets the default for new sessions; sessions that have already sent a request keep their recorded selection. See the [Web UI guide](docs/user/guide/index.md) for workspace and permission behavior.

### Configure the remaining features

| What you want to use | Setup path |
|---|---|
| A local model, including your own served model | **Our Free Model → Aggregate** → connect **LM Studio**, **Ollama**, or **LLaMA.cpp**; enter the server's `/v1` base URL and exact loaded model ID. [Local model steps](docs/user/our-free-model.md#connect-a-local-model). |
| Your own provider API key | **Our Free Model → Aggregate** → connect the provider, enter the key, save, then select its model in chat. [API-key steps](docs/user/our-free-model.md#connect-an-api-key-provider). |
| Account channels, subscriptions, or the optional workbench | Follow the [feature setup reference](docs/user/our-free-model.md#feature-setup-reference) for the account and platform each feature requires. |
| An API endpoint for another app | Enable **Free models → Local forward**, then use **Gateway → Connect a client** for the actual URL, key, and examples. [Gateway steps](docs/user/our-free-model.md#use-the-plugin-from-another-app). |
| Model routing, token settings, usage, and request errors | Use **Routing**, **Token savers**, **Dashboard**, and **Request log** in the plugin. [Feature setup reference](docs/user/our-free-model.md#feature-setup-reference). |

For an isolated experiment home, installation problems, empty model lists, provider failures, or updates, continue with the [complete setup guide](docs/user/our-free-model.md).

### Run the upstream application from `npm`

The upstream published application remains available separately:

```sh
npx @deepseek-ai/dsh web
```

That command installs the published upstream package; it does not run this checkout or load this fork's integrated plugin. Use `pnpm start` above to test the combined repository.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:our-free-model` starts the combined development workflow. See the [experiment guide](docs/user/our-free-model.md#edit-and-check) for restart requirements and offline checks. The existing `dev:web` and Make targets remain available for Harness development.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
