import type { RoadmapContent } from "../types";

/**
 * Editable source for the PROPEL living journey.
 *
 * Change copy here. The page, the overview, and the diagrams read this file.
 * Do not add completion percentages, financial impact, or student-success
 * statistics. The public project window is provisional; do not invent
 * milestone dates.
 */
export const roadmap: RoadmapContent = {
  identity: {
    project: "Project PROPEL",
    title: "The Living Journey",
    acronym: "Positive Relationships, Optimized Potential, and Enhanced Learning",
    institution: "Arizona State University",
    unit: "University College",
    officialUrl: "https://universitycollege.asu.edu/propel",
    projectUrl: "https://universitycollege.asu.edu/projects/project-propel",
    timeline: "November 2025 – November 2028",
    timelineShort: "Nov 2025 – Nov 2028",
    timelineNote: "Dates within this window are subject to confirmation.",
  },
  hero: {
    eyebrow: "Arizona State University · Project PROPEL",
    headline: "Building a future where every student can flourish.",
    support:
      "Explore how PROPEL evolves over three years, connecting data, personalized care, and human support into one integrated approach.",
  },
  journey: {
    eyebrow: "Three-year roadmap",
    title: "From foundation to a connected system",
    lede: "Each year changes the path: a prepared line, then new routes of support, then one network a student can move through.",
    progressNote: "",
  },
  stages: [
    {
      id: "infrastructure",
      index: 0,
      number: "01",
      yearLabel: "Year one",
      name: "Infrastructure",
      epithet: "Foundation",
      summary: [
        "Year one builds the foundation for personalized support: Analytics Integrator 2.0, microlearning, and a first Tier 3 pilot.",
      ],
      initiatives: [
        "Establish the underlying foundation for personalized student support.",
        "Develop Analytics Integrator 2.0.",
        "Build microlearning resources.",
        "Pilot Tier 3 support with an initial cohort of approximately 500 LEAD students.",
      ],
      figureCaption: "A single line, and the ground prepared beneath it.",
      detail: {
        heading: "Year one in more detail",
        intro: "The public project listing describes these as goals for the first year, including microlearning in Canvas and a Tier 3 pilot with LEAD students.",
        items: [
          "Create a first set of microlearning videos — approximately 30 — on essential academic skills, suitable for embedding in Canvas.",
          "Integrate Tier 3 resources within select LEAD and Explore courses, and gather usage to inform the content.",
          "Design Analytics Integrator 2.0 so it can carry the Flourishing Measure and engagement with the active tier of service.",
          "Create a student-facing survey using questions from the Flourishing Measure (VanderWeele, 2017), planned before and after Tier 3 implementation.",
          "Invite an initial cohort of 500 LEAD students into the Tier 3 pilot, and learn from usage, feedback, and early observations.",
          "Develop a communication plan, including a web presence, for students, faculty, and staff.",
        ],
      },
    },
    {
      id: "expansion",
      index: 1,
      number: "02",
      yearLabel: "Year two",
      name: "Expansion",
      epithet: "Connection",
      summary: [
        "Year two opens new paths of support: Tiers 1 and 2, digital learning communities, and flourishing coaches.",
      ],
      initiatives: [
        "Expand personalized support.",
        "Introduce Tiers 1 and 2.",
        "Develop digital learning communities and self-directed resources.",
        "Introduce flourishing coaches and additional support structures.",
      ],
      figureCaption: "New paths extend from the line.",
      detail: {
        heading: "Year two in more detail",
        intro: "The PROPEL site describes this expansion as a wider set of ways to meet students, including collaborative teaching and AI-supported tools.",
        items: [
          "Tiers 1 and 2 launch alongside a stronger focus on personalized care.",
          "Self-directed content, digital learning communities, and flourishing coaches extend the support around a student.",
          "Collaborative structures such as team teaching, and AI-driven chatbots, are also part of the published description.",
        ],
      },
    },
    {
      id: "implementation",
      index: 2,
      number: "03",
      yearLabel: "Year three",
      name: "Full implementation",
      epithet: "Flourishing",
      summary: [
        "Year three joins the paths: all three tiers are refined, and the model is prepared for wider institutional use.",
      ],
      initiatives: [
        "Refine and expand all three support tiers.",
        "Prepare the model for wider institutional adoption.",
        "Focus on scalability and continued improvement.",
      ],
      figureCaption: "The paths join into one network.",
      detail: {
        heading: "Year three in more detail",
        intro: "The public description frames this year as deployment, refinement, and preparation for wider adoption.",
        items: [
          "Leave PROPEL as a replicable model that could be adopted more widely.",
          "Give the year to deployment, refinement, and future scalability while expanding all three tiers.",
          "Keep improving the model after the first version is in place.",
        ],
      },
    },
  ],
  pillars: {
    eyebrow: "The model",
    title: "Four pillars, one approach",
    lede: "Flourishing, life design, analytics, and tiered care work as one approach: data can inform care, and care can honor a student’s agency.",
    sourceNote: "",
    items: [
      {
        id: "flourishing",
        number: "01",
        name: "The Flourishing Model",
        body: [
          "PROPEL treats flourishing as part of academic success, not a side conversation. The model looks beyond GPA, paying attention to engagement patterns and wellbeing signals so support can begin before a student disengages.",
          "It draws on a flourishing framework — positive emotion, positive relationships, purpose, and engagement — alongside academic achievement, and uses that picture to match students with resources aligned to their strengths and aspirations.",
        ],
      },
      {
        id: "life-design",
        number: "02",
        name: "Life by Design",
        body: [
          "Life by Design begins with a question: “What matters most to you?” From there, students explore what is possible, test ideas, and refine a direction.",
          "Grounded in design thinking and positive psychology, it is an iterative practice meant to build agency, adaptability, resilience, and self-awareness — a way for students to shape a future aligned with their interests and values.",
        ],
      },
      {
        id: "analytics",
        number: "03",
        name: "Analytics Integrator",
        body: [
          "Analytics Integrator 2.0 is the project’s machine-learning model and decision-support backbone. It is being built to turn student data into timely insight for faculty and success coaches: needs, strengths, and openings for engagement.",
          "Enriched with flourishing data, it is intended to help match students with personalized resources before a challenge becomes a barrier — a proactive reading of the student record, not a reactive one.",
        ],
      },
      {
        id: "tiered-care",
        number: "04",
        name: "Tiered Care and Personalization",
        body: [
          "Tiered care is how PROPEL matches students with a useful level of support instead of a single path. Published descriptions include universal help embedded in the course, such as microlearning and academic-skill resources; targeted support through peer coaching, tutoring, and learning communities; and intensive, one-to-one partnership with a flourishing coach.",
          "As a student’s needs change, the support can change too — across the classroom, tutoring, coaching, and other campus resources — so care stays specific and still leaves the student room to choose.",
        ],
      },
    ],
  },
  overview: {
    eyebrow: "Overview",
    title: "Three years, one roadmap",
    lede: "The same stages as the story, read together.",
    note: "",
  },
  closing: {
    eyebrow: "University College",
    title: "From possibility to flourishing.",
    paragraphs: [
      "PROPEL is building a more responsive model of student support, so the care a student receives can change as their needs change.",
    ],
    linkLabel: "Visit the official PROPEL website",
  },
};
