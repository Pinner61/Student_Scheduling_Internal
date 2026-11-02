export interface Milestone {
  id: string;
  label: string;
  detail: string;
}

export interface Goal {
  title: string;
  detail: string;
}

export interface Stage {
  id: "infrastructure" | "expansion" | "implementation";
  number: string;
  yearLabel: string;
  name: string;
  paragraphs: string[];
  milestones: Milestone[];
  goals?: Goal[];
}

export interface Pillar {
  id: "flourishing" | "life-design" | "analytics" | "tiered-care";
  number: string;
  node: string;
  role: string;
  heading: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
}

export interface Tier {
  id: "tier-3" | "tier-2" | "tier-1";
  number: string;
  name: string;
  line: string;
  paragraphs: string[];
  includes: string[];
  icon: string;
  iconAlt: string;
}

export interface Concept {
  id: string;
  number: string;
  name: string;
  summary: string;
  icon: string;
  iconAlt: string;
}

export interface Figure {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  image: string;
  initials: string;
}

export interface TeamGroup {
  id: string;
  heading: string;
  people: Person[];
}

export interface SiteContent {
  identity: {
    project: string;
    unit: string;
    institution: string;
    officialUrl: string;
    projectUrl: string;
    asuUrl: string;
    unitUrl: string;
    window: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    support: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    legend: string[];
    caption: string;
  };
  flourish: {
    heading: string;
    lede: string;
    figure: Figure;
    imagine: string;
    imagineBody: string;
    concepts: Concept[];
    close: string;
  };
  why: {
    heading: string;
    traditionalTitle: string;
    traditionalBody: string;
    traditionalItems: string[];
    possibleTitle: string;
    possibleBody: string;
    possibleItems: string[];
    paragraphs: string[];
    differentHeading: string;
    different: string[];
    figure: Figure;
  };
  pillars: {
    eyebrow: string;
    heading: string;
    lede: string[];
    figure: Figure;
    relationship: string;
    items: Pillar[];
  };
  tiers: {
    eyebrow: string;
    heading: string;
    lede: string;
    items: Tier[];
  };
  journey: {
    eyebrow: string;
    heading: string;
    lede: string;
    stages: Stage[];
  };
  team: {
    eyebrow: string;
    heading: string;
    lede: string;
    groups: TeamGroup[];
  };
  donors: {
    figure: Figure;
    heading: string;
    body: string;
    statement: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    lede: string;
    note: string;
    unconfigured: string;
    success: string;
    failure: string;
  };
  footer: {
    note: string;
    links: { label: string; href: string }[];
  };
  nav: { href: string; label: string }[];
}
