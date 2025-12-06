import { build } from 'esbuild';
import csso from 'csso';
import { promises as fs } from 'fs';
import path from 'path';

const jsEntries = [
  'assets/js/app.js',
  'assets/js/alerts.js',
  'assets/js/compare.js',
  'assets/js/premium-features.js',
  'assets/js/micro-interactions.js',
  'assets/js/dynamic-effects.js',
  'assets/js/favorites.js',
  'assets/js/theme.js',
  'assets/js/weather-effects.js'
];

const cssFiles = [
  'assets/css/styles.css',
  'assets/css/premium-design.css',
  'assets/css/micro-interactions.css',
  'assets/css/dynamic-effects.css',
  'assets/css/alerts.css',
  'assets/css/compare.css'
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function bundleJS() {
  await ensureDir('dist/js');
  await build({
    entryPoints: jsEntries,
    outdir: 'dist/js',
    bundle: true,
    minify: true,
    sourcemap: true,
    target: 'es2018',
    format: 'iife',
    logLevel: 'info'
  });
}

async function minifyCSS() {
  await ensureDir('dist/css');
  await Promise.all(cssFiles.map(async (file) => {
    const src = await fs.readFile(file, 'utf8');
    const minified = csso.minify(src).css;
    const out = path.join('dist/css', path.basename(file));
    await fs.writeFile(out, minified, 'utf8');
  }));
}

async function cleanDist() {
  await fs.rm('dist', { recursive: true, force: true });
}

async function main() {
  await cleanDist();
  await Promise.all([bundleJS(), minifyCSS()]);
  console.log('✅ Build complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
