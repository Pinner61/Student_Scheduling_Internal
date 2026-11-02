import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { site } from "../src/content/site";
import { renderExperience } from "../src/render/experience";
import { renderTimeline } from "../src/render/timeline";
import { escapeHtml } from "../src/render/escape";
import { pathwayNodes, pillarAnchors, viewPoint } from "../src/viz/layout";

describe("site content", () => {
  it("keeps three stages, four pillars, and three tiers in official order", () => {
    assert.equal(site.journey.stages.length, 3);
    assert.equal(site.pillars.items.length, 4);
    assert.deepEqual(
      site.journey.stages.map((stage) => stage.name),
      ["Infrastructure", "Expansion", "Full implementation"],
    );
    assert.deepEqual(
      site.tiers.items.map((tier) => `${tier.number} ${tier.name}`),
      ["Tier 3 Universal support", "Tier 2 Targeted support", "Tier 1 Intensive support"],
    );
    assert.equal(site.team.groups.reduce((sum, group) => sum + group.people.length, 0), 10);
  });

  it("preserves published language and does not invent results", () => {
    const blob = JSON.stringify(site);
    assert.match(blob, /Analytics Integrator 2\.0/);
    assert.match(blob, /500 LEAD students/);
    assert.match(blob, /Tiers 1 and 2/);
    assert.match(blob, /broad institutional adoption/);
    assert.match(blob, /Sukhwant Jhaj/);
    assert.match(blob, /Curious about PROPEL/);
    assert.doesNotMatch(blob, /\d+%/);
    assert.doesNotMatch(blob, /retention increased|revenue|\$\d|completion rate/i);
    assert.equal(site.tiers.items[0]?.number, "Tier 3");
    assert.match(site.tiers.items[2]?.paragraphs.join(" ") ?? "", /one-on-one/);
  });
});

describe("render", () => {
  const html = renderExperience();

  it("prints the public page, not a timeline-only shell", () => {
    assert.match(html, /PROPEL: Empowered to flourish/);
    assert.match(html, /Re-designing student success/);
    assert.match(html, /Explore the PROPEL model/);
    assert.match(html, /Explore the journey/);
    assert.match(html, /What’s possible/);
    assert.match(html, /Meet the team/);
    assert.match(html, /To our donors, thank you/);
    assert.match(html, /name="first_name"/);
    assert.match(html, /name="email"/);
    assert.match(html, /does not send anything/);
    assert.match(html, /https:\/\/universitycollege\.asu\.edu\/propel/);
    assert.doesNotMatch(html, /<script/i);
  });

  it("uses unique ids", () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((id, index) => ids.indexOf(id) !== index).join(", ")}`);
  });

  it("escapes text", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  });
});

describe("timeline", () => {
  const html = renderTimeline();

  it("prints the official stages on one alternating spine", () => {
    assert.match(html, /This is how we plan to build it\./);
    assert.match(html, /id="infrastructure"/);
    assert.match(html, /id="expansion"/);
    assert.match(html, /id="implementation"/);
    assert.match(html, /href="#infrastructure"/);
    assert.match(html, /href="#expansion"/);
    assert.match(html, /href="#implementation"/);
    assert.match(html, /propel-timeline__year-index">01</);
    assert.match(html, /propel-timeline__year-index">02</);
    assert.match(html, /propel-timeline__year-index">03</);
    assert.match(html, /Analytics Integrator 2\.0/);
    assert.match(html, /micro-learning videos/);
    assert.match(html, /500 LEAD students/);
    assert.match(html, /measurable improvement/);
    assert.match(html, /Tiers 1 and 2/);
    assert.match(html, /personalized care/);
    assert.match(html, /Self-directed content/);
    assert.match(html, /AI-driven chatbots/);
    assert.match(html, /digital learning communities/);
    assert.match(html, /Flourishing coaches/);
    assert.match(html, /team teaching/);
    assert.match(html, /collaborative learning/);
    assert.match(html, /replicable, scalable/);
    assert.match(html, /broad institutional adoption/);
    assert.match(html, /deployment, refinement/);
    assert.match(html, /all three tiers/);
    assert.match(html, /Year-one goals/);
    assert.match(html, /not as results/);
    assert.match(html, /Create and finalize the first set of microlearning videos/);
    assert.doesNotMatch(html, /name="propel-timeline-stage"/);
    assert.doesNotMatch(html, /In this stage/);
    const propelOnly = html.slice(0, html.indexOf('id="president-story"'));
    assert.doesNotMatch(propelOnly, /\d+%/);
    assert.doesNotMatch(html, /propel-timeline__year-index">[^<]*(2026|2027|2028)/);
    assert.doesNotMatch(html, /propel-timeline__nav-index">[^<]*(2026|2027|2028)/);
    const sides = [...html.matchAll(/propel-timeline__event is-(left|right)/g)].map((match) => match[1]);
    assert.deepEqual(sides.slice(0, 6), ["left", "right", "left", "right", "left", "right"]);
    assert.ok(sides.length > 40);
    for (let index = 1; index < sides.length; index += 1) {
      assert.notEqual(sides[index], sides[index - 1]);
    }
    assert.match(html, /Michael M\. Crow/);
    assert.match(html, /unequal distribution of its most important asset/);
    assert.match(html, /National Service Universities/);
    assert.match(html, /Took office as the 16th president/);
    assert.match(html, /href="#p-2002"/);
    assert.match(html, /Learn more/);
    for (const phrase of [
      "Established the foundation",
      "With the development of Analytics Integrator 2.0",
      "Demonstrated that integrated",
      "Tiers 1 and 2 launch",
      "Self-directed content, AI-driven chatbots",
      "Flourishing coaches are introduced",
      "Project PROPEL will become",
      "Year three will focus",
    ]) {
      assert.equal(html.split(phrase).length - 1, 1, phrase);
    }
  });

  it("keeps timeline ids unique", () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe("layout", () => {
  it("spaces the pathway nodes and the pillar anchors", () => {
    assert.equal(pathwayNodes.length, 3);
    assert.ok((pathwayNodes[1] ?? 0) > (pathwayNodes[0] ?? 0));
    assert.ok((pathwayNodes[2] ?? 0) > (pathwayNodes[1] ?? 0));
    assert.equal(pillarAnchors.length, 4);
    const centerish = viewPoint(50, 50);
    assert.equal(centerish.x, 500);
    assert.equal(centerish.y, 210);
  });
});
