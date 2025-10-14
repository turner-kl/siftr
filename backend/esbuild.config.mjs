import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build the application
await build({
  entryPoints: ['src/api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/api/index.js',
  format: 'esm',
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
  },
  external: ['@aws-sdk/*', 'aws-sdk', 'pg-native'],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  logLevel: 'info',
});

// Copy run.sh to dist/api
mkdirSync('dist/api', { recursive: true });
copyFileSync('run.sh', 'dist/api/run.sh');

// Copy package.json to dist/api for Lambda bundling
copyFileSync('package.json', 'dist/api/package.json');

console.log('✅ Build completed');
console.log('📦 Files copied: run.sh, package.json');
