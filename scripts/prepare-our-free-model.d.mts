/** Checked asset locations and integrity metadata for executable restoration. */
export interface RestoreOurFreeModelOptions {
  /** Gzip archive parts to read in order as one compressed stream. */
  archivePaths: string[]
  /** Executable path to publish without overwriting an existing file. */
  targetPath: string
  /** Exact combined compressed archive size in bytes. */
  archiveSize: number
  /** Lowercase hexadecimal SHA-256 of the combined compressed archive. */
  archiveSha256: string
  /** Exact decompressed executable size in bytes. */
  binarySize: number
  /** Lowercase hexadecimal SHA-256 of the executable. */
  binarySha256: string
}

/**
 * Verify an existing executable or atomically restore a fully verified archive.
 * @param options - ordered archive part paths and integrity metadata; defaults to the bundled Magpie asset.
 * @returns whether this call restored the executable or verified an existing copy.
 */
export function restoreOurFreeModel(options?: RestoreOurFreeModelOptions): Promise<'restored' | 'existing'>
