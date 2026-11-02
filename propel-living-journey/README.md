# PROPEL — The Living Journey

A standalone editorial prototype of Arizona State University’s Project PROPEL roadmap. It tells the three-year path — Infrastructure, Expansion, and Full Implementation — as one continuous journey, with a meeting-ready overview of the same content.

This folder is separate from the scheduling application at the repository root. Running `npm run dev` in the repository root starts that other app, not this prototype.

## Run it

```bash
cd propel-living-journey
npm install
npm run dev
```

Open http://localhost:5173/

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

## How to demonstrate it

1. Start at the hero and choose **Explore the journey**.
2. Scroll the story. The gold line advances with the reading position. It is a place marker, not a completion meter.
3. Use the stage list, **Previous**, and **Next**. Arrow keys, Home, and End work when the stage navigation has focus.
4. Open **Further reading** under a year for sourced notes.
5. Switch **Story / Overview** to see all three years on one board.
6. Select each of the four pillars. Keyboard and touch select the same explanation as a click.
7. Add `?motion=reduce` to the URL to force the reduced-motion treatment, or `?motion=full` to force motion. `#propel-overview` opens Overview mode.

## Edit the roadmap

All visitor-facing copy lives in `src/content/roadmap.ts`. Story, overview, pillars, and the closing section read that file. Do not paste the same sentences into the visualization code.

Keep exactly three stages and four pillars. The renderer checks those counts. If a stage is renamed, keep its `id` (`infrastructure`, `expansion`, `implementation`) unless the figure and path code are updated to match.

Do not add completion percentages, financial impact, or student-success statistics. The public window of November 2025 through November 2028 is provisional. Do not invent milestone dates.

## Structure

| Path | Role |
| --- | --- |
| `src/content/roadmap.ts` | Editable content |
| `src/types.ts` | Content types |
| `src/render/experience.ts` | Semantic HTML |
| `src/render/diagrams.ts` | Hero, journey, pillar, and overview SVG |
| `src/render/illustrations.ts` | Chapter figures |
| `src/viz/geometry.ts` | D3 path and scale geometry |
| `src/behavior/journey.ts` | Scroll position, stage state, keyboard nav |
| `src/behavior/mode.ts` | Story / Overview |
| `src/behavior/pillars.ts` | Pillar selection from the diagram |
| `src/mount.ts` | Integration boundary |
| `src/styles/` | Tokens and layout, scoped under `.propel` |
| `docs/drupal-integration.md` | How a Drupal theme could include the build |
| `docs/assumptions.md` | Decisions that need Des’s approval |
| `docs/screenshots/` | Desktop and mobile captures from review |

`index.html` contains `<!--PROPEL-->`. Vite replaces that comment with the rendered experience, so the narrative is in the HTML before client JavaScript runs. Story / Overview, pillar explanations, and the expandable notes also work from native form controls and `<details>` if the script does not run.

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

Set `data-show-chrome="false"` on the root to hide the prototype header. The Story / Overview control stays, because it is part of the experience.

See `docs/drupal-integration.md` before placing this on a Webspark site.
