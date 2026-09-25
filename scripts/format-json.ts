/**
 * Canonical formatting for the files under data/.
 *
 * Objects that carry an "id" (voicings) and the top-level object are always
 * expanded, one property per line, so diffs show exactly which field changed.
 * Anything else that fits on one line within MAX_WIDTH is kept inline, so
 * fret and finger arrays read as a single row.
 */
const MAX_WIDTH = 100;
const INDENT = '  ';

const inline = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return JSON.stringify(value);
};

const format = (value: unknown, depth: number, prefixWidth: number): string => {
  const pad = INDENT.repeat(depth);
  const mustExpand =
    depth === 0 || (!!value && typeof value === 'object' && !Array.isArray(value) && 'id' in value);
  if (!mustExpand) {
    const flat = inline(value);
    if (pad.length + prefixWidth + flat.length <= MAX_WIDTH || !value || typeof value !== 'object') {
      return flat;
    }
  }
  const inner = INDENT.repeat(depth + 1);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((v) => inner + format(v, depth + 1, 0)).join(',\n')}\n${pad}]`;
  }
  const entries = Object.entries(value as object);
  if (!entries.length) return '{}';
  return `{\n${entries
    .map(([k, v]) => {
      const key = `${JSON.stringify(k)}: `;
      return inner + key + format(v, depth + 1, key.length);
    })
    .join(',\n')}\n${pad}}`;
};

export const formatJson = (value: unknown): string => `${format(value, 0, 0)}\n`;
