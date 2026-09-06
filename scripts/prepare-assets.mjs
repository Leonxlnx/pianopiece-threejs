import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('production/assets/manifest.json', root), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Keep the exact validated GLB in a smaller, lossless source archive. The build
// emits the ordinary GLB, so playback needs no decoder or extra asset request.
for (const [name, expected] of Object.entries(manifest)) {
  const destination = new URL(`public/assets/${name}`, root);
  const current = await readFile(destination).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (current?.length === expected.bytes && sha256(current) === expected.sha256) continue;
  const packed = await readFile(new URL(`production/assets/${name}.br`, root));
  if (packed.length !== expected.brotliBytes || sha256(packed) !== expected.brotliSha256)
    throw new Error(`Compressed source checksum failed: ${name}`);
  const bytes = brotliDecompressSync(packed);
  if (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256)
    throw new Error(`Restored asset checksum failed: ${name}`);
  await mkdir(new URL('public/assets/', root), { recursive: true });
  const temporary = new URL(`public/assets/${name}.${process.pid}.tmp`, root);
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
  console.log(`Restored ${name}: ${bytes.length} bytes, SHA-256 verified`);
}
