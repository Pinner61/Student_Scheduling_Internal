export type StageId = "infrastructure" | "expansion" | "implementation";

export interface StageDetail {
  /** Short label for the disclosure control. */
  heading: string;
  /** Frames the items as published description, not measured results. */
  intro: string;
  items: string[];
}

export interface Stage {
  id: StageId;
  /** Zero-based order along the path. */
  index: number;
  /** Display index, e.g. "01". */
  number: string;
  /** "Year one" */
  yearLabel: string;
  /** Official stage name. */
  name: string;
  /** Short visual theme: Foundation, Connection, Flourishing. */
  epithet: string;
  /** Narrative paragraphs. No outcome claims. */
  summary: string[];
  /** What this stage is pursuing. */
  initiatives: string[];
  /** Caption under the stage illustration. */
  figureCaption: string;
  detail: StageDetail;
}

export interface Pillar {
  id: string;
  number: string;
  name: string;
  body: string[];
}

export interface RoadmapContent {
  identity: {
    project: string;
    title: string;
    acronym: string;
    institution: string;
    unit: string;
    officialUrl: string;
    projectUrl: string;
    timeline: string;
  timelineShort: string;
    timelineNote: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    support: string;
  };
  journey: {
    eyebrow: string;
    title: string;
    lede: string;
    progressNote: string;
  };
  stages: Stage[];
  pillars: {
    eyebrow: string;
    title: string;
    lede: string;
    sourceNote: string;
    items: Pillar[];
  };
  overview: {
    eyebrow: string;
    title: string;
    lede: string;
    note: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    linkLabel: string;
  };
}
