#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'types', 'public-api.d.ts');
const destDir = path.join(root, 'dist', 'esm');
const dest = path.join(destDir, 'index.d.ts');

if (!fs.existsSync(src)) {
  console.error('Missing types/public-api.d.ts');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied public API typings -> dist/esm/index.d.ts');
