/**
 * The source overlay must compose once and resolve both plugin halves against
 * this checkout. Public CLI output covers profile assembly; the isolated
 * Loader probe exposes registration and managed-update evidence that a config
 * dump cannot provide. No provider credentials or live inference are used.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { describe, expect, it } from 'vitest'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, resolveExampleLaunch } from '@deepseek-ai/dsh-loader-smoke'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const overlay = join(root, 'apps/cli/config/examples/our-free-model.patch.yml')
const entry = pathToFileURL(join(root, 'plugins/our-free-model/index.js')).href

// A fresh native process uses the same ESM source resolution as `pnpm dsh`.
// In particular, the shipped channel bundle must import the real current
// Cordis/LLM/credentials modules, without the plugin's test-contract stubs.
const runtimeProbe = String.raw`
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { boot, loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'
import LlmRuntime from '@deepseek-ai/dsh-llm'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import ClientModuleRegistry from '@deepseek-ai/dsh-client-modules'
import WebServer from '@deepseek-ai/dsh-host-webserver'
import { MemoryCredentials } from ${JSON.stringify(pathToFileURL(join(root, 'packages/credentials/credentials/tests/memory.ts')).href)}

const home = process.env.DSH_HOME
assert.ok(home)
const pluginDir = resolve('plugins/our-free-model')
const overlay = resolve('apps/cli/config/examples/our-free-model.patch.yml')
const watchedFiles = ['index.js', 'client.js', 'package.json', 'src/updater.js']
const hashes = () => watchedFiles.map(file => createHash('sha256').update(readFileSync(join(pluginDir, file))).digest('hex'))
const before = hashes()
const networkRequests = []
const upstream = createServer((request, response) => {
  assert.equal(request.method, 'GET', 'the smoke test must not request inference')
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ data: [] }))
})
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve))
const upstreamOrigin = 'http://127.0.0.1:' + upstream.address().port
process.env.OUR_FREE_MODEL_BASE = upstreamOrigin
process.env.OUR_FREE_MODEL_KILO_BASE = upstreamOrigin
process.env.DSH_CHANNEL_PACK_STATE_DIR = join(home, 'channel-pack')
process.env.DSH_OPENAI_GATEWAY_ENABLED = '0'
process.env.QODER_MACHINE_TOKEN_PATH = join(home, 'no-machine-token.json')
process.env.QODER_RUNTIME_INFO = join(home, 'no-runtime-info.exe')

mkdirSync(join(home, 'our-free-model'), { recursive: true })
writeFileSync(join(home, 'our-free-model/settings.json'), JSON.stringify({
  forward: { enabled: false },
  chanGateway: { enabled: false },
  magpieEnabled: false,
}))
const config = join(home, 'smoke.cordis.yml')
writeFileSync(config, '[]\n')
const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  networkRequests.push(url.href)
  if (url.origin !== upstreamOrigin) throw new Error('live network disabled in integration smoke: ' + url.origin)
  return realFetch(input, init)
}

let ctx
try {
  ctx = await boot('our-free-model smoke', config, loadOverlayPatches('our-free-model smoke', overlay), async context => {
    await context.plugin(LlmRuntime)
    await context.plugin(CommandRuntime)
    await context.plugin(MemoryCredentials)
    await context.plugin(WebServer, { host: '127.0.0.1', port: 0 })
  })
  const rows = [...ctx.loader.entries()].filter(row => row.options.id === 'our-free-model')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].options.name, pathToFileURL(join(pluginDir, 'index.js')).href)
  assert.equal(rows[0].options.config.distribution, 'managed')
  assert.ok(ctx.llm.listProviders().some(provider => provider.id === 'our-free-model'))
  await ctx.plugin(ClientModuleRegistry)
  const browser = ctx.clientModules.graph().entries.filter(row => row.id === 'dsh-our-free-model')
  assert.equal(browser.length, 1)
  assert.equal(browser[0].immediately, true)
  assert.equal(ctx.clientModules.clientPath('dsh-our-free-model'), join(pluginDir, 'client.js'))
  const origin = ctx.webServer.getOrigin()
  const bundle = await ctx.clientModules.fetchBundle(new Request(new URL(browser[0].url, origin)))
  assert.equal(bundle.status, 200)
  assert.ok((await bundle.text()).length > 0)

  const api = async (path, method = 'GET', body) => {
    const response = await realFetch(origin + '/api/our-free-model' + path, {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    })
    return { status: response.status, body: await response.json() }
  }
  const deadline = Date.now() + 10000
  let summary
  do {
    summary = await api('/summary')
    if (summary.body.channels?.state !== 'pending') break
    await delay(25)
  } while (Date.now() < deadline)
  assert.equal(summary.status, 200)
  assert.equal(summary.body.channels?.state, 'ready', JSON.stringify(summary.body.channels))
  assert.equal((await api('/meta')).body.distribution, 'managed')
  assert.deepEqual((await api('/update/status')).body.managed, true)
  for (const action of ['/update/check', '/update/apply', '/reload']) {
    const response = await api(action, 'POST', {})
    assert.equal(response.status, 409, action)
    assert.match(response.body.error, /managed/)
  }
  await api('/settings', 'POST', { distribution: 'self' })
  assert.equal((await api('/meta')).body.distribution, 'managed')
  const announcements = await api('/announcements')
  assert.equal(announcements.body.source, 'managed')
  assert.deepEqual(announcements.body.items, [])
  assert.ok(networkRequests.every(url => new URL(url).origin === upstreamOrigin))
  assert.deepEqual(hashes(), before, 'managed actions must not rewrite the source checkout')
  console.log('OUR_FREE_MODEL_INTEGRATION_OK')
} finally {
  await ctx?.fiber.dispose()
  upstream.closeAllConnections()
  await new Promise(resolve => upstream.close(resolve))
  globalThis.fetch = realFetch
}
`

describe('Our Free Model source integration', () => {
  it('composes exactly one managed plugin through the public Web profile CLI', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-ofm-profile-'))
    try {
      // Source-path resolution is the subject: this integration deliberately
      // loads an editable plugin from the checkout rather than a published package.
      const launch = resolveExampleLaunch({
        srcBin: join(root, 'apps/cli/src/bin.ts'),
        configArgs: ['--profile', 'web', '--patch', overlay, '--dump-config'],
        mode: 'src',
        sourceImport: 'tsx/esm',
        tsconfigPath: join(root, 'tsconfig.json'),
        env: { DSH_HOME: home },
      })
      const result = await execa(launch.command, launch.args, {
        cwd: root,
        env: launch.env,
        timeout: 30_000,
        killSignal: 'SIGKILL',
        reject: false,
      })
      const diagnostic = result.stdout + '\n' + result.stderr
      expect(result.timedOut, diagnostic).toBe(false)
      expect(result.signal, diagnostic).toBeUndefined()
      expect(result.exitCode, diagnostic).toBe(0)
      expect(result.stdout.match(/\bid: our-free-model\b/g)).toHaveLength(1)
      expect(result.stdout).toContain(entry)
      expect(result.stdout).toContain('distribution: managed')
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)

  it('loads both halves and the shipped account pack against the current kernel without self-updating', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-ofm-runtime-'))
    try {
      const probe = join(home, 'probe.mjs')
      await writeFile(probe, runtimeProbe)
      const launch = resolveExampleLaunch({
        srcBin: probe,
        mode: 'src',
        sourceImport: 'tsx/esm',
        tsconfigPath: join(root, 'tsconfig.json'),
        env: { DSH_HOME: home },
      })
      const result = await execa(launch.command, launch.args, {
        cwd: root,
        env: launch.env,
        timeout: 30_000,
        killSignal: 'SIGKILL',
        reject: false,
      })
      const diagnostic = result.stdout + '\n' + result.stderr
      expect(result.timedOut, diagnostic).toBe(false)
      expect(result.signal, diagnostic).toBeUndefined()
      expect(result.exitCode, diagnostic).toBe(0)
      expect(result.stdout).toContain('OUR_FREE_MODEL_INTEGRATION_OK')
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)
})
