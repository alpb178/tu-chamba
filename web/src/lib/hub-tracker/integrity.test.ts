// GENERATED from corpsc-hub/tracker v2.0.0. Do not edit this copy:
// change it in corpsc-hub/tracker and run `pnpm sync <this folder>` there.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8')) as {
  files: Record<string, string>;
};

describe('hub tracker copy', () => {
  it.each(Object.entries(manifest.files))('%s is exactly what corpsc-hub/tracker ships', (name, hash) => {
    const content = readFileSync(join(dir, name), 'utf8');
    expect(createHash('sha256').update(content).digest('hex'), `${name} was edited by hand`).toBe(hash);
  });
});
