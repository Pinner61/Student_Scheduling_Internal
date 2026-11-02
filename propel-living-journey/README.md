# PROPEL: Empowered to flourish

A review prototype of the University College Project PROPEL page. It is a standalone Vite site in this folder, separate from the scheduling application at the repository root. Running `npm run dev` at the repository root starts that other app, not this site.

The page is for stakeholder review. It is not deployed and it does not change the live ASU website.

## Run it

```bash
cd propel-living-journey
npm install
npm run dev
```

Open http://localhost:5173/

The timeline prototype is at http://localhost:5173/timeline.html. It is a vertical alternating timeline. It opens with the three published PROPEL stages, then the Office of the President chronology from president.asu.edu, including that page’s pictures and Learn more links, through 2002. It is not an approved design. The journey section links to it.

Production build:

```bash
npm run build
npm run preview
```

The preview server uses port 4173. Compiled files land in `dist/`:

- `dist/assets/propel-journey.js`
- `dist/assets/propel-journey.css`

Checks:

```bash
npm test
npm run typecheck
```

## What the page contains

The copy comes from the live PROPEL page and the University College project listing. See `CONTENT_SOURCES.md`.

1. Hero — “PROPEL: Empowered to flourish”
2. Flourishing is foundational, with real-time insights, adaptive support, and human connection
3. Why it matters, and why PROPEL is different
4. Four pillars, as one diagram with a detail panel
5. Three tiers — Tier 3 universal, Tier 2 targeted, Tier 1 intensive
6. Three-year journey — Infrastructure, Expansion, Full implementation
7. Team, donor acknowledgment, and closing statement
8. Contact form, wired for a future endpoint and honest when none is configured

## How to demonstrate it

1. Use **Explore the PROPEL model** or the page navigation.
2. Choose a pillar. The line to the student and the detail panel change together.
3. Choose a tier. Tier 3 is universal support. Tier 1 is intensive, one-to-one support.
4. On the journey, choose a year, or use **Previous** and **Next**. Open a milestone.
5. The contact form validates input. Without `data-form-endpoint`, a valid submit reports that the message was not sent.

`?motion=reduce` forces the reduced-motion treatment. `?motion=full` forces motion. On the timeline page, `#infrastructure`, `#expansion`, and `#implementation` jump to the PROPEL years. `#president-story`, `#p-latest`, `#p-2031`, and `#p-2025` through `#p-2002` jump through the presidential chronology. On the main page, the three stage hashes open the journey years, and `#flourishing`, `#life-design`, `#analytics`, and `#tiered-care` open those pillars.

## Edit the copy

Visitor-facing text lives in `src/content/site.ts`. Do not paste the same sentences into the visualization code, and do not add completion percentages, retention claims, or people who are not on the official page.

## Structure

| Path | Role |
| --- | --- |
| `src/content/site.ts` | Editable content |
| `src/render/experience.ts` | Semantic HTML |
| `src/content/timeline.ts` | PROPEL timeline reading model, drawn from `site.ts` |
| `src/content/president-timeline.ts` | Presidential chronology, links, and pictures from president.asu.edu |
| `src/render/timeline.ts` | Vertical timeline markup |
| `src/behavior/timeline.ts` | Scroll progress, year jumps, and the spoken year |
| `timeline.html` | Standalone timeline prototype |
| `src/viz/pathway.ts` | D3 year pathway |
| `src/viz/pillar-links.ts` | D3 pillar connectors |
| `src/behavior/` | Selection, journey, form, navigation |
| `src/mount.ts` | Integration boundary |
| `src/styles/` | Tokens and layout, scoped under `.propel` |
| `public/media/` | Logo, team photographs, and pillar illustrations saved from the official page |
| `docs/drupal-integration.md` | How a Drupal theme could include the build |
| `docs/contact-form.md` | What the contact form still needs |
| `docs/assumptions.md` | Decisions that need review |

`index.html` contains `<!--PROPEL-->`. Vite replaces that comment with the rendered experience, so the narrative is in the HTML before client JavaScript runs. Pillar, tier, and year panels also switch with native radio buttons if the script does not run.

## Mounting elsewhere

```ts
import { mountPropelJourney } from "./src/mount";

const root = document.querySelector<HTMLElement>("[data-propel-journey]");
const journey = mountPropelJourney(root!);

journey.setStage(1);
journey.getStage();
journey.destroy();
```

`window.PropelJourney.mount` is the same function. A second call on an element that is already mounted returns the existing controller.

Set `data-show-chrome="false"` on the root to hide the prototype header and footer. The on-page section navigation stays. Set `data-form-endpoint` only when an approved receiver exists. See `docs/drupal-integration.md` and `docs/contact-form.md`.
