import { describe, expect, it } from 'vitest';
import { resolveGroupSite } from './hub-analytics';

describe('resolveGroupSite', () => {
  it('reconoce a un hermano del grupo por su dominio', () => {
    expect(resolveGroupSite('https://irisnatural.corpsc.com/productos')).toBe('iris-natural');
    expect(resolveGroupSite('https://dandomuela.com')).toBe('dandomuela');
  });

  it('trata "www." como el mismo sitio', () => {
    expect(resolveGroupSite('https://www.corpsc.com/es')).toBe('corpsc');
  });

  it('conserva el slug del hub aunque el cintillo use otro nombre', () => {
    // El cintillo de algún repo llama "dando-muela" a este sitio; en el hub es
    // "dandomuela", y es el hub quien manda: si no, la misma métrica quedaría
    // partida en dos cubos.
    expect(resolveGroupSite('https://dandomuela.com')).not.toBe('dando-muela');
  });

  it('ignora lo que no va a un sitio del grupo', () => {
    // Un enlace relativo es navegación interna, no un clic que se va.
    expect(resolveGroupSite('/empleos')).toBeNull();
    expect(resolveGroupSite('mailto:hola@corpsc.com')).toBeNull();
    expect(resolveGroupSite('https://google.com')).toBeNull();
    expect(resolveGroupSite('no es una url')).toBeNull();
  });

  it('no cuenta como clic saliente un enlace a este mismo sitio', () => {
    expect(resolveGroupSite('https://tu-chamba.corpsc.com/empleos', 'tu-chamba.corpsc.com')).toBeNull();
    // Y el mismo enlace visto desde otro sitio del grupo sí cuenta.
    expect(resolveGroupSite('https://tu-chamba.corpsc.com/empleos', 'irisnatural.corpsc.com')).toBe('tu-chamba');
  });
});
