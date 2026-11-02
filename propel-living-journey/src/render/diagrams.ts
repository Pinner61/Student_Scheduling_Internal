import { roadmap } from "../content/roadmap";
import {
  expansionBranchLabels,
  expansionBranches,
  flourishingLinks,
  foundationMarks,
  journeySpine,
  journeySpinePath,
  journeyView,
  linearPath,
  livingPath,
  overviewLine,
  pillarLayout,
  stageNodePoints,
} from "../viz/geometry";
import { escapeHtml } from "./escape";

function path(d: string, className: string, extra = ""): string {
  return `<path class="${className}" pathLength="1" d="${escapeHtml(d)}" ${extra}></path>`;
}

/**
 * A compact preview of the whole journey: one line, then branches, then a joined network.
 * Coordinates are designed for the hero column, not generated from the scroll spine.
 */
export function renderHeroFigure(): string {
  const [first, second, third] = roadmap.stages;
  const spine = "M70 18 L70 78 C70 124 112 146 112 178 C112 232 62 248 62 286";
  const branches = [
    "M112 178 C156 148 196 136 236 126",
    "M112 178 C164 178 204 190 242 198",
    "M112 178 C156 214 188 240 220 262",
  ];
  const joins = ["M236 126 L62 286", "M242 198 L62 286", "M220 262 L62 286", "M236 126 L242 198 L220 262"];
  const grounds = ["M18 112 H122", "M32 124 H108", "M46 136 H94"];
  const nodes = [
    [70, 78],
    [112, 178],
    [62, 286],
    [236, 126],
    [242, 198],
    [220, 262],
  ];

  const label = (stage: (typeof roadmap.stages)[number] | undefined, y: number, lines?: [string, string]) => {
    if (!stage) return "";
    const name = lines
      ? `<text class="hero-name" x="42" y="${y - 8}">${escapeHtml(lines[0])}</text><text class="hero-name" x="42" y="${y + 10}">${escapeHtml(lines[1])}</text>`
      : `<text class="hero-name" x="42" y="${y}">${escapeHtml(stage.name)}</text>`;
    return `<text class="hero-num" x="0" y="${y}">${escapeHtml(stage.number)}</text>${name}`;
  };

  return `<figure class="hero-figure">
    <svg class="hero-svg" viewBox="0 0 540 360" role="img" aria-labelledby="propel-hero-fig">
      <title id="propel-hero-fig">PROPEL across three years: a single foundation, branching support, then one joined network.</title>
      <g class="hero-labels">
        ${label(first, 86)}
        ${label(second, 186)}
        ${label(third, 286, ["Full", "implementation"])}
      </g>
      <g class="hero-map" transform="translate(214 8)">
        ${grounds.map((d) => path(d, "draw draw-ground")).join("")}
        ${path(spine, "draw draw-axis")}
        ${path(spine, "draw draw-gold")}
        ${branches.map((d, index) => path(d, "draw draw-branch", `data-index="${index}"`)).join("")}
        ${joins.map((d, index) => path(d, "draw draw-join", `data-index="${index}"`)).join("")}
        ${nodes
          .map(([x, y], index) => {
            return `<g><circle class="node-ring${index < 3 ? " node-major" : ""}" cx="${x}" cy="${y}" r="${index < 3 ? 8 : 5}"></circle><circle class="node-core" cx="${x}" cy="${y}" r="${index < 3 ? 3.2 : 2}"></circle></g>`;
          })
          .join("")}
      </g>
    </svg>
    <figcaption>Infrastructure, then expansion, then one connected system.</figcaption>
  </figure>`;
}

