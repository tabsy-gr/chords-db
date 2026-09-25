import { defineConfig } from 'tsup';

// package.json has no "type" (the .js chord sources need CommonJS resolution
// because their file names contain '#'), so tsup emits .mjs for ESM and .js
// for CJS, matching the exports map.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
