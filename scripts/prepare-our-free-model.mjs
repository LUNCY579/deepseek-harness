#!/usr/bin/env node
/** Restore the bundled Magpie executable from its checked-in gzip archive parts. */
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { link, lstat, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { createGunzip } from 'node:zlib'

const defaults = {
  archivePaths: Array.from({ length: 17 }, (_, index) => fileURLToPath(new URL(
    `../plugins/our-free-model-assets/magpie-win32-x64.exe.gz.part${String(index + 1).padStart(2, '0')}`,
    import.meta.url,
  ))),
  targetPath: fileURLToPath(new URL('../plugins/our-free-model/vendor/magpie/bin/magpie-win32-x64.exe', import.meta.url)),
  archiveSize: 34_767_358,
  archiveSha256: '97bf684c1e86b67d055520c7acdf9f38438221ee8f7434fe99428981f9711f9c',
  binarySize: 68_578_304,
  binarySha256: '6490f7ed2c5f001adc97284276af453f2a2b1711712e175e6fc780e09046fa3b',
}

function hasCode(error, code) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

async function* readArchiveParts(paths) {
  for (const path of paths) yield* createReadStream(path)
}

function verifyStream(label, expectedSize, expectedHash) {
  const hash = createHash('sha256')
  let size = 0
  return new Transform({
    transform(chunk, _encoding, callback) {
      size += chunk.length
      if (size > expectedSize) {
        callback(new Error(`${label} exceeds the expected ${expectedSize} bytes`))
        return
      }
      hash.update(chunk)
      callback(null, chunk)
    },
    flush(callback) {
      if (size !== expectedSize) {
        callback(new Error(`${label} has ${size} bytes; expected ${expectedSize}`))
      } else if (hash.digest('hex') !== expectedHash) {
        callback(new Error(`${label} SHA-256 does not match the checked-in metadata`))
      } else {
        callback()
      }
    },
  })
}

async function verifyExisting({ targetPath, binarySize, binarySha256 }) {
  let stat
  try {
    stat = await lstat(targetPath)
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return false
    throw error
  }
  const mismatch = () => new Error(
    `Existing ${targetPath} does not match the bundled Magpie executable and was preserved. `
    + 'Move or remove it explicitly, then rerun node scripts/prepare-our-free-model.mjs.',
  )
  if (!stat.isFile() || stat.size !== binarySize) throw mismatch()
  const hash = createHash('sha256')
  let size = 0
  for await (const chunk of createReadStream(targetPath)) {
    size += chunk.length
    hash.update(chunk)
  }
  if (size !== binarySize || hash.digest('hex') !== binarySha256) throw mismatch()
  return true
}

/**
 * Verify an existing executable or restore a fully verified archive without overwriting files.
 * @param options - ordered archive part paths, executable path, total byte sizes, and SHA-256 digests; defaults to the bundled Magpie asset.
 * @returns whether this call restored the executable or verified an existing copy.
 */
export async function restoreOurFreeModel(options = defaults) {
  if (await verifyExisting(options)) return 'existing'
  await mkdir(dirname(options.targetPath), { recursive: true })
  const temporaryDirectory = await mkdtemp(join(dirname(options.targetPath), '.prepare-our-free-model-'))
  const temporaryPath = join(temporaryDirectory, 'magpie.exe')
  try {
    await pipeline(
      Readable.from(readArchiveParts(options.archivePaths), { objectMode: false }),
      verifyStream('Magpie archive', options.archiveSize, options.archiveSha256),
      createGunzip(),
      verifyStream('Magpie executable', options.binarySize, options.binarySha256),
      createWriteStream(temporaryPath, { flags: 'wx', mode: 0o644 }),
    )
    try {
      await link(temporaryPath, options.targetPath)
    } catch (error) {
      if (!hasCode(error, 'EEXIST')) throw error
      if (await verifyExisting(options)) return 'existing'
      throw new Error(`The executable at ${options.targetPath} changed during preparation; retry the command.`)
    }
    return 'restored'
  } catch (error) {
    throw new Error(
      `Cannot prepare ${options.targetPath} from the archive parts: `
      + `${error instanceof Error ? error.message : String(error)} `
      + 'Restore the archive parts from Git if missing or damaged, then rerun node scripts/prepare-our-free-model.mjs.',
      { cause: error },
    )
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  try {
    const result = await restoreOurFreeModel()
    console.log(`[prepare-our-free-model] Magpie executable ${result === 'restored' ? 'restored' : 'verified'}.`)
  } catch (error) {
    console.error(`[prepare-our-free-model] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