export function renderJourneySvg(stageHrefs: readonly string[], stageLabels: readonly string[]): string {
  const spine = journeySpinePath();
  const marks = foundationMarks()
    .map((d) => `<path class="foundation-mark" d="${escapeHtml(d)}"></path>`)
    .join("");
  const branches = expansionBranches
    .map((points, index) => {
      const end = points[points.length - 1];
      const label = expansionBranchLabels[index] ?? "";
      const d = escapeHtml(livingPath(points));
      return `<path class="network-path network-path-gold" data-grow="branch" data-index="${index}" pathLength="1" d="${d}"></path>
        <path class="network-path" data-grow="branch" data-index="${index}" pathLength="1" d="${d}"></path>
        <g data-grow-mark="branch" data-index="${index}">
          <circle class="network-dot" cx="${end.x}" cy="${end.y}" r="5"></circle>
          <text class="branch-label" x="${end.x}" y="${end.y - 12}" text-anchor="middle">${escapeHtml(label)}</text>
        </g>`;
    })
    .join("");
  const joins = flourishingLinks
    .map(
      (points, index) =>
        `<path class="network-path" data-grow="join" data-index="${index}" pathLength="1" d="${escapeHtml(livingPath(points))}"></path>`,
    )
    .join("");
  const ring = linearPath([...expansionEndsSafe(), expansionEndsSafe()[0]]);
  const captions = [
    { x: 152, y: 162, anchor: "start" },
    { x: 146, y: 332, anchor: "end" },
    { x: 152, y: 568, anchor: "start" },
  ];
  const captionMarkup = roadmap.stages
    .map((stage, index) => {
      const place = captions[index];
      if (!place) return "";
      return `<text class="viz-caption" data-caption="${index}" x="${place.x}" y="${place.y}" text-anchor="${place.anchor}">
        <tspan class="viz-kicker">${escapeHtml(stage.number)}</tspan>
        <tspan class="viz-name" x="${place.x}" dy="16">${escapeHtml(stage.name)}</tspan>
      </text>`;
    })
    .join("");
  const nodes = stageNodePoints
    .map((point, index) => {
      const href = stageHrefs[index] ?? "#";
      const label = stageLabels[index] ?? "Stage";
      return `<a class="stage-node" data-node="${index}" data-stage-link="${index}" href="${escapeHtml(href)}" tabindex="-1" transform="translate(${point.x} ${point.y})">
        <title>${escapeHtml(label)}</title>
        <circle class="node-hit" r="26"></circle>
        <circle class="node-ring" r="11"></circle>
        <circle class="node-core" r="4.5"></circle>
      </a>`;
    })
    .join("");
  const origin = journeySpine[0];

  return `<svg class="journey-svg" data-journey-viz viewBox="${journeyView.viewBox}" aria-hidden="true">
    <g class="layer-foundation">${marks}</g>
    <path class="spine-route" pathLength="1" d="${escapeHtml(spine)}"></path>
    <path class="spine-progress" data-progress pathLength="1" stroke-dasharray="0 1" d="${escapeHtml(spine)}"></path>
    <path class="spine-progress-gold" data-progress pathLength="1" stroke-dasharray="0 1" d="${escapeHtml(spine)}"></path>
    <g class="layer-expansion" data-layer="expansion">${branches}</g>
    <g class="layer-flourishing" data-layer="flourishing">
      ${joins}
      <path class="network-ring" data-grow="join" data-index="3" pathLength="1" d="${escapeHtml(ring)}"></path>
    </g>
    ${captionMarkup}
    <circle class="origin-node" cx="${origin.x}" cy="${origin.y}" r="4.5"></circle>
    ${nodes}
  </svg>`;
}

function expansionEndsSafe() {
  return expansionBranches.map((branch) => branch[branch.length - 1]);
}

export function renderPillarSvg(): string {
  const layout = pillarLayout(roadmap.pillars.items.map((item) => item.id));
  const spokes = layout.spokes
    .map((d, index) => {
      const id = roadmap.pillars.items[index]?.id ?? "";
      return `<path class="pillar-spoke" data-spoke="${escapeHtml(id)}" d="${escapeHtml(d)}"></path>`;
    })
    .join("");
  const nodes = layout.nodes
    .map((node, index) => {
      const pillar = roadmap.pillars.items[index];
      return `<g class="pillar-node" data-pillar-node="${escapeHtml(node.id)}" transform="translate(${node.x} ${node.y})">
        <circle class="node-hit" r="46"></circle>
        <circle class="ring" r="34"></circle>
        <text class="pillar-num">${escapeHtml(pillar?.number ?? "")}</text>
      </g>`;
    })
    .join("");

  return `<svg class="pillar-svg" viewBox="${layout.viewBox}" aria-hidden="true">
    <path class="pillar-ring" d="${escapeHtml(layout.ring)}"></path>
    ${spokes}
    <text class="pillar-center" x="${layout.cx}" y="${layout.cy}">PROPEL</text>
    ${nodes}
  </svg>`;
}

export function renderOverviewLine(): string {
  return `<div class="overview-line" aria-hidden="true">
    <svg viewBox="0 0 600 8" preserveAspectRatio="none">
      <path d="${escapeHtml(overviewLine)}"></path>
    </svg>
    <div class="overview-dots"><span></span><span></span><span></span></div>
  </div>`;
}

/** The resolved network, used as the closing mark. */
export function renderClosingNetwork(): string {
  return `<svg class="close-svg" viewBox="0 0 280 220" aria-hidden="true">
    <path class="close-spine" d="M40 24 V168"></path>
    <path class="close-branch" d="M40 64 C78 52 110 48 148 58"></path>
    <path class="close-branch" d="M40 96 C90 88 130 84 176 98"></path>
    <path class="close-branch" d="M40 132 C92 140 130 156 168 172"></path>
    <path class="close-join" d="M148 58 L176 98 L168 172 L148 58"></path>
    <path class="close-join" d="M168 172 L40 168"></path>
    <circle class="close-node" cx="40" cy="24" r="6"></circle>
    <circle class="close-core" cx="40" cy="24" r="2.4"></circle>
    <circle class="close-node" cx="148" cy="58" r="5"></circle>
    <circle class="close-node" cx="176" cy="98" r="5"></circle>
    <circle class="close-node" cx="168" cy="172" r="5"></circle>
    <circle class="close-core" cx="148" cy="58" r="2"></circle>
    <circle class="close-core" cx="176" cy="98" r="2"></circle>
    <circle class="close-core" cx="168" cy="172" r="2"></circle>
  </svg>`;
}
