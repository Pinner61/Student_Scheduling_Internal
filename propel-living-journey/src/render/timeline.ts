import { presidentYears } from "../content/president-timeline";
import { site } from "../content/site";
import { timelineYears, type TimelineEventView, type TimelineYearView } from "../content/timeline";
import { escapeHtml } from "./escape";

/**
 * Continuous vertical timeline.
 * Official stage copy is arranged once, alternating around a center spine.
 * Scroll progress, year jumps, and reveals are added in `behavior/timeline.ts`.
 * Without that script the full text, links, and spine are still readable.
 */
export function renderTimeline(): string {
  const { journey } = site;
  const propel = timelineYears();
  const lastSide = propel.at(-1)?.events.at(-1)?.side ?? "right";
  const years = [...propel, ...presidentYears(lastSide === "left" ? "right" : "left")];
  const propelNav = propel
    .map((year, index) => linkFor(year, index === 0))
    .join("");
  const archiveNav = years
    .slice(propel.length)
    .map((year) => linkFor(year, false))
    .join("");

  return `<section class="propel-timeline" id="propel-timeline" aria-labelledby="propel-timeline-title">
    <header class="propel-timeline__intro">
      <p class="propel-timeline__eyebrow">${escapeHtml(journey.eyebrow)}</p>
      <h1 id="propel-timeline-title">${escapeHtml(journey.heading)}</h1>
      <p class="propel-timeline__lede">${escapeHtml(journey.lede)}</p>
      <p class="propel-timeline__caption">The maroon line follows your place in the reading. It is not a project-completion status.</p>
    </header>
    <nav class="propel-timeline__nav" aria-label="Timeline years">
      <div class="propel-timeline__nav-primary">${propelNav}</div>
      <div class="propel-timeline__nav-years">${archiveNav}</div>
    </nav>
    <div class="propel-timeline__track">
      <div class="propel-timeline__axis" aria-hidden="true"><span class="propel-timeline__axis-progress"></span></div>
      <ol class="propel-timeline__years">
        ${years.map((year) => renderYear(year)).join("")}
      </ol>
    </div>
    <p class="propel-timeline__close"><a href="${escapeHtml(site.identity.officialUrl)}">Read the official PROPEL page</a> <a href="https://president.asu.edu/">Office of the President timeline</a></p>
    <div class="propel-timeline__end-space" aria-hidden="true"></div>
    <p class="propel-timeline__live" data-timeline-live aria-live="polite"></p>
  </section>`;
}

function linkFor(year: TimelineYearView, current: boolean): string {
  const state = current ? ` aria-current="location"` : "";
  const name =
    year.name && year.name !== year.number
      ? `<span class="propel-timeline__nav-name">${escapeHtml(year.name)}</span>`
      : "";
  return `<a href="#${year.id}"${state}><span class="propel-timeline__nav-index">${escapeHtml(year.number)}</span>${name}</a>`;
}

function renderYear(year: TimelineYearView): string {
  const spoken = `${year.yearLabel}, ${year.name}`;
  return `<li class="propel-timeline__year propel-timeline__reveal" id="${year.id}" data-year-spoken="${escapeHtml(spoken)}">
    <div class="propel-timeline__year-copy">
      <p class="propel-timeline__kicker">${escapeHtml(year.yearLabel)}</p>
      <h2 id="timeline-${year.id}-title">${escapeHtml(year.name)}</h2>
      ${year.summary ? `<p>${escapeHtml(year.summary)}</p>` : ""}
      ${year.moreHref ? `<p class="propel-timeline__more"><a href="${escapeHtml(year.moreHref)}">${escapeHtml(year.moreLabel || "Learn more")}</a></p>` : ""}
    </div>
    <div class="propel-timeline__year-mark" aria-hidden="true"><span class="propel-timeline__year-index">${escapeHtml(year.number)}</span></div>
    <ol class="propel-timeline__events">
      ${year.events.map((event) => renderEvent(event)).join("")}
    </ol>
  </li>`;
}

function renderEvent(event: TimelineEventView): string {
  const image = event.image
    ? `<figure class="propel-timeline__figure${event.image.small ? " is-mark" : ""}"><img src="${escapeHtml(event.image.src)}" alt="${escapeHtml(event.image.alt)}" width="${event.image.width}" height="${event.image.height}" loading="lazy" decoding="async"><figcaption>${escapeHtml(event.image.credit)}</figcaption></figure>`
    : "";
  const more = event.href
    ? `<p class="propel-timeline__more"><a href="${escapeHtml(event.href)}">Learn more<span class="propel-timeline__sr"> about ${escapeHtml(event.title)}</span></a></p>`
    : "";
  const body = event.body ? `<p>${escapeHtml(event.body)}</p>` : "";
  const note = event.note ? `<p class="propel-timeline__note">${escapeHtml(event.note)}</p>` : "";
  const goals = event.goals?.length
    ? `<ol class="propel-timeline__goals">${event.goals
        .map(
          (goal) =>
            `<li><h4>${escapeHtml(goal.title)}</h4><p>${escapeHtml(goal.detail)}</p></li>`,
        )
        .join("")}</ol>`
    : "";

  return `<li class="propel-timeline__event is-${event.side} propel-timeline__reveal" id="${event.id}">
    <div class="propel-timeline__node" data-timeline-node aria-hidden="true"></div>
    <div class="propel-timeline__event-body">
      <p class="propel-timeline__kicker">${escapeHtml(event.kicker)}</p>
      <h3 id="${event.id}-title">${escapeHtml(event.title)}</h3>
      ${body}
      ${note}
      ${goals}
      ${image}
      ${more}
    </div>
  </li>`;
}
