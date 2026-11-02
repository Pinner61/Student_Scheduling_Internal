import { site } from "../content/site";
import type { Person } from "../types";
import { escapeHtml, paragraphs } from "./escape";
import { heroMark } from "./hero-mark";
import { pillarAnchors, pillarCenter } from "../viz/layout";

export function renderExperience(): string {
  return [
    `<a class="skip" href="#main">Skip to content</a>`,
    renderHeader(),
    `<main id="main">`,
    renderHero(),
    renderFlourish(),
    renderWhy(),
    renderPillars(),
    renderTiers(),
    renderJourney(),
    renderTeam(),
    renderDonors(),
    renderContact(),
    `</main>`,
    renderFooter(),
  ].join("");
}

function renderHeader(): string {
  const { identity, nav } = site;
  const links = nav
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`,
    )
    .join("");
  return `<header class="site-header">
    <div class="header-bar wrap">
      <a class="lockup" href="${escapeHtml(identity.asuUrl)}">
        <img class="asu-logo" src="./media/asu-logo.png" alt="Arizona State University" width="220" height="40">
      </a>
      <a class="unit-link" href="${escapeHtml(identity.unitUrl)}">${escapeHtml(identity.unit)}</a>
      <p class="header-project">${escapeHtml(identity.project)}</p>
      <a class="official-link" href="${escapeHtml(identity.officialUrl)}">Official page</a>
    </div>
    <nav class="page-nav" aria-label="On this page">
      <ul class="wrap">${links}</ul>
    </nav>
  </header>`;
}

function renderHero(): string {
  const { hero } = site;
  const legend = hero.legend
    .map((item, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(item)}</li>`)
    .join("");
  return `<section class="hero" id="top" aria-labelledby="hero-title">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
        <h1 id="hero-title">${escapeHtml(hero.title)}</h1>
        <p class="lede">${escapeHtml(hero.support)}</p>
        <div class="hero-actions">
          <a class="btn" href="${escapeHtml(hero.primaryHref)}">${escapeHtml(hero.primaryLabel)}</a>
          <a class="btn btn-gold" href="${escapeHtml(hero.secondaryHref)}">${escapeHtml(hero.secondaryLabel)}</a>
        </div>
      </div>
      <figure class="hero-figure">
        ${heroMark()}
        <figcaption>
          <p>${escapeHtml(hero.caption)}</p>
          <ol class="hero-legend">${legend}</ol>
        </figcaption>
      </figure>
    </div>
  </section>`;
}

function figure(item: { src: string; alt: string; width: number; height: number }): string {
  return `<figure class="story-figure"><img class="frame-img" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" width="${item.width}" height="${item.height}" decoding="async"></figure>`;
}

function renderFlourish(): string {
  const { flourish } = site;
  const concepts = flourish.concepts
    .map((item, index) =>
      choice({
        name: "propel-concept",
        id: `concept-${item.id}`,
        checked: index === 0,
        className: "concept-choice",
        label: `<img class="concept-icon frame-img" src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.iconAlt)}" width="834" height="834" decoding="async"><span class="choice-index">${escapeHtml(item.number)}</span><span class="choice-title">${escapeHtml(item.name)}</span><span class="choice-body">${escapeHtml(item.summary)}</span>`,
      }),
    )
    .join("");
  return `<section class="section" id="flourish" aria-labelledby="flourish-title">
    <div class="wrap">
      <div class="media-split">
        ${figure(flourish.figure)}
        <div>
          <p class="eyebrow">The student, whole</p>
          <h2 id="flourish-title">${escapeHtml(flourish.heading)}</h2>
          <p class="measure">${escapeHtml(flourish.lede)}</p>
        </div>
      </div>
      <div class="imagine">
        <h3>${escapeHtml(flourish.imagine)}</h3>
        <p>${escapeHtml(flourish.imagineBody)}</p>
      </div>
      <fieldset class="concepts">
        <legend class="visually-hidden">Three parts of the student approach</legend>
        ${concepts}
      </fieldset>
      <blockquote class="pull"><p>${escapeHtml(flourish.close)}</p></blockquote>
    </div>
  </section>`;
}

