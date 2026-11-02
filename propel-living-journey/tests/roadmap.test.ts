import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roadmap } from "../src/content/roadmap";
import { renderExperience } from "../src/render/experience";
import { escapeHtml } from "../src/render/escape";
import { closedPath, journeySpinePath, pillarLayout } from "../src/viz/geometry";

describe("roadmap content", () => {
  it("keeps three stages and four pillars", () => {
    assert.equal(roadmap.stages.length, 3);
    assert.equal(roadmap.pillars.items.length, 4);
    assert.deepEqual(
      roadmap.stages.map((stage) => stage.name),
      ["Infrastructure", "Expansion", "Full implementation"],
    );
    assert.deepEqual(
      roadmap.pillars.items.map((pillar) => pillar.name),
      ["The Flourishing Model", "Life by Design", "Analytics Integrator", "Tiered Care and Personalization"],
    );
  });

  it("preserves the published initiatives and does not invent results", () => {
    const initiatives = roadmap.stages.flatMap((stage) => stage.initiatives).join(" ");
    assert.match(initiatives, /Analytics Integrator 2\.0/);
    assert.match(initiatives, /approximately 500 LEAD students/);
    assert.match(initiatives, /Introduce Tiers 1 and 2/);
    assert.match(initiatives, /wider institutional adoption/);
    const blob = JSON.stringify(roadmap);
    assert.doesNotMatch(blob, /\d+%/);
    assert.doesNotMatch(blob, /retention increased|revenue|\$\d|completion rate/i);
  });
});

describe("render", () => {
  const html = renderExperience();

  it("prints the required headlines and one official link", () => {
    assert.match(html, /Building a future where every student can flourish\./);
    assert.match(html, /From possibility to flourishing\./);
    assert.match(html, /Explore the journey/);
    assert.match(html, /https:\/\/universitycollege\.asu\.edu\/propel/);
    assert.match(html, /November 2025 – November 2028/);
    assert.match(html, /What matters most to you/);
  });

  it("uses unique ids", () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("escapes text", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
    assert.doesNotMatch(html, /<script/i);
  });
});

describe("geometry", () => {
  it("builds a living spine, a closed pillar ring, and four nodes", () => {
    const spine = journeySpinePath();
    assert.match(spine, /^M/);
    assert.ok(spine.length > 20);
    const layout = pillarLayout(roadmap.pillars.items.map((item) => item.id));
    assert.equal(layout.nodes.length, 4);
    assert.match(closedPath(layout.nodes), /^M/);
    assert.equal(layout.spokes.length, 4);
  });
});
