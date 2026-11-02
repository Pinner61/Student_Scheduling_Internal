# Drupal integration guide

This prototype is a standalone Vite application. It does not change any live Drupal site, and it does not assume a Drupal version, an existing theme, administrative access, or permission to install modules.

The longer-term destination may be a University College page on ASU Webspark. The notes below are a practical handoff for that work. They are not a theme patch.

## What to ship

`npm run build` writes stable filenames:

- `dist/assets/propel-journey.css`
- `dist/assets/propel-journey.js`
- `dist/index.html` (the rendered demo page)

Copy the two asset files into the theme, for example `themes/custom/THEME/propel/`. Do not load the demo page’s `<body class="propel-standalone">` rules onto a Webspark page. Those rules only paint the local preview.

The JavaScript is an ES module. It assigns `window.PropelJourney.mount` and mounts every `[data-propel-journey]` element once the document is ready.

## 1. Theme library

A library declaration can look like this. Adjust the theme name and paths to the real theme.

```yml
propel_journey:
  css:
    theme:
      propel/propel-journey.css: {}
  js:
    propel/propel-journey.js: { attributes: { type: module } }
  dependencies:
    - core/drupal
```

Attach the library only on the page or paragraph that contains the experience. Confirm with the Webspark team whether a `type="module"` script is allowed in the theme library. If it is not, the build can be adapted to a classic script that still exposes `window.PropelJourney`. Do not add a bundler to the Drupal project until that constraint is known.

## 2. Where to mount it

Print a single mount element in the Twig template that owns the page or paragraph:

```twig
{{ attach_library('THEME/propel_journey') }}

<div
  id="propel-root"
  class="propel"
  data-propel-journey
  data-show-chrome="false"
>
  {# Server-rendered journey markup goes here. #}
</div>
```

`data-show-chrome="false"` hides the prototype header and footer so the Webspark header and footer remain the site chrome. The on-page section navigation stays, because it belongs to this page.

Optional: `data-form-endpoint="/approved-receiver"` enables contact delivery. Leave it unset until that receiver exists. See `docs/contact-form.md`.

The mount function expects the semantic markup to already be inside that element: hero, flourishing, why it matters, pillars, tiers, journey, team, donors, and contact. This prototype generates that markup from `src/content/roadmap.ts` at build time. For a first Drupal placement, the rendered HTML from `dist/index.html` (the contents of `#propel-root`) can be pasted into Twig. A later step can replace that paste with fields. See section 6.

Call the mount when Drupal attaches the element:

```js
(function (Drupal) {
  Drupal.behaviors.propelJourney = {
    attach(context) {
      const roots = once("propel-journey", "[data-propel-journey]", context);
      roots.forEach((root) => {
        if (window.PropelJourney) {
          window.PropelJourney.mount(root);
        }
      });
    },
    detach(context, settings, trigger) {
      if (trigger !== "unload") return;
      context.querySelectorAll("[data-propel-journey]").forEach((root) => {
        root.propelController?.destroy();
      });
    },
  };
})(Drupal);
```

`once()` is available on current Drupal cores. If this site’s theme cannot depend on it, the attribute check in the next section is enough on its own.

## 3. Avoiding global CSS conflicts

Component styles are written under `.propel`. Tokens such as `--asu-maroon` live on that element, not on `:root`. Keyframe names are `propel-rise` and `propel-draw`.

Do not remove the `.propel` ancestor from selectors. Do not load this stylesheet as an unscoped global reset. The demo class `body.propel-standalone` should not be added to a Drupal page.

Webspark and the Unity Design System already set Arial, maroon, and gold. Keeping the prototype’s font stack as Arial, Helvetica, and sans-serif avoids introducing a second typeface.

## 4. Initializing when Drupal attaches content

Drupal may insert the markup after the first page load, including through AJAX and BigPipe. The module script only auto-mounts elements that exist at `DOMContentLoaded`. A `Drupal.behaviors` `attach` function must call `window.PropelJourney.mount(root)` for elements that arrive later.

The script has to load before that call. If attach can run first, wait until `window.PropelJourney` exists, or put the behavior in a small classic script that depends on the module having run. Confirm the actual library weight on the site before relying on order.

## 5. Repeated attachments

`mountPropelJourney` is idempotent. It stores the controller in a `WeakMap` and sets `data-propel-initialized="true"` on the root. A second call returns the existing controller and does not add another year or resize listener.

On detach with trigger `unload`, call `controller.destroy()`. That aborts listeners, disconnects the resize observer, and clears the initialized flag so a later attach can mount cleanly. Do not call `destroy()` on every `detach`, because Drupal also detaches during routine AJAX refreshes of unrelated regions.

## 6. Content in Drupal later

`src/content/roadmap.ts` is the editorial source for this prototype. A Drupal content model could replace it without changing the interaction code, as long as the render still produces the same structure and the same three stage ids.

