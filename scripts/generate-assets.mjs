import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const assets = [
  { src: 'scripts/apple-touch-icon.svg', out: 'public/apple-touch-icon.png', size: [180, 180] },
  { src: 'scripts/og-default.svg', out: 'public/og-default.png', size: [1200, 630] },
];

for (const { src, out, size } of assets) {
  await sharp(readFileSync(resolve(root, src)))
    .resize(size[0], size[1])
    .png()
    .toFile(resolve(root, out));
  console.log(`wrote ${out}`);
}
