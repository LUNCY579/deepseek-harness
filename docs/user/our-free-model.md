# Experiment with Harness and Our Free Model

English | [中文](our-free-model.zh.md)

## Summary

This guide takes a fresh checkout to a model response in the Harness interface, then connects local models, API-key providers, account channels, and other clients. The plugin is included in `plugins/our-free-model/`; the [root quick start](../../README.md#run) is the shortest path to the combined application.

## Contents

- [Prerequisites](#prerequisites)
- [Start the combined application](#start-the-combined-application)
- [Make a first call and start a conversation](#make-a-first-call-and-start-a-conversation)
- [Connect a local model](#connect-a-local-model)
- [Connect an API-key provider](#connect-an-api-key-provider)
- [Use the plugin from another app](#use-the-plugin-from-another-app)
- [Feature setup reference](#feature-setup-reference)
- [Troubleshooting](#troubleshooting)
- [Edit and check](#edit-and-check)
- [Source and update ownership](#source-and-update-ownership)
- [Limitations](#limitations)

## Prerequisites

Install Git 2.26 or newer, a full Node.js 24.9 or newer distribution, and the pnpm version pinned in the root `package.json` (`11.28.5`). The [root quick start](../../README.md#run-from-source) includes the installation commands. A binary-only Node installation is insufficient for the macOS/Linux source build: the build needs `include/node/node_api.h` beside that installation's `bin` directory.

| Platform | Source-build requirements |
|---|---|
| macOS | A C compiler, normally supplied by Xcode Command Line Tools, and the Node development headers. |
| Linux | A C compiler available as `cc` and the Node development headers. Native dependencies may also need Python 3, `make`, and a C++ compiler when a prebuilt binary is unavailable. |
| Native Windows | A supported Node installation; if a native dependency needs compilation, install Python 3 and Visual Studio C++ Build Tools. The optional bundled Magpie engine targets Windows x64. |
| WSL 2 | Use the Linux toolchain and keep the checkout in the Linux filesystem. Install dependencies separately from a native Windows checkout. WSL is optional and does not turn a Linux process into the Windows Magpie host. |

Installation downloads dependencies. Hosted model calls need network access; local inference needs a separately installed, running model server with a model already downloaded and loaded. This repository does not install model weights or grant upstream accounts and quotas. Python SDKs, external MCP servers, and optional desktop frontends have their own prerequisites in their linked guides.

## Start the combined application

From the repository root, install dependencies, build, and start:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Open the complete URL printed in the terminal, including its login token, and keep the terminal process running. The server normally listens at `http://127.0.0.1:3080`. Use `pnpm start --no-open` when you want to open the page yourself, or `pnpm start --port 3081` if port 3080 is occupied. Stop the server with Ctrl+C.

`pnpm start` loads the [local plugin overlay](https://github.com/LUNCY579/deepseek-harness/blob/master/apps/cli/config/examples/our-free-model.patch.yml). The root install supplies its Harness dependencies and restores the optional Magpie executable from checked-in archive parts with SHA-256 verification. Do not install a second copy of the plugin into this profile.

For an experiment with separate settings and credentials, choose an isolated `DSH_HOME` before launching. On macOS or Linux:

```sh
DSH_HOME="$PWD/.dsh-experiments/our-free-model" pnpm start --no-open
```

In PowerShell:

```powershell
$env:DSH_HOME = Join-Path $PWD '.dsh-experiments/our-free-model'
pnpm start --no-open
```

Use the same home on subsequent launches to retain the experiment's configuration. Without an override, the plugin stores its state in `~/.dsh/our-free-model`. The experiment directory above is Git-ignored; it contains private settings and credentials and should not be shared with the source.

Inspect composition without starting the application:

```sh
pnpm run start:our-free-model --dump-config
```

The resolved configuration contains one `our-free-model` entry with `distribution: managed`. A duplicate-entry error means this home already has another installed copy; use a fresh experiment home or remove that duplicate from the profile.

## Make a first call and start a conversation

Open **Settings → Our Free Model → Free models**. Dismiss introductory panels if shown. Wait for the roster, or choose **Refresh roster**. The anonymous routes are enabled by default; the **Plugin settings → Enable free models** switch restores them if you disabled them earlier.

Click **Text test** on a model card. It sends `Reply with exactly: OK` through that model's plugin route. The card shows timing and the returned **Response**, up to 2,000 characters. The test is a real generation request and uses the provider's quota. A failure includes the returned reason; try another model or use a provider you control. **Listed · not tested** is a catalog state, not evidence of a successful call.

For a custom prompt, find **Workspaces** in the Harness sidebar and click **Add workspace**. Choose a project or empty experiment folder and click **Open**; use **Choose workspace** to select a folder already added. Start a new session, open the composer model picker, and choose the model under **Our Free Model**. Send:

> Reply with exactly: Hello from the integrated plugin.

Success means the assistant reply appears in the conversation while the composer names your selected plugin model. The standalone text test does not create a chat session and does not select the model for you. The chat composer requires a workspace even for a text-only prompt; the plugin's text test does not.

To exercise workspace tools, ask the model to list files without changing them and review any permission prompts. Then try the task you want to perform in that workspace. Model selection does not grant tool or image capability: the model and its upstream protocol must support each capability. The [Web UI guide](guide/index.md) and [model configuration guide](guide/providers.md) explain normal Harness sessions and provider selection.

## Connect a local model

Use this path for a model served on your own machine, including a compatible fine-tuned model. Start your inference server separately, load the model, and confirm its exact model ID in that server. The plugin sends requests to the server; it does not load the weights itself.

1. Open **Settings → Our Free Model → Aggregate**.
2. Search for **LM Studio**, **Ollama**, or **LLaMA.cpp**, then click **Connect** on that provider's card.
3. Leave **Enabled** on. Set **Base URL** to the server's OpenAI-compatible API root, including `/v1`. Leave **API key** empty for these keyless local provider entries.
4. Enter the exact loaded model ID in **Model override**, without the plugin's provider prefix. Multiple IDs can be separated by commas or newlines. Click **Add**; later edits use **Save**.
5. Start a Harness chat in a selected workspace and choose that provider's model under **Our Free Model**. Send a short plain-text prompt first.

| Provider card | Registry default API root | Plugin model ID |
|---|---|---|
| LM Studio | `http://localhost:1234/v1` | `lmstudio/<loaded-model-id>` |
| Ollama | `http://localhost:11434/v1` | `ollama/<loaded-model-id>` |
| LLaMA.cpp | `http://localhost:8080/v1` | `llamacpp/<loaded-model-id>` |

These are the plugin registry's defaults, not a promise about your server's configured port. Use the endpoint and model ID that your server actually exposes. The local entries have no declared model-listing URL, so **Discover models** and the provider's **Test** do not validate them; entering **Model override** explicitly is required. An empty local model list contributes no selectable model.

For a small local model, lower **Free models → Plugin settings → Output ceiling per call (tokens)** to a value your server accepts, such as `512` for the first short experiment, and click **Apply**. The default request budget can exceed a small server's configured context or output limit.

Here `localhost` means the machine running Harness, which may differ from the browser's machine. For an endpoint that requires an API key, use the plugin's custom API import below. The [Harness custom model API setup](guide/providers.md) is also available as a separate provider route.

## Connect an API-key provider

Open **Our Free Model → Aggregate**, find the provider, and choose **Connect**. Enter your **API key**, leave **Enabled** on, and set **Base URL** only when your account or gateway needs an endpoint different from the displayed default. Enter **Model override** when you need a specific model ID; otherwise the provider's declared catalog is used. Click **Add** or **Save** before testing.

The provider's **Test** checks its model listing where supported; it does not generate text. **Not verifiable** can mean the provider declares no listing, rather than a rejected key. **Discover models** can populate IDs for providers that declare a listing. To confirm inference, select the saved model in a Harness conversation and send a short prompt.

An empty key field preserves a saved key. **Clear the stored key** deletes it. Providers labeled **Not drivable** require OAuth or cloud credentials that this Aggregate page cannot complete; use their supported account flow or the normal [Harness model settings](guide/providers.md). API-key providers can charge for generation according to your account.

For an authenticated custom endpoint absent from the registry, open **Model workspace → Subscriptions → Import account** and select **API** as the provider. Enter an account label, exact **Model IDs**, **Base URL**, **API format** (`openai-chat`, `openai-responses`, or `anthropic-messages`), and a nonempty **API Key**, then click **Confirm import**. Select the resulting model under **Our Free Model** and make a chat request. This path stays inside the plugin and does not need the Windows workbench.

A direct DeepSeek API account is also available through **Settings → Models → DeepSeek**. That is an alternative Harness route; choose an **Our Free Model** model when the purpose of the test is to exercise the integrated plugin.

## Use the plugin from another app

Keep Harness running and configure at least one working model first. The plugin exposes two separately configured gateway interfaces; use the one that serves the models you configured.

1. For the plugin's forward service, open **Free models → Local forward (OpenAI compatible)**, turn on **Enable the forward port**, and click **Apply**.
2. Copy the actual **Base URL** and **API key** shown in that section. If the preferred port was occupied, use the actual port shown after startup.
3. Open **Gateway → Connect a client** for generated client configurations and the served model IDs. Configure the other app with that URL, key, and one exact model ID from this listener's list.
4. For account-channel models managed under **EAC router**, use **Gateway → Channel gateway (OpenAI compatible) → Enable gateway**, then copy that gateway's own endpoint and key. These credentials and ports are separate from **Local forward**.

The forward service supports model listing and OpenAI Chat Completions/Responses; it also exposes Anthropic Messages routes. A client must use a protocol supported by the listener it connects to. Enabling the gateway is unnecessary for chat inside Harness, which calls the plugin directly.

For another device, enable the relevant listener's LAN option and use its displayed network address and separate relay key. Loopback addresses are only reachable on the same machine. Share a LAN key only with trusted clients: those clients can spend the connected accounts' quotas. Leave LAN access off for a single-machine experiment.

## Feature setup reference

There is no single switch that provisions every external service. The combined application includes the UI and routing code; use the matching setup path for the features you need.

| Feature | Setup and verification |
|---|---|
| Anonymous free models | **Free models** → refresh roster → **Text test**. Provider availability and quotas can change; no account or DeepSeek key is required for these routes. |
| EAC model pool | **EAC models** → **Sign in with GitHub**, complete the service's authorization, then test a model. Eligibility and service availability are controlled by the upstream. |
| Account channels | **EAC router** → expand the provider → **Add account** → complete its login → enable the account/model. Use that card's test and balance controls, then make a chat request. Each provider requires its own supported account and entitlement. |
| API keys and local servers | **Aggregate** → connect/configure a provider as described above. Local entries require explicit model IDs. |
| Existing subscription credentials | **Model workspace → Subscriptions** → **Find local accounts** or **Import account** → review the provider and model IDs → **Confirm import**. Import only accounts you are authorized to use. An imported account still needs valid credentials and quota. |
| Optional embedded workbench | **Model workspace → Workbench** starts the bundled Magpie engine. The checked-in executable is Windows x64 only; ordinary Harness chat, Aggregate providers, and the subscriptions panel do not require this workbench. |
| Fallback and other routing strategies | **Routing** → create a named chain, add configured model IDs, choose a strategy, and save. Select its `combo:<name>` model in chat. A chain with no usable member cannot serve a request. |
| Request compaction and response style | **Token savers** controls tool-output compaction, prompt shaping, and local answers. These settings can change the request or answer; disable them when an experiment needs the original request. |
| Usage and errors | **Dashboard** and **Request log** show recorded channel usage and failures; the **Free models** page also contains its own usage dashboard. Inspect these after a call, rather than treating a model listing as a connection test. |
| Proxy outlet | **Free models → Egress outlet (subscription routing)** accepts a single proxy or a subscription. Subscription mode requires a local mihomo executable. Configure this only when your network needs it. |
| Other Harness functionality | Workspace file tools follow the chosen session's permissions. Optional integrations have their own setup: [MCP memory](guide/mcp-memory.md), [schedules](guide/schedule.md), [plugin market](guide/plugin-market.md), and [Python SDK](guide/python-sdk.md). |
| Optional standalone/desktop frontends | Their source and separate setup are included under `plugins/our-free-model/packages/`; follow the [imported plugin documentation](https://github.com/LUNCY579/deepseek-harness/blob/master/plugins/our-free-model/README_EN.md). `pnpm start` launches the combined Harness Web UI. |

Gemini OAuth client secrets must be supplied through environment variables before starting Harness. Set `OUR_FREE_MODEL_GEMINI_CLIENT_SECRET` when imported Gemini CLI subscription credentials need token refresh. For the Gemini account channel, set `CMDC_PAK_GOOGLE_CLIENT_SECRET` before login or token refresh. Both flows retain their default public client IDs; the account channel also accepts `CMDC_PAK_GOOGLE_CLIENT_ID` for a matching custom OAuth client. Anonymous providers, other providers, and already-valid Gemini access tokens do not require these secrets.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `pnpm` is missing or the version differs | Install the pin from the root quick start, or activate your Corepack-managed pnpm. Run `pnpm --version` inside the checkout. |
| `Node-API headers missing` during build | Use a full official Node distribution or a version-manager installation that includes development headers beside the running Node binary. A copied standalone Node executable lacks those headers. |
| `cc` is missing or native compilation fails | Install the platform tools from [Prerequisites](#prerequisites). Keep Node, dependencies, and the checkout in the same OS environment. |
| Build rejects TypeScript stripping | Remove `--no-experimental-strip-types` from your launch settings and use a supported full Node build; see the [development prerequisites](../development.md). |
| Web artifacts or package modules are missing | Finish `pnpm install --frozen-lockfile` and `pnpm run build` before `pnpm start`. A launch command does not rebuild the whole repository. |
| No **Our Free Model** settings page | Confirm you launched `pnpm start` from this checkout, not upstream `npx` or plain `start:web`. Inspect `--dump-config` for the local plugin entry, then check the server log. |
| Chat input is unavailable | Select a workspace with **Choose workspace**, then select an available model. Plugin text tests do not require a workspace. |
| Free roster is empty or a call gets 401, 403, 429, or times out | Read the error, check provider credentials/entitlement/quota and network access, then refresh or choose another model. Repeated retries cannot create access or quota. Configure a local model or your own API provider when the shared service is unavailable. |
| Local provider saves but has no selectable models | Set the exact loaded ID in **Model override**. The local registry entries do not support automatic discovery. Confirm the server is running and the base URL includes `/v1`. |
| A model replies to text but fails with tools or images | Check the model/server capability and protocol. Test plain text first, then each capability separately; do not assume every catalog entry supports agent tasks. |
| Gateway client reports unauthorized or model not found | Copy the key and model ID from the same listener as the configured URL. The channel gateway, local forward, and LAN relay have separate credentials. |
| Workbench cannot start on macOS/Linux | The bundled Magpie binary is Windows x64 only. Use normal Harness chat and the other plugin pages on these platforms. |
| Magpie archive restore reports missing/corrupt parts | Restore the reported archive parts from Git and rerun `node scripts/prepare-our-free-model.mjs`. If an existing executable differs, the script preserves it; review and move it aside explicitly before retrying. |
| Plugin upgrade is unavailable | This checkout uses managed mode. Update through Git and rebuild using the steps below. |

If a build process is killed because the machine runs out of memory, retry with fewer concurrent build steps. On macOS/Linux:

```sh
DSH_GATE_CONCURRENCY=1 pnpm run build
```

In PowerShell:

```powershell
$env:DSH_GATE_CONCURRENCY = '1'
pnpm run build
```

This reduces concurrent work; it does not reduce the memory needed by an individual compiler or bundle step.

## Edit and check

Run `pnpm run dev:our-free-model` for the combined development workflow. Harness client bundles rebuild through the existing Web development process. Restart the process after editing the plugin's host JavaScript; managed mode disables its own hot-reload mechanism. Reload the browser after changing the plugin's browser entry.

Run the plugin's offline contributor suite and adapter typecheck from the repository root:

```sh
pnpm run test:our-free-model
pnpm run typecheck:our-free-model
```

Contributor checks do not require the original publisher's release-signing key. Signed release checks and live-provider probes are separate. Validate a configured real provider with a text test or chat request, then test each tool or image capability you need; offline success does not establish current provider availability. The [development guide](../development.md) covers Harness checks and the normal build workflow.

## Source and update ownership

Stop the server before updating. Review your local edits before pulling, then run:

```sh
git pull --ff-only
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Use the same `DSH_HOME` as before to retain your settings. Managed mode leaves code updates to this repository and disables the plugin's upstream self-updater, announcement polling, and self hot reload. Keep the plugin's MIT license and bundled third-party notices with their source. The imported release records describe the upstream release, not a signed release of this combined fork.

| Location | Work owned there |
|---|---|
| `packages/`, `apps/` | Harness services, profiles, and UI |
| `plugins/our-free-model/index.js`, `src/`, `client.js` | Plugin host, model routing, and browser UI |
| `plugins/our-free-model/vendor/` | Imported channel implementation and supporting assets |
| `plugins/our-free-model/packages/` | Optional standalone and desktop frontends |
| `plugins/our-free-model/worker/` | Optional gateway tools |

## Limitations

Importing this plugin does not guarantee that any third-party model, account login, quota offer, or remote service is currently available. Provider accounts, authorizations, quotas, and terms remain prerequisites. Run the first-call steps from the machine and account you will use; a catalog entry, successful build, or offline test is not a live-provider result.

The bundled workbench's Windows restriction does not apply to all plugin routes. Local inference performance, context capacity, tool calling, and image input depend on your model server and hardware. For hosted routes, prompts leave your machine for the selected upstream; inspect the plugin's displayed provider information and terms before sending private data.
