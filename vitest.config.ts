import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

// Upstream chord sources have '#' in file and directory names (e.g. './m_C#',
// 'piano/chords/C#/'), which Vite treats as a URL fragment. Encode '#' in the
// module id and read the real file ourselves.
// Temporary: the .js sources are replaced by JSON in schema v2.
const HASH = '__HASH__';
const decode = (id: string) => id.split(HASH).join('#');

const literalHashImports = (): Plugin => ({
  name: 'literal-hash-imports',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.')) return null;
    if (!source.includes('#') && !importer.includes(HASH)) return null;
    const file = path.resolve(path.dirname(decode(importer)), source);
    for (const candidate of [file, `${file}.js`, path.join(file, 'index.js')]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate.split('#').join(HASH);
      }
    }
    return null;
  },
  load(id) {
    return id.includes(HASH) ? fs.readFileSync(decode(id), 'utf8') : null;
  },
});

export default defineConfig({
  plugins: [literalHashImports()],
  test: {
    environment: 'node',
  },
});
