/**
 * Copies the Python runtime that Code Lab loads into public/, so the built site
 * serves it itself instead of depending on a CDN. Run before dev and build.
 * The copy is gitignored; node_modules/pyodide is the source of truth.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', 'pyodide');
const to = join(root, 'public', 'pyodide');

if (!existsSync(from)) {
  console.error('pyodide is not installed. Run npm install first.');
  process.exit(1);
}

mkdirSync(to, { recursive: true });
for (const file of ['pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  cpSync(join(from, file), join(to, file));
}
console.log('pyodide runtime copied to public/pyodide');
