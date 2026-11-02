import { roadmap } from "../content/roadmap";
import type { Stage } from "../types";
import { renderClosingNetwork, renderHeroFigure, renderJourneySvg, renderOverviewLine, renderPillarSvg } from "./diagrams";
import { escapeHtml, paragraphs } from "./escape";
import { stageFigure } from "./illustrations";

function stageHref(stage: Stage): string {
  return `#propel-stage-${stage.id}`;
}

function initiatives(items: readonly string[]): string {
  return `<ol class="initiatives">${items
    .map(
      (item, index) => `<li data-piece data-step="${index + 1}">
        <span class="ini-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="ini-text">${escapeHtml(item)}</span>
      </li>`,
    )
    .join("")}</ol>`;
}

function stageNavLink(stage: Stage): string {
  return `<li>
    <a class="stage-link" href="${stageHref(stage)}" data-stage-link="${stage.index}">
      <span class="nav-index">${escapeHtml(stage.number)}</span>
      <span class="nav-text">
        <span class="nav-name">${escapeHtml(stage.name)}</span>
        <span class="nav-epithet">${escapeHtml(stage.epithet)}</span>
      </span>
    </a>
  </li>`;
}

function renderStage(stage: Stage): string {
  const headingId = `propel-heading-${stage.id}`;
  return `<article class="chapter" id="propel-stage-${stage.id}" data-chapter data-stage-index="${stage.index}" aria-labelledby="${headingId}">
    <div class="chapter-marker" data-marker aria-hidden="true"></div>
    <div class="chapter-body">
      <header class="chapter-head reveal">
        <p class="chapter-kicker">
          <span class="chapter-num">${escapeHtml(stage.number)}</span>
          <span class="chapter-year">${escapeHtml(stage.yearLabel)}</span>
        </p>
        <h3 id="${headingId}">${escapeHtml(stage.name)}</h3>
        <p class="epithet">${escapeHtml(stage.epithet)}</p>
      </header>
      <div class="chapter-layout">
        ${stageFigure(stage.id, stage.figureCaption, `Fig. ${stage.index + 1}`)}
        <div class="chapter-copy">
          <div class="chapter-prose" data-piece data-step="0">${paragraphs(stage.summary)}</div>
          <h4 data-piece data-step="1">What this stage pursues</h4>
          ${initiatives(stage.initiatives)}
          <details class="further" data-piece data-step="${stage.initiatives.length}">
            <summary>${escapeHtml(stage.detail.heading)}</summary>
            <div class="further-panel">
              <p>${escapeHtml(stage.detail.intro)}</p>
              <ul>${stage.detail.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  </article>`;
}

function renderOverviewStage(stage: Stage): string {
  const sentence = stage.summary[0] ?? "";
  return `<article class="overview-card" id="propel-overview-${stage.id}">
    <span class="ov-mark" aria-hidden="true"></span>
    <p class="ov-num">${escapeHtml(stage.number)}</p>
    <p class="ov-meta">${escapeHtml(stage.yearLabel)} · ${escapeHtml(stage.epithet)}</p>
    <h3>${escapeHtml(stage.name)}</h3>
    <p class="ov-summary">${escapeHtml(sentence)}</p>
    <ul class="ov-list">${stage.initiatives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <details class="further">
      <summary>${escapeHtml(stage.detail.heading)}</summary>
      <div class="further-panel">
        <p>${escapeHtml(stage.detail.intro)}</p>
        <ul>${stage.detail.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </details>
  </article>`;
}

function renderHeader(): string {
  const { identity } = roadmap;
  return `<header class="site-header" id="propel-top">
    <a class="skip" href="#propel-main">Skip to content</a>
    <div class="header-inner">
      <a class="brand" href="#propel-top" data-chrome>
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-copy">
          <span class="brand-name">PROPEL</span>
          <span class="brand-sub">${escapeHtml(identity.title)}</span>
        </span>
      </a>
      <fieldset class="mode-switch">
        <legend class="sr">Presentation mode</legend>
        <label>
          <input type="radio" name="propel-mode" id="propel-mode-story" value="story" checked />
          <span>Story</span>
        </label>
        <label>
          <input type="radio" name="propel-mode" id="propel-mode-overview" value="overview" />
          <span>Overview</span>
        </label>
      </fieldset>
      <p class="header-now" data-header-stage data-chrome>${escapeHtml(roadmap.stages[0] ? `${roadmap.stages[0].yearLabel} · ${roadmap.stages[0].name}` : "")}</p>
      <p class="header-mode" data-chrome>Roadmap overview</p>
    </div>
  </header>`;
}

function renderHero(): string {
  const { hero, identity } = roadmap;

  return `<section class="hero" aria-labelledby="propel-hero-title">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
        <h1 id="propel-hero-title">${escapeHtml(hero.headline)}</h1>
        <p class="dek">${escapeHtml(hero.support)}</p>
        <p class="hero-window"><strong>${escapeHtml(identity.timeline)}.</strong> ${escapeHtml(identity.timelineNote)}</p>
        <a class="cta" href="#propel-journey" data-goto="story">
          <span>Explore the journey</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
            <path d="M12 4v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.75"></path>
          </svg>
        </a>
      </div>
      ${renderHeroFigure()}
    </div>
  </section>`;
}