function renderWhy(): string {
  const { why } = site;
  const oldItems = why.traditionalItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const newItems = why.possibleItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const [lead, ...rest] = why.paragraphs;
  return `<section class="section section-why band-dark" id="why" aria-labelledby="why-title">
    <div class="wrap">
      <div class="media-split why-lead">
        <div>
          <h2 id="why-title">${escapeHtml(why.heading)}</h2>
          <p class="why-lead-copy">${escapeHtml(lead)}</p>
        </div>
        ${figure(why.figure)}
      </div>
      <hr class="gold-rule">
      <div class="measure prose">${paragraphs(rest)}</div>
      <div class="contrast" aria-label="From fragmented support to coordinated support">
        <article class="contrast-old">
          <p class="contrast-kicker">Traditional support</p>
          <h3>${escapeHtml(why.traditionalTitle)}</h3>
          <p>${escapeHtml(why.traditionalBody)}</p>
          <ul>${oldItems}</ul>
        </article>
        <article class="contrast-new">
          <p class="contrast-kicker">PROPEL</p>
          <h3>${escapeHtml(why.possibleTitle)}</h3>
          <p>${escapeHtml(why.possibleBody)}</p>
          <ul>${newItems}</ul>
        </article>
      </div>
      <h2 id="different">${escapeHtml(why.differentHeading)}</h2>
      <div class="measure prose">${paragraphs(why.different)}</div>
    </div>
  </section>`;
}

function renderPillars(): string {
  const { pillars } = site;
  const slots = pillars.items
    .map((item, index) => {
      const anchor = pillarAnchors.find((entry) => entry.id === item.id);
      const x = anchor?.x ?? 50;
      const y = anchor?.y ?? 50;
      return `<div class="pillar-slot" style="left:${x}%;top:${y}%">${choice({
        name: "propel-pillar",
        id: `pillar-${item.id}`,
        hash: item.id,
        checked: index === 0,
        className: "pillar-choice",
        label: `<span class="choice-index">${escapeHtml(item.number)}</span><span class="choice-title">${escapeHtml(item.node)}</span><span class="choice-body">${escapeHtml(item.role)}</span>`,
      })}</div>`;
    })
    .join("");
  const panels = pillars.items
    .map(
      (item) => `<article class="pillar-panel" id="panel-${item.id}" aria-labelledby="${item.id}">
        <div class="pillar-copy">
          <h3>${escapeHtml(item.heading)}</h3>
          ${paragraphs(item.paragraphs)}
        </div>
        <img class="pillar-art frame-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}" width="988" height="834" decoding="async">
      </article>`,
    )
    .join("");
  return `<section class="section" id="pillars" aria-labelledby="pillars-title">
    <div class="wrap">
      <div class="media-split">
        <div>
          <p class="eyebrow">${escapeHtml(pillars.eyebrow)}</p>
          <h2 id="pillars-title">${escapeHtml(pillars.heading)}</h2>
          <div class="measure prose">${paragraphs(pillars.lede)}</div>
        </div>
        ${figure(pillars.figure)}
      </div>
      <fieldset class="pillar-field">
        <legend class="visually-hidden">Choose a pillar</legend>
        <div class="pillar-map" id="pillar-map">
          <svg class="pillar-svg" viewBox="0 0 1000 420" aria-hidden="true" focusable="false"></svg>
          <div class="pillar-nodes">
            ${slots}
            <p class="pillar-center" style="left:${pillarCenter.x}%;top:${pillarCenter.y}%"><span>The student</span>Where the pillars meet</p>
          </div>
        </div>
      </fieldset>
      <p class="relationship">${escapeHtml(pillars.relationship)} Data informs care, care honors agency, and agency is strengthened by insight.</p>
      <div class="pillar-panels">${panels}</div>
    </div>
  </section>`;
}