A conservative mapping:

| Prototype field | Possible Drupal home |
| --- | --- |
| Identity, timeline note, official URL | A PROPEL landing node |
| Each year: label, name, summary, initiatives | A Paragraph type, one per stage, ordered |
| Expandable detail | A long-text field or nested paragraph on that stage |
| Each pillar name and body | Four paragraph items, or a fixed four-field group |
| Closing text | Fields on the landing node |

The visualization expects three stages in order and four pillars. Changing those counts means changing the network geometry, not only the fields. The year control is a set of radios named `propel-year`. Pillars use `propel-pillar`. Tiers use `propel-tier`. The active choice is also reflected in the hash: `#infrastructure`, `#expansion`, `#implementation`, `#flourishing`, `#life-design`, `#analytics`, `#tiered-care`, `#tier-3`, `#tier-2`, or `#tier-1`. Section links use `#flourish`, `#why`, `#pillars`, `#tiers`, `#journey`, `#team`, and `#contact`.

Until an editor model is approved, keep copy in the prototype file and rebuild. Do not invent a Paragraphs schema in the site before the content model is reviewed.

## 7. Timeline component

`timeline.html` demonstrates the three-year PROPEL timeline on its own. It does not replace the rest of the PROPEL page, and it is not a patch to president.asu.edu.

The component root is `[data-propel-timeline]`. `npm run build` also writes:

- `dist/timeline.html`
- `dist/assets/propel-timeline.js`
- `dist/assets/propel-timeline.css`

The script assigns `window.PropelTimeline.mount`. Mounting is idempotent and uses `data-propel-timeline-ready`. Call `controller.destroy()` on a Drupal detach with trigger `unload`.

The timeline is one continuous vertical list. Milestones alternate left and right around a center line at 768px and above. Below 768px the line moves to the left and every milestone sits to its right. The markup does not depend on the script: the year links are normal anchors (`#infrastructure`, `#expansion`, `#implementation`, then `#president-story`, `#p-latest`, `#p-2031`, and `#p-2025` through `#p-2002`), and the text is in the page.

The three PROPEL stages come first. The Office of the President chronology follows, from the Michael M. Crow quote through 2002, using the wording, Learn more URLs, and pictures saved from president.asu.edu. The year nav is two rows: the three PROPEL stages, then a horizontally scrolling strip of the later years. A spacer after the closing links lets the last year and those links scroll up under the sticky bar.

The script measures scroll position and fills the line to match the reading position. It does not report project completion. It sets `aria-current="location"` on the year in view, announces that year, and writes the hash with `replaceState` while scrolling or `pushState` when a year link is used. A year counts as current once its top is just under the sticky nav, so a short year such as Full implementation stays selected when its heading is the one on screen. Jumps longer than about 1600px are instant; shorter jumps stay smooth. Arrow keys move through every year link. `prefers-reduced-motion` and `?motion=reduce` leave every block visible and skip the reveal.

PROPEL copy is read from `src/content/site.ts` through `src/content/timeline.ts`. Change the stage paragraphs there; do not edit the rendered sentences in the template. The first sentence of a stage introduces the year. Later sentences become milestones. Year-one goals stay one block, with the note that they are goals rather than results. The presidential entries live in `src/content/president-timeline.ts`, and their pictures are in `public/media/president/`.

Set `--tl-sticky-offset` to the sticky Webspark header height if the script is not measuring a `.timeline-review__bar`. The year headings use `scroll-margin-top: var(--tl-scroll-pad)`. Visual values live on `.propel-timeline` in `src/styles/timeline.css`.

Do not load `timeline-review` page styles onto a Webspark page. Those belong to the local demonstration bar. Gold is limited to the year markers (black type on gold). The reading line is maroon.

## 8. What needs approval or adaptation

- Placement on an official ASU page, including whether this replaces or supplements the current PROPEL pages.
- Web standards review: heading outline beside the Webspark page title, skip link, focus, contrast, and 200% zoom.
- The prototype header is not the Unity Design System global header. Use `data-show-chrome="false"` and the site header.
- Gold is used for rules, nodes, and strokes. Gold text on white, white text on gold, maroon text on black, and black text on maroon are avoided. Confirm any new color pairing against the brand guide.
- No ASU logo or PROPEL logo is included. Use approved marks only after brand review.
- Motion is a stage transition of about 680ms, inside ASU’s range for a large structural move. Reduced motion follows the operating system, and `?motion=reduce` forces it. There is no continuously running animation.
- The public pages disagree on tier numbering and on Signals 2.0 versus Analytics Integrator 2.0. See `assumptions.md` before publishing those phrases in Drupal.
- Analytics, embedded video, and third-party chat are out of scope. Do not add them during integration without a separate review.

No database, API key, or external request is required to render the experience.
