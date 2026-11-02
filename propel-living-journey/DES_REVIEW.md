# PROPEL page — review notes

Local prototype for University College design review. It is not deployed, not on the ASU website, and not an approved production theme.

Open it from `propel-living-journey` with `npm install` and `npm run dev`, then visit http://localhost:5173/.

## What changed from the official website

The official pages remain the source for the words: [universitycollege.asu.edu/propel](https://universitycollege.asu.edu/propel) and the [project listing](https://universitycollege.asu.edu/projects/project-propel). This prototype keeps that language and recomposes it as one page.

- The hero is “PROPEL: Empowered to flourish,” with the published subtitle.
- Real-time insights, adaptive support, and human connection stay together.
- “What’s wrong?” and “What’s possible?” are a split panel, followed by the published explanation and “PROPEL is different.”
- The four pillars are one diagram. Choosing a pillar opens the published description and the existing illustration.
- Tier 3 is universal support, Tier 2 is targeted support, and Tier 1 is intensive support.
- The three years are one pathway. Choosing a year changes the pathway and the panel together.
- The team, the donor note, and the closing sentence are included.
- The contact form uses the live field names. It does not send mail until an endpoint is configured. See `docs/contact-form.md`.

## How to move through it

- The bar under the header jumps to Flourishing, Why it matters, Pillars, Tiers, Journey, Team, and Contact.
- Pillar names, tier names, and year names are the controls. Previous and Next sit on the pathway.
- `#infrastructure`, `#expansion`, and `#implementation` open those years.
- `?motion=reduce` skips the transitions.

## Assumptions waiting for approval

- The curved links are a picture of the published model: each pillar supports the student, and each year follows the last. They are not a system diagram or an org chart.
- Tier numbers follow the request and the page’s “tier three” pilot: Tier 3 universal, Tier 2 targeted, Tier 1 intensive. The marketing page spells the tiers out and does not use “Tier 1” for universal support.
- The project window is read from the listing’s start `11/25` and end `11/28` as November 2025 – November 2028. No dates inside that window were added.
- Year one on the marketing page is written as established, including the sentence about measurable improvement. No figure is published, and none was added. The listing’s year-one items are labeled as goals, not results. The 500 LEAD students are the published pilot cohort.
- The listing’s older “Signals 2.0” wording is not used. The page says Analytics Integrator 2.0.
- Team photographs and pillar illustrations are the files published on the PROPEL page, saved locally so the review does not depend on hotlinking. Phil Arcuria’s published portrait is low resolution.
- ASU maroon `#8C1D40` and gold `#FFC627` are used. Gold is for rules, the pathway, and the active year kicker, not for body text on white. Type is Arial. The header uses the public horizontal ASU logo from Webspark.

## What Drupal integration would require

The prototype is a Vite module with a mount point, not a Drupal theme. `docs/drupal-integration.md` describes the library, the mount element, and `data-show-chrome="false"`. The contact form still needs the existing webform or another approved receiver.

No change was made to a live ASU site, the scheduler app in this repository, or a remote repository.
