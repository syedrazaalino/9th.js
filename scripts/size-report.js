#!/usr/bin/env node
/**
 * Report ESM/UMD bundle sizes after build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'dist/esm/main.js',
  'dist/umd/9th.umd.js',
  'dist/umd/9th.umd.min.js'
];

const BUDGET_MIN_GZ = 500 * 1024; // soft budget for min UMD (~500KB gzipped warning)

function sizeOf(file) {
  const full = path.join(cwd, file);
  if (!fs.existsSync(full)) return null;
  return fs.statSync(full).size;
}

console.log('Bundle size report');
for (const file of targets) {
  const bytes = sizeOf(file);
  if (bytes == null) {
    console.log(`  MISSING ${file}`);
  } else {
    console.log(`  ${file}: ${(bytes / 1024).toFixed(1)} KB`);
  }
}

const min = sizeOf('dist/umd/9th.umd.min.js');
if (min && min > BUDGET_MIN_GZ) {
  console.log(`\nNote: min UMD is large (${(min / 1024).toFixed(0)} KB). Tree-shake via ESM imports where possible.`);
}