function renderJourney(): string {
  const { journey, stages, overview } = roadmap;
  const labels = stages.map((stage) => `${stage.yearLabel}, ${stage.name}`);
  return `<section class="journey" id="propel-journey" aria-labelledby="propel-journey-title">
    <div class="story-panel">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(journey.eyebrow)}</p>
        <h2 id="propel-journey-title">${escapeHtml(journey.title)}</h2>
        <p class="lede">${escapeHtml(journey.lede)}</p>
      </div>
      <div class="story-layout">
        <div class="viz-column">
          <div class="viz-inner">
            <nav class="journey-nav" aria-label="Journey stages">
              <p class="nav-current" data-nav-current aria-hidden="true">${escapeHtml(stages[0] ? `${stages[0].yearLabel} · ${stages[0].name}` : "")}</p>
              <ol class="stage-list">
                ${stages.map(stageNavLink).join("")}
              </ol>
              <div class="nav-move">
                <button type="button" data-nav="prev" disabled aria-label="Previous stage">
                  <span aria-hidden="true">←</span>
                  <span class="nav-btn-label">Previous</span>
                </button>
                <button type="button" data-nav="next" aria-label="Next stage">
                  <span class="nav-btn-label">Next</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </nav>
            ${renderJourneySvg(stages.map(stageHref), labels)}
          </div>
        </div>
        <div class="chapters" data-chapters>
          <div class="mobile-rail" data-mobile-rail aria-hidden="true">
            <span class="mobile-rail-track"></span>
            <span class="mobile-rail-fill" data-rail-fill></span>
          </div>
          ${stages.map(renderStage).join("")}
        </div>
      </div>
    </div>
    <div class="overview-panel" id="propel-overview">
      <div class="section-intro">
        <p class="eyebrow">${escapeHtml(overview.eyebrow)}</p>
        <h2 id="propel-overview-title">${escapeHtml(overview.title)}</h2>
        <p class="lede">${escapeHtml(overview.lede)}</p>
      </div>
      <div class="overview-board">
        ${renderOverviewLine()}
        <div class="overview-grid">
          ${stages.map(renderOverviewStage).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function renderPillars(): string {
  const { pillars } = roadmap;
  const options = pillars.items
    .map(
      (pillar, index) => `<label class="pillar-option">
        <input type="radio" name="propel-pillar" value="${escapeHtml(pillar.id)}" ${index === 0 ? "checked" : ""} />
        <span class="pillar-option-num">${escapeHtml(pillar.number)}</span>
        <span class="pillar-option-name">${escapeHtml(pillar.name)}</span>
      </label>`,
    )
    .join("");
  const panels = pillars.items
    .map(
      (pillar) => `<article class="pillar-panel" id="propel-pillar-panel-${escapeHtml(pillar.id)}" data-pillar-panel="${escapeHtml(pillar.id)}">
        <h3>${escapeHtml(pillar.name)}</h3>
        ${paragraphs(pillar.body)}
      </article>`,
    )
    .join("");

  return `<section class="pillars" id="propel-pillars" aria-labelledby="propel-pillars-title">
    <div class="pillars-intro">
      <p class="eyebrow">${escapeHtml(pillars.eyebrow)}</p>
      <h2 id="propel-pillars-title">${escapeHtml(pillars.title)}</h2>
      <p class="lede">${escapeHtml(pillars.lede)}</p>
    </div>
    <div class="pillars-layout">
      <div class="pillar-map">${renderPillarSvg()}</div>
      <div class="pillar-read">
        <fieldset class="pillar-choices">
          <legend class="sr">Select a pillar. The explanation follows.</legend>
          ${options}
        </fieldset>
        <div class="pillar-panels">${panels}</div>
      </div>
    </div>
  </section>`;
}

function renderClose(): string {
  const { closing, identity } = roadmap;
  return `<footer class="close" id="propel-close">
    <div class="close-inner">
      <div class="close-copy">
        <p class="eyebrow">${escapeHtml(closing.eyebrow)}</p>
        <h2>${escapeHtml(closing.title)}</h2>
        ${paragraphs(closing.paragraphs)}
        <a class="close-link" href="${escapeHtml(identity.officialUrl)}">${escapeHtml(closing.linkLabel)}</a>
        <p class="close-meta">${escapeHtml(identity.institution)} · ${escapeHtml(identity.unit)}</p>
      </div>
      <div class="close-mark" aria-hidden="true">${renderClosingNetwork()}</div>
    </div>
  </footer>`;
}

export function renderExperience(): string {
  if (roadmap.stages.length !== 3) {
    throw new Error("PROPEL journey geometry is built for exactly three stages.");
  }
  if (roadmap.pillars.items.length !== 4) {
    throw new Error("PROPEL pillar diagram is built for exactly four pillars.");
  }
  return `${renderHeader()}
    <main id="propel-main" tabindex="-1">
      ${renderHero()}
      ${renderJourney()}
      ${renderPillars()}
    </main>
    ${renderClose()}`;
}
