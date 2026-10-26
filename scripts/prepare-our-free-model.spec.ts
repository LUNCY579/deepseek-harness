import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterEach, describe, expect, it } from 'vitest'
import { restoreOurFreeModel } from './prepare-our-free-model.mjs'
import type { RestoreOurFreeModelOptions } from './prepare-our-free-model.mjs'

const fixtures: string[] = []

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

async function fixture(): Promise<{ options: RestoreOurFreeModelOptions; binary: Buffer; archivePath: string }> {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-prepare-ofm-'))
  fixtures.push(directory)
  const binary = Buffer.from('fixture Magpie executable\n'.repeat(32))
  const archive = gzipSync(binary)
  const archivePath = join(directory, 'magpie.exe.gz')
  const options = {
    archivePaths: [archivePath],
    targetPath: join(directory, 'bin', 'magpie.exe'),
    archiveSize: archive.length,
    archiveSha256: sha256(archive),
    binarySize: binary.length,
    binarySha256: sha256(binary),
  }
  await writeFile(archivePath, archive)
  return { options, binary, archivePath }
}

async function multipartFixture(): Promise<{ options: RestoreOurFreeModelOptions; binary: Buffer; middlePart: string }> {
  const { options, binary, archivePath } = await fixture()
  const archive = await readFile(archivePath)
  const firstPart = `${archivePath}.part01`
  const middlePart = `${archivePath}.part02`
  const lastPart = `${archivePath}.part03`
  await Promise.all([
    writeFile(firstPart, archive.subarray(0, 1)),
    writeFile(middlePart, archive.subarray(1, -3)),
    writeFile(lastPart, archive.subarray(-3)),
  ])
  await rm(archivePath)
  options.archivePaths = [firstPart, middlePart, lastPart]
  return { options, binary, middlePart }
}

async function expectCleanTargetDirectory(options: RestoreOurFreeModelOptions, restored: boolean): Promise<void> {
  expect(await readdir(dirname(options.targetPath))).toEqual(restored ? ['magpie.exe'] : [])
}

describe('bundled Our Free Model executable preparation', () => {
  it('restores the exact executable and removes temporary files', async () => {
    const { options, binary } = await fixture()
    expect(await restoreOurFreeModel(options)).toBe('restored')
    expect(await readFile(options.targetPath)).toEqual(binary)
    await expectCleanTargetDirectory(options, true)
  })

  it('restores an archive with its gzip header and trailer split across files', async () => {
    const { options, binary } = await multipartFixture()
    expect(await restoreOurFreeModel(options)).toBe('restored')
    expect(await readFile(options.targetPath)).toEqual(binary)
    await expectCleanTargetDirectory(options, true)
  })

  it('rejects a missing archive part without publishing a partial executable', async () => {
    const { options, middlePart } = await multipartFixture()
    await rm(middlePart)
    await expect(restoreOurFreeModel(options)).rejects.toMatchObject({ cause: { code: 'ENOENT', path: middlePart } })
    await expect(stat(options.targetPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await expectCleanTargetDirectory(options, false)
  })

  it('verifies a repeated installation without rewriting the executable', async () => {
    const { options } = await fixture()
    await restoreOurFreeModel(options)
    const originalTime = new Date('2020-01-01T00:00:00Z')
    await utimes(options.targetPath, originalTime, originalTime)
    const before = await stat(options.targetPath)
    expect(await restoreOurFreeModel(options)).toBe('existing')
    const after = await stat(options.targetPath)
    expect(after.ino).toBe(before.ino)
    expect(after.mtimeMs).toBe(before.mtimeMs)
    expect(after.ctimeMs).toBe(before.ctimeMs)
    await expectCleanTargetDirectory(options, true)
  })

  it.each([
    'archive hash', 'archive too short', 'archive too long',
    'executable hash', 'executable too short', 'executable too long', 'invalid gzip',
  ] as const)('rejects %s corruption without publishing a partial executable', async (failure) => {
    const { options, archivePath } = await fixture()
    if (failure === 'archive hash') options.archiveSha256 = '0'.repeat(64)
    if (failure === 'archive too short') options.archiveSize += 1
    if (failure === 'archive too long') options.archiveSize -= 1
    if (failure === 'executable hash') options.binarySha256 = '0'.repeat(64)
    if (failure === 'executable too short') options.binarySize += 1
    if (failure === 'executable too long') options.binarySize -= 1
    if (failure === 'invalid gzip') {
      const corrupt = Buffer.from('not a gzip archive')
      await writeFile(archivePath, corrupt)
      options.archiveSize = corrupt.length
      options.archiveSha256 = sha256(corrupt)
    }
    const restoration = restoreOurFreeModel(options)
    if (failure === 'invalid gzip') {
      await expect(restoration).rejects.toMatchObject({ cause: { code: 'Z_DATA_ERROR' } })
    } else {
      await expect(restoration).rejects.toThrow(failure.endsWith('hash') ? /SHA-256/ : /bytes/)
    }
    await expect(stat(options.targetPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await expectCleanTargetDirectory(options, false)
  })

  it('preserves an existing executable whose checksum does not match', async () => {
    const { options, binary } = await fixture()
    await restoreOurFreeModel(options)
    const modified = Buffer.from(binary)
    modified[0] = 0
    await writeFile(options.targetPath, modified)
    await expect(restoreOurFreeModel(options)).rejects.toThrow(/was preserved/)
    expect(await readFile(options.targetPath)).toEqual(modified)
    await expectCleanTargetDirectory(options, true)
  })

  it('allows concurrent restoration with one atomic publisher', async () => {
    const { options, binary } = await fixture()
    const results = await Promise.allSettled([restoreOurFreeModel(options), restoreOurFreeModel(options)])
    expect(results).toEqual(expect.arrayContaining([
      { status: 'fulfilled', value: 'existing' },
      { status: 'fulfilled', value: 'restored' },
    ]))
    expect(await readFile(options.targetPath)).toEqual(binary)
    await expectCleanTargetDirectory(options, true)
  })
})
