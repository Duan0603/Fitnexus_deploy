#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function download(url, outPath) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, buf);
}

async function main() {
  const base = process.argv[2] || 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224';
  const outDir = process.argv[3] || './public/model/mobilenet_v2_1.0_224';
  const modelJsonUrl = `${base.replace(/\/$/, '')}/model.json`;
  const outModel = path.resolve(outDir, 'model.json');

  console.log(`[fetch-tfjs-model] Downloading model.json from ${modelJsonUrl}`);
  await download(modelJsonUrl, outModel);
  const model = JSON.parse(await fs.readFile(outModel, 'utf8'));

  const paths = [];
  for (const mani of model.weightsManifest || []) {
    for (const p of mani.paths || []) paths.push(p);
  }
  console.log(`[fetch-tfjs-model] Found ${paths.length} shard(s)`);

  for (const p of paths) {
    const url = `${base.replace(/\/$/, '')}/${p}`;
    const out = path.resolve(outDir, p);
    console.log(`[fetch-tfjs-model] Downloading ${p}`);
    await download(url, out);
  }

  console.log(`[fetch-tfjs-model] Done. Files saved to ${path.resolve(outDir)}`);
}

main().catch((err) => {
  console.error('[fetch-tfjs-model] Error:', err.message);
  process.exit(1);
});

