import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type OcsrResult = { ok: true; smiles: string } | { ok: false; error: string };

function pythonCommand() {
  const candidates = [
    process.env.ENZYME_PYTHON,
    path.join(process.resourcesPath ?? '', 'ocsr-runtime', 'python.exe'),
    path.join(process.cwd(), '.pixi', 'envs', 'ocsr', 'python.exe'),
    process.env.PYTHON,
    'python'
  ].filter(Boolean) as string[];
  return candidates.find((candidate) => candidate === 'python' || fs.existsSync(candidate)) ?? 'python';
}

export function recognizeStructureImage(imagePath: string, timeoutMs = 120_000): Promise<OcsrResult> {
  return new Promise((resolve) => {
    const candidates = [
      path.join(process.cwd(), 'app/backend/ocsr/decimer_predict.py'),
      path.join(process.resourcesPath ?? '', 'app/backend/ocsr/decimer_predict.py'),
      path.join(__dirname, '../app/backend/ocsr/decimer_predict.py')
    ];
    const scriptPath = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
    const child = spawn(pythonCommand(), [scriptPath, imagePath], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({ ok: false, error: '\u8bc6\u522b\u8d85\u65f6\uff0c\u8bf7\u5c1d\u8bd5\u88c1\u526a\u66f4\u6e05\u6670\u7684\u7ed3\u6784\u56fe\u7247\u3002' });
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, error: `Python/DECIMER \u542f\u52a8\u5931\u8d25\uff1a${error.message}` });
    });
    child.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const text = stdout.trim();
      if (!text) {
        resolve({ ok: false, error: stderr.trim() || 'DECIMER did not return a result.' });
        return;
      }
      try {
        const parsed = JSON.parse(text) as OcsrResult;
        resolve(parsed.ok ? parsed : { ok: false, error: parsed.error || stderr.trim() || 'DECIMER recognition failed.' });
      } catch {
        resolve({ ok: false, error: stderr.trim() || text });
      }
    });
  });
}
