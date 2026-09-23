import { describe, expect, it } from 'vitest';
import { resolveGroupSite } from './hub-analytics';

describe('resolveGroupSite', () => {
  it('recognizes a group sibling by its domain', () => {
    expect(resolveGroupSite('https://irisnatural.corpsc.com/productos')).toBe('iris-natural');
    expect(resolveGroupSite('https://dandomuela.com')).toBe('dandomuela');
  });

  it('treats "www." as the same site', () => {
    expect(resolveGroupSite('https://www.corpsc.com/es')).toBe('corpsc');
  });

  it('keeps the hub slug even if the ticker uses another name', () => {
    // Some repo's ticker calls this site "dando-muela"; in the hub it's
    // "dandomuela", and the hub is the source of truth: otherwise the same
    // metric would be split into two buckets.
    expect(resolveGroupSite('https://dandomuela.com')).not.toBe('dando-muela');
  });

  it('ignores anything that does not go to a group site', () => {
    // A relative link is internal navigation, not an outbound click.
    expect(resolveGroupSite('/empleos')).toBeNull();
    expect(resolveGroupSite('mailto:hola@corpsc.com')).toBeNull();
    expect(resolveGroupSite('https://google.com')).toBeNull();
    expect(resolveGroupSite('not a url')).toBeNull();
  });

  it('does not count a link to this same site as an outbound click', () => {
    expect(resolveGroupSite('https://tu-chamba.corpsc.com/empleos', 'tu-chamba.corpsc.com')).toBeNull();
    // And the same link seen from another group site does count.
    expect(resolveGroupSite('https://tu-chamba.corpsc.com/empleos', 'irisnatural.corpsc.com')).toBe('tu-chamba');
  });
});
