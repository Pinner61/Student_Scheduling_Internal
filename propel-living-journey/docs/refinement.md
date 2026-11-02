# Refinement notes

Visual and editorial pass on the existing Vite prototype. The scheduling app at the repository root was left alone.

## What changed

- The hero is a compact two-column introduction. The headline is “Building a future where every student can flourish.” The right side is a labeled preview of all three years, from a single line to a joined network.
- The sticky timeline now draws that same transformation: foundation marks in year one, branches labeled Tiers, Communities, and Coaches in year two, and joining paths in year three. Stage captions and the navigation stay in agreement.
- Story chapters use one sentence plus the initiative list. Longer source detail stays behind “Year one / two / three in more detail.”
- Overview is a three-part roadmap on one horizontal rule, with the same sentences and initiatives, and the same expandable detail. Choosing Overview replaces the story and changes the header context to “Roadmap overview.”
- The four pillars sit in a two-column module: a large maroon diagram beside the explanation. The selected node and its connection are emphasized.
- The close is a short ending on the same paper, with the resolved network and a link to the official PROPEL site.
- Visitor-facing disclaimers were removed from the interface. The one public date note remains. The longer caveats are in `docs/assumptions.md`.
- Content width is 1280px. Section type is smaller. Chapters are no longer forced to a full viewport of empty space.

## Checks

- `npm test`: 6 passed.
- `npm run typecheck`: passed.
- Production build writes `dist/assets/propel-journey.js` and `dist/assets/propel-journey.css`.
- Browser review at 1440×900, 1280×800, 1024×768, 768×1024, 390×844, and 320×700. `scrollWidth` did not exceed the viewport at those sizes, or at 720×450 as a stand-in for 1440px viewed at 200% zoom.
- Story next/previous, Overview header context, and pillar selection were exercised on the desktop viewport.
