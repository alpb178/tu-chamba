'use client';

import { COMPANIES } from '@/lib/companies';
import { groupSiteUrl, siteDomain } from '@/lib/group-ticker';
import { trackSiteClick } from '@/lib/track-site-click';

// CorpSC Group ticker: a thin strip above the navbar with the sister sites
// scrolling in a loop. It uses the parent company's palette (CorpSC navy) and
// not the portal's on purpose: it's the same strip on all four group sites,
// so it reads as the "group bar" and not as part of the Tu Chamba header.
//
// The track holds the list twice and shifts by -50%: when the first copy
// ends, the second is exactly where the first started, so the loop has no
// jump. The duplicate copy is hidden from screen readers and out of the tab
// order.
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

// Own styles instead of Tailwind utilities: the ticker's animation and mask
// are identical on all four group sites, so the block can be copied between
// repos without depending on each one's Tailwind config.
const CSS = `
.gt {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  height: 38px;
  overflow: hidden;
  background: #06132e;
  /* The CorpSC header is the same navy: without this line the strip would
     blend into it. */
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
/* Edge fade with gradients of the background itself rather than
   mask-image: on iOS Safari the mask can freeze the animation running
   underneath. */
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
/* Pause on mouse hover only where there is a pointer: on touch, :hover
   sticks after the first tap and would leave the strip stopped. Keyboard
   focus always pauses it. */
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
/* Separator between the link and its description; decorative, hence in CSS. */
.gt-desc::before {
  content: "·";
  margin-right: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}
@keyframes gt-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
/* Reduced motion: the strip stays still and can be scrolled horizontally. */
@media (prefers-reduced-motion: reduce) {
  .gt-track { animation: none; }
  .gt-viewport { overflow-x: auto; }
}
`;
