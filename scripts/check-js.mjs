import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { spawnSync } from 'child_process';

async function collectJavaScriptFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const targets = [
    'build.mjs',
    'sw.js',
    ...(await collectJavaScriptFiles('assets/js')),
  ];

  const uniqueTargets = [...new Set(targets)];
  const failures = [];

  for (const file of uniqueTargets) {
    const fileStats = await stat(file).catch(() => null);
    if (!fileStats || !fileStats.isFile()) {
      continue;
    }

    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      failures.push({
        file,
        output: (result.stderr || result.stdout || '').trim(),
      });
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`Syntax check failed: ${failure.file}`);
      if (failure.output) {
        console.error(failure.output);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Checked ${uniqueTargets.length} JavaScript files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});