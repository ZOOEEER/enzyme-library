const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, '.pixi', 'envs', 'ocsr');
const target = path.join(root, 'build', 'ocsr-runtime');

if (!fs.existsSync(source)) {
  console.error('[ERROR] Pixi OCSR environment not found:', source);
  console.error('[ERROR] Run `pixi install` and `pixi run ocsr-check` first.');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log('[INFO] OCSR runtime prepared:', target);
