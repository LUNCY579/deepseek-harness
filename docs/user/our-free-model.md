# Experiment with Harness and Our Free Model

English | [中文](our-free-model.zh.md)

## Summary

This fork lets you edit Harness and Our Free Model in one checkout and launch them together. The complete plugin source, tests, optional frontends, and gateway tools live under `plugins/our-free-model/`; the original plugin fork remains a separate upstream reference.

## Contents

- [Start the combined application](#start-the-combined-application)
- [Edit and check](#edit-and-check)
- [Source and update ownership](#source-and-update-ownership)
- [Limitations](#limitations)

## Start the combined application

Use Node.js 24.9 or newer and the pnpm version pinned in the root `package.json`. From this repository's root, install dependencies and build:

```sh
pnpm install
pnpm run build
pnpm start
```

The root `pnpm install` restores the optional Magpie executable from 17 checked-in compressed archive parts and verifies its SHA-256 checksum, without downloading the executable.

`pnpm start` launches the Web profile with the [local plugin overlay](https://github.com/LUNCY579/deepseek-harness/blob/master/apps/cli/config/examples/our-free-model.patch.yml). It loads the host entry and discovers the browser entry from the plugin's own manifest. The root install supplies local Harness dependencies; do not install another copy of this plugin into the same profile.

For an experiment with separate settings and credentials, choose an isolated `DSH_HOME` before launching. On macOS or Linux:

```sh
DSH_HOME="$PWD/.dsh-experiments/our-free-model" pnpm start --no-open
```

In PowerShell:

```powershell
$env:DSH_HOME = Join-Path $PWD '.dsh-experiments/our-free-model'
pnpm start --no-open
```

The experiment directory is Git-ignored. The command prints the Web UI address. Inspect composition without starting the application:

```sh
pnpm run start:our-free-model --dump-config
```

The resolved configuration contains one `our-free-model` entry with `distribution: managed`. If the loader reports a duplicate entry, use a fresh experiment home or remove the separately installed copy from that profile.

## Edit and check

Run `pnpm run dev:our-free-model` for the combined development workflow. Harness client bundles rebuild through the existing Web development process. Restart the process after editing the plugin's host JavaScript; its own hot-reload mechanism is disabled in managed mode.

Run the plugin's offline contributor suite and adapter typecheck from the repository root:

```sh
pnpm run test:our-free-model
pnpm run typecheck:our-free-model
```

Contributor checks do not require the original publisher's release-signing key. Signed release checks and live-provider probes remain separate; offline success does not establish current provider availability. For changes to generated plugin assets or its optional frontends, follow the [imported plugin documentation](https://github.com/LUNCY579/deepseek-harness/blob/master/plugins/our-free-model/README_EN.md).

## Source and update ownership

| Location | Work owned there |
|---|---|
| `packages/`, `apps/` | Harness services, profiles, and UI |
| `plugins/our-free-model/index.js`, `src/`, `client.js` | Plugin host, model routing, and browser UI |
| `plugins/our-free-model/vendor/` | Imported channel implementation and supporting assets |
| `plugins/our-free-model/packages/` | Optional standalone and desktop frontends |
| `plugins/our-free-model/worker/` | Optional gateway tools |

Managed mode leaves code updates to this repository. It disables the plugin's upstream self-updater, announcement polling, and self hot reload, while retaining model access. Pull and review source changes through Git; keep the plugin's MIT license and bundled third-party notices with their source. The imported release records describe the upstream release, not a signed release of this combined fork.

## Limitations

Provider-specific accounts, authorization, quotas, and terms still apply. Importing the plugin does not guarantee free service availability. The bundled Magpie engine includes a Windows x64 executable only; that optional component has a narrower platform range than the JavaScript plugin.

Gemini OAuth client secrets must be supplied through environment variables. Set `OUR_FREE_MODEL_GEMINI_CLIENT_SECRET` when imported Gemini CLI subscription credentials need token refresh. For the Gemini account channel, set `CMDC_PAK_GOOGLE_CLIENT_SECRET` before login or token refresh. Both flows retain their default public client IDs; the account channel also accepts `CMDC_PAK_GOOGLE_CLIENT_ID` for a matching custom OAuth client. Anonymous providers, other providers, and already-valid Gemini access tokens do not require these secrets.