function renderTiers(): string {
  const { tiers } = site;
  const bands = tiers.items
    .map((item, index) =>
      `<div class="tier-row ${item.id}">${choice({
        name: "propel-tier",
        id: item.id,
        hash: item.id,
        checked: index === 0,
        className: `tier-choice ${item.id}`,
        label: `<span class="tier-reach" aria-hidden="true"></span><img class="tier-icon frame-img" src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.iconAlt)}" width="54" height="54" decoding="async"><span class="choice-index">${escapeHtml(item.number)}</span><span class="choice-title">${escapeHtml(item.name)}</span><span class="choice-body">${escapeHtml(item.line)}</span>`,
      })}</div>`,
    )
    .join("");
  const panels = tiers.items
    .map((item) => {
      const nest = tiers.items
        .map((band) => {
          const current = band.id === item.id ? " is-current" : "";
          return `<p class="nest nest-${band.id}${current}"><span class="nest-index">${escapeHtml(band.number)}</span><span class="nest-name">${escapeHtml(band.name)}</span></p>`;
        })
        .join("");
      const includes = item.includes.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
      return `<article class="tier-panel" id="panel-${item.id}" aria-labelledby="${item.id}">
        <h3>${escapeHtml(item.number)} — ${escapeHtml(item.name)}</h3>
        ${paragraphs(item.paragraphs)}
        <h4>In this tier</h4>
        <ul class="tier-includes">${includes}</ul>
        <div class="tier-nest" aria-hidden="true">
          <p class="nest-kicker">Reach narrows as support becomes more personal</p>
          ${nest}
        </div>
      </article>`;
    })
    .join("");
  return `<section class="section section-tiers" id="tiers" aria-labelledby="tiers-title">
    <div class="wrap tier-layout">
      <div>
        <p class="eyebrow">${escapeHtml(tiers.eyebrow)}</p>
        <h2 id="tiers-title">${escapeHtml(tiers.heading)}</h2>
        <p>${escapeHtml(tiers.lede)}</p>
        <fieldset class="tier-stack">
          <legend class="visually-hidden">Choose a support tier</legend>
          ${bands}
        </fieldset>
      </div>
      <div class="tier-panels">${panels}</div>
    </div>
  </section>`;
}

function renderJourney(): string {
  const { journey, identity } = site;
  const picks = journey.stages
    .map((stage, index) =>
      choice({
        name: "propel-year",
        id: `year-${stage.id}`,
        hash: stage.id,
        checked: index === 0,
        className: "year-choice",
        label: `<span class="choice-index">${escapeHtml(stage.number)}</span><span class="choice-kicker">${escapeHtml(stage.yearLabel)}</span><span class="choice-title">${escapeHtml(stage.name)}</span>`,
      }),
    )
    .join("");
  const panels = journey.stages
    .map((stage) => {
      const milestones = stage.milestones
        .map(
          (item) => `<details class="milestone" id="ms-${item.id}">
            <summary>${escapeHtml(item.label)}</summary>
            <p>${escapeHtml(item.detail)}</p>
          </details>`,
        )
        .join("");
      const goals = stage.goals
        ? `<div class="goals"><h4>Year-one goals</h4><p class="goal-note">Published on the University College project listing as goals for the work, not as results.</p><ol>${stage.goals
            .map(
              (goal) =>
                `<li><strong>${escapeHtml(goal.title)}</strong> ${escapeHtml(goal.detail)}</li>`,
            )
            .join("")}</ol></div>`
        : "";
      return `<article class="stage-panel" id="panel-${stage.id}" aria-labelledby="${stage.id}">
        <p class="eyebrow">${escapeHtml(stage.yearLabel)}</p>
        <h3>${escapeHtml(stage.name)}</h3>
        ${paragraphs(stage.paragraphs)}
        <div class="milestones"><h4>Milestones</h4>${milestones}</div>
        ${goals}
      </article>`;
    })
    .join("");
  return `<section class="section section-journey band-dark" id="journey" aria-labelledby="journey-title">
    <div class="wrap">
      <p class="eyebrow">${escapeHtml(journey.eyebrow)}</p>
      <h2 id="journey-title">${escapeHtml(journey.heading)}</h2>
      <p class="measure">${escapeHtml(journey.lede)}</p>
      <p class="timeline-demo"><a href="./timeline.html">Open the timeline prototype</a></p>
      <p class="window">Project window ${escapeHtml(identity.window)}</p>
      <div class="pathway">
        <div class="pathway-line">
          <button class="step step-prev" type="button" data-year-step="-1">Previous</button>
          <svg class="pathway-svg" viewBox="0 0 900 120" aria-hidden="true" focusable="false"></svg>
          <button class="step step-next" type="button" data-year-step="1">Next</button>
          <fieldset class="year-picks">
            <legend class="visually-hidden">Choose an implementation year</legend>
            ${picks}
          </fieldset>
        </div>
      </div>
      <p class="visually-hidden" data-year-live aria-live="polite"></p>
      <div class="stage-panels" id="stage-panels">${panels}</div>
    </div>
  </section>`;
}

function splitTitle(title: string): { role: string; unit: string } {
  const index = title.indexOf(",");
  if (index < 0) return { role: title, unit: "" };
  return { role: title.slice(0, index).trim(), unit: title.slice(index + 1).trim() };
}

function personArticle(person: Person, nameTag: "h3" | "h4"): string {
  const { role, unit } = splitTitle(person.title);
  const unitHtml = unit ? `<span class="person-unit">${escapeHtml(unit)}</span>` : "";
  return `<article class="person">
    <div class="portrait" data-initials="${escapeHtml(person.initials)}">
      <img class="frame-img" src="${escapeHtml(person.image)}" alt="" width="240" height="240" loading="lazy" decoding="async">
    </div>
    <div class="person-copy">
      <${nameTag}>${escapeHtml(person.name)}</${nameTag}>
      <p class="person-title"><span class="person-role">${escapeHtml(role)}</span>${unit ? `<span class="visually-hidden">, </span>` : ""}${unitHtml}</p>
    </div>
  </article>`;
}

function renderTeam(): string {
  const { team } = site;
  const principal = team.groups.find((group) => group.id === "principal");
  const lead = principal?.people[0];
  const leadTitle = lead ? splitTitle(lead.title) : null;
  const feature = lead && leadTitle
    ? `<article class="person person-feature">
        <div class="portrait" data-initials="${escapeHtml(lead.initials)}">
          <img class="frame-img" src="${escapeHtml(lead.image)}" alt="" width="240" height="240" loading="lazy" decoding="async">
        </div>
        <div class="person-copy">
          <p class="person-kicker">${escapeHtml(principal?.heading ?? "")}</p>
          <h3>${escapeHtml(lead.name)}</h3>
          <p class="person-title"><span class="person-role">${escapeHtml(leadTitle.role)}</span>${leadTitle.unit ? `<span class="visually-hidden">, </span><span class="person-unit">${escapeHtml(leadTitle.unit)}</span>` : ""}</p>
        </div>
      </article>`
    : "";
  const groups = team.groups
    .filter((group) => group.id !== "principal")
    .map((group) => {
      const people = group.people.map((person) => personArticle(person, "h4")).join("");
      return `<div class="team-group team-${group.id}">
        <h3>${escapeHtml(group.heading)}</h3>
        <div class="people">${people}</div>
      </div>`;
    })
    .join("");
  return `<section class="section section-team" id="team" aria-labelledby="team-title">
    <div class="wrap">
      <header class="team-intro">
        <div>
          <p class="eyebrow">${escapeHtml(team.eyebrow)}</p>
          <h2 id="team-title">${escapeHtml(team.heading)}</h2>
        </div>
        <p class="team-lede">${escapeHtml(team.lede)}</p>
      </header>
      ${feature}
      ${groups}
    </div>
  </section>`;
}

function renderDonors(): string {
  const { donors } = site;
  const marked = escapeHtml(donors.statement).replace(
    /flourish\.$/,
    '<mark class="flourish-mark">flourish.</mark>',
  );
  return `<section class="donors band-dark" id="donors" aria-labelledby="donors-title">
    <div class="wrap donor-grid">
      ${figure(donors.figure)}
      <div>
        <h2 id="donors-title">${escapeHtml(donors.heading)}</h2>
        <p class="measure">${escapeHtml(donors.body)}</p>
        <p class="statement">${marked}</p>
      </div>
    </div>
  </section>`;
}

function renderContact(): string {
  const { contact } = site;
  return `<section class="section section-contact band-dark" id="contact" aria-labelledby="contact-title">
    <svg class="contact-network" viewBox="0 0 1200 640" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#8d8d8d" stroke-width="1">
        <path d="M40 520 L180 430 L320 470 L470 360 L640 410 L820 300 L980 340 L1140 220" />
        <path d="M120 180 L260 240 L430 160 L590 230 L760 140 L940 210 L1100 120" />
        <path d="M180 430 L260 240 M470 360 L430 160 M640 410 L590 230 M820 300 L760 140 M980 340 L940 210" />
      </g>
      <g fill="#cfcfcf">
        <circle cx="40" cy="520" r="3" /><circle cx="180" cy="430" r="3.5" /><circle cx="320" cy="470" r="3" />
        <circle cx="470" cy="360" r="4" /><circle cx="640" cy="410" r="3" /><circle cx="820" cy="300" r="4" />
        <circle cx="980" cy="340" r="3" /><circle cx="1140" cy="220" r="3" /><circle cx="120" cy="180" r="3" />
        <circle cx="260" cy="240" r="3.5" /><circle cx="430" cy="160" r="3" /><circle cx="590" cy="230" r="4" />
        <circle cx="760" cy="140" r="3" /><circle cx="940" cy="210" r="3.5" /><circle cx="1100" cy="120" r="3" />
      </g>
    </svg>
    <div class="wrap contact-layout">
      <div>
        <p class="eyebrow">${escapeHtml(contact.eyebrow)}</p>
        <h2 id="contact-title">${escapeHtml(contact.heading)}</h2>
        <p>${escapeHtml(contact.lede)}</p>
        <p class="form-note" id="form-note">${escapeHtml(contact.note)}</p>
      </div>
      <form class="contact-form" id="propel-contact" method="post" action="#contact" novalidate data-propel-form onsubmit="event.preventDefault()">
        <div class="hp" aria-hidden="true">
          <label for="company">Company</label>
          <input id="company" name="company" type="text" tabindex="-1" autocomplete="off">
        </div>
        <div class="field">
          <label for="first-name">First name</label>
          <input id="first-name" name="first_name" type="text" autocomplete="given-name" maxlength="255" required aria-describedby="error-first-name">
          <p class="field-error" id="error-first-name" hidden></p>
        </div>
        <div class="field">
          <label for="last-name">Last name</label>
          <input id="last-name" name="last_name" type="text" autocomplete="family-name" maxlength="255" required aria-describedby="error-last-name">
          <p class="field-error" id="error-last-name" hidden></p>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="error-email">
          <p class="field-error" id="error-email" hidden></p>
        </div>
        <div class="field">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="6" maxlength="5000" required aria-describedby="error-message"></textarea>
          <p class="field-error" id="error-message" hidden></p>
        </div>
        <p class="form-status" id="form-status" role="status" aria-live="assertive"></p>
        <button class="btn" type="submit">Submit</button>
        <noscript><p>With JavaScript off, this review build still cannot deliver the message. The Drupal webform token is not available here.</p></noscript>
      </form>
    </div>
  </section>`;
}

function renderFooter(): string {
  const { footer, identity } = site;
  const links = footer.links
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("");
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="footer-brand">${escapeHtml(identity.institution)}</p>
        <p>${escapeHtml(identity.unit)}</p>
        <p class="footer-note">${escapeHtml(footer.note)}</p>
      </div>
      <ul class="footer-links">${links}</ul>
      <p class="back"><a href="#top">Back to top</a></p>
    </div>
  </footer>`;
}

function choice(options: {
  name: string;
  id: string;
  hash?: string;
  checked?: boolean;
  className: string;
  label: string;
}): string {
  const inputId = `${options.id}-input`;
  const hash = options.hash ? ` data-hash="${escapeHtml(options.hash)}"` : "";
  const labelId = options.hash ? ` id="${escapeHtml(options.hash)}"` : "";
  const checked = options.checked ? " checked" : "";
  return `<div class="choice ${options.className}">
    <input type="radio" name="${escapeHtml(options.name)}" id="${escapeHtml(inputId)}"${hash}${checked}>
    <label${labelId} for="${escapeHtml(inputId)}">${options.label}</label>
  </div>`;
}
