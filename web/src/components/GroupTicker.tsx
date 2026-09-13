'use client';

import { COMPANIES } from '@/lib/companies';
import { groupSiteUrl, siteDomain } from '@/lib/group-ticker';
import { trackSiteClick } from '@/lib/track-site-click';

// Cintillo del Grupo CorpSC: franja fina sobre el navbar con los sitios
// hermanos desplazándose en bucle. Usa la paleta de la matriz (azul marino de
// CorpSC) y no la del portal a propósito: es la misma franja en los cuatro
// sitios del grupo, así se lee como "barra del grupo" y no como parte del
// header de Tu Chamba.
//
// La pista lleva la lista duplicada y se desplaza -50%: al terminar la primera
// copia, la segunda está exactamente donde empezó la primera, así el bucle no
// tiene salto. La copia duplicada va oculta para lectores de pantalla y fuera
// del orden de tabulación.
export function GroupTicker() {
  return (
    <aside className="gt" aria-label="Sitios de interés">
      <div className="gt-viewport">
        <div className="gt-track">
          <TickerRow />
          <TickerRow duplicate />
        </div>
      </div>

      <style>{CSS}</style>
    </aside>
  );
}

function TickerRow({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="gt-row" aria-hidden={duplicate || undefined}>
      {COMPANIES.map((company) => (
        <li key={company.slug}>
          <a
            href={groupSiteUrl(company.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSiteClick(company)}
            tabIndex={duplicate ? -1 : undefined}
            className="gt-link"
          >
            <span
              className="gt-dot"
              style={{ backgroundColor: company.accent }}
              aria-hidden="true"
            />
            <span className="gt-name">{company.name}</span>
            <span className="gt-url">{siteDomain(company.url)}</span>
            <span className="gt-desc">{company.tagline}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// Estilos propios en vez de utilidades de Tailwind: la animación y la máscara
// del cintillo son idénticas en los cuatro sitios del grupo, y así el bloque se
// copia entre repos sin depender de la config de Tailwind de cada uno.
const CSS = `
.gt {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  height: 38px;
  overflow: hidden;
  background: #06132e;
  /* El header de CorpSC es del mismo azul marino: sin esta línea la franja se
     fundiría con él. */
  border-bottom: 1px solid rgba(127, 176, 255, 0.22);
  color: #ffffff;
  font-size: 0.8125rem;
  line-height: 1;
}
.gt-viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
}
/* Difuminado de los bordes con degradados del propio fondo y no con
   mask-image: en Safari de iOS la máscara puede congelar la animación
   que corre por debajo. */
.gt-viewport::before,
.gt-viewport::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  z-index: 1;
  pointer-events: none;
}
.gt-viewport::before {
  left: 0;
  background: linear-gradient(90deg, #06132e, rgba(6, 19, 46, 0));
}
.gt-viewport::after {
  right: 0;
  background: linear-gradient(270deg, #06132e, rgba(6, 19, 46, 0));
}
.gt-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: gt-scroll 38s linear infinite;
}
/* La pausa al pasar el mouse solo donde hay puntero: en táctil el :hover
   se queda pegado tras el primer toque y dejaría la franja detenida. El
   foco de teclado sí la pausa siempre. */
.gt-track:focus-within {
  animation-play-state: paused;
}
@media (hover: hover) and (pointer: fine) {
  .gt:hover .gt-track { animation-play-state: paused; }
}
.gt-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-right: 2rem;
  margin: 0;
  list-style: none;
}
.gt-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
}
.gt-link:hover .gt-name { text-decoration: underline; }
.gt-link:focus-visible {
  outline: 2px solid #7fb0ff;
  outline-offset: 3px;
  border-radius: 2px;
}
.gt-dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
}
.gt-name { font-weight: 600; }
.gt-url { color: #ffffff; }
.gt-desc { color: #ffffff; }
/* Separador entre el enlace y su descripción; decorativo, por eso va en CSS. */
.gt-desc::before {
  content: "·";
  margin-right: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}
@keyframes gt-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
/* Sin movimiento: la franja queda quieta y se puede arrastrar en horizontal. */
@media (prefers-reduced-motion: reduce) {
  .gt-track { animation: none; }
  .gt-viewport { overflow-x: auto; }
}
`;
