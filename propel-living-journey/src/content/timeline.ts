import { site } from "./site";
import type { Figure } from "../types";

/**
 * Reading model for the vertical timeline.
 * Every sentence is an official stage paragraph, shown once.
 * The first sentence of a stage introduces the year. The rest are milestones.
 * Year-one goals stay a separate block, labeled as goals rather than results.
 */
export interface TimelineGoalView {
  title: string;
  detail: string;
}

export interface TimelineImageView {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  small?: boolean;
}

export interface TimelineEventView {
  id: string;
  kicker: string;
  title: string;
  body: string;
  side: "left" | "right";
  image?: TimelineImageView;
  href?: string;
  note?: string;
  goals?: TimelineGoalView[];
}

export interface TimelineYearView {
  id: string;
  number: string;
  yearLabel: string;
  name: string;
  summary: string;
  moreHref?: string;
  moreLabel?: string;
  events: TimelineEventView[];
}

const GOAL_NOTE =
  "Published on the University College project listing as goals for the work, not as results.";

export function timelineYears(): TimelineYearView[] {
  const figure = site.flourish.figure;
  let side: "left" | "right" = "left";

  return site.journey.stages.map((stage) => {
    const parts = stage.paragraphs.flatMap(sentences);
    const summary = parts[0] ?? "";
    const events = parts.slice(1).map((body, index) => {
      const event: TimelineEventView = {
        id: `ms-${stage.id}-${index + 1}`,
        kicker: stage.yearLabel,
        title: titleFor(body),
        body,
        side,
        image: body.includes("Analytics Integrator 2.0") ? imageView(figure) : undefined,
      };
      side = side === "left" ? "right" : "left";
      return event;
    });

    if (stage.goals?.length) {
      events.push({
        id: `ms-${stage.id}-goals`,
        kicker: stage.yearLabel,
        title: "Year-one goals",
        body: "",
        side,
        note: GOAL_NOTE,
        goals: stage.goals.map((goal) => ({ title: goal.title, detail: goal.detail })),
      });
      side = side === "left" ? "right" : "left";
    }

    return {
      id: stage.id,
      number: stage.number,
      yearLabel: stage.yearLabel,
      name: stage.name,
      summary,
      events,
    };
  });
}

function imageView(figure: Figure): TimelineImageView {
  return {
    src: figure.src,
    alt: figure.alt,
    width: figure.width,
    height: figure.height,
    credit: "From the official PROPEL page.",
  };
}

function sentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function titleFor(sentence: string): string {
  if (sentence.includes("Analytics Integrator 2.0")) {
    return "Analytics Integrator 2.0, microlearning, and the Tier 3 pilot";
  }
  if (sentence.includes("measurable improvement")) return "Engagement, retention, and the flourish model";
  if (sentence.includes("Self-directed content")) return "Self-directed content and digital communities";
  if (sentence.includes("Flourishing coaches")) return "Flourishing coaches and collaborative learning";
  if (sentence.includes("deployment, refinement")) return "Deployment, refinement, and all three tiers";
  return "In this stage";
}
