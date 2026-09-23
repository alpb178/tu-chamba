import { describe, it, expect } from 'vitest';
import { messages } from './messages';

type Tree = { [key: string]: string | Tree };

// Every leaf key, e.g. "nav.publish".
function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

function leaf(tree: Tree, path: string): string {
  return path.split('.').reduce<string | Tree>((t, k) => (t as Tree)[k], tree) as string;
}

// ICU argument names ({count}, {name}, {count, plural, ...}) used by a
// message. Plural/select branches ("one {...}") are not arguments.
function args(message: string): string[] {
  const re = /(?<!(?:\b(?:zero|one|two|few|many|other)|=\d+)\s*)\{\s*(\w+)\s*[,}]/g;
  return [...new Set([...message.matchAll(re)].map((m) => m[1]))].sort();
}

describe('messages', () => {
  const es = messages.es as unknown as Tree;
  const en = messages.en as unknown as Tree;

  it('English has exactly the same keys as Spanish', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it('both locales use the same placeholders in every message', () => {
    for (const key of keys(es)) {
      expect({ key, args: args(leaf(en, key)) }).toEqual({ key, args: args(leaf(es, key)) });
    }
  });

  it('no message is empty', () => {
    for (const tree of [es, en]) {
      for (const key of keys(tree)) expect(leaf(tree, key).trim(), key).not.toBe('');
    }
  });
});
