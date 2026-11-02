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

`data-show-chrome="false"` hides the prototype header so the Webspark header and footer remain the site chrome. The Story / Overview switch is inside the experience and stays visible.

The mount function expects the semantic markup to already be inside that element: hero, story, overview, pillars, and closing. This prototype generates that markup from `src/content/roadmap.ts` at build time. For a first Drupal placement, the rendered HTML from `dist/index.html` (the contents of `#propel-root`) can be pasted into Twig. A later step can replace that paste with fields. See section 6.

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

`mountPropelJourney` is idempotent. It stores the controller in a `WeakMap` and sets `data-propel-initialized="true"` on the root. A second call returns the existing controller and does not add another scroll listener.

On detach with trigger `unload`, call `controller.destroy()`. That aborts listeners, disconnects the resize observer, and clears the initialized flag so a later attach can mount cleanly. Do not call `destroy()` on every `detach`, because Drupal also detaches during routine AJAX refreshes of unrelated regions.

## 6. Content in Drupal later

`src/content/roadmap.ts` is the editorial source for this prototype. A Drupal content model could replace it without changing the interaction code, as long as the render still produces the same structure and the same three stage ids.

A conservative mapping:

| Prototype field | Possible Drupal home |
| --- | --- |
| Identity, timeline note, official URL | A PROPEL landing node |
| Each year: label, name, epithet, summary, initiatives | A Paragraph type, one per stage, ordered |
| Expandable detail | A long-text field or nested paragraph on that stage |
| Each pillar name and body | Four paragraph items, or a fixed four-field group |
| Closing text | Fields on the landing node |

The visualization expects three stages in order and four pillars. Changing those counts means changing the path geometry, not only the fields.

Until an editor model is approved, keep copy in the prototype file and rebuild. Do not invent a Paragraphs schema in the site before the content model is reviewed.

## 7. What needs approval or adaptation

- Placement on an official ASU page, including whether this replaces or supplements the current PROPEL pages.
- Web standards review: heading outline beside the Webspark page title, skip link, focus, contrast, and 200% zoom.
- The prototype header is not the Unity Design System global header. Use `data-show-chrome="false"` and the site header.
- Gold is used for rules, nodes, and strokes. Gold text on white, white text on gold, maroon text on black, and black text on maroon are avoided. Confirm any new color pairing against the brand guide.
- No ASU logo or PROPEL logo is included. Use approved marks only after brand review.
- Motion, including the scroll-linked path. Reduced motion follows the operating system, and `?motion=reduce` forces it. Confirm that scroll-linked animation is acceptable.
- The public pages disagree on tier numbering and on Signals 2.0 versus Analytics Integrator 2.0. See `assumptions.md` before publishing those phrases in Drupal.
- Analytics, embedded video, and third-party chat are out of scope. Do not add them during integration without a separate review.

No database, API key, or external request is required to render the experience.
