import type { SiteContent } from "../types";

/**
 * Visitor-facing copy for the PROPEL review site.
 * Wording is taken from the University College pages retrieved 2 November 2026.
 * Do not add statistics, outcomes, sponsors, or people that those pages do not publish.
 */
export const site: SiteContent = {
  identity: {
    project: "Project PROPEL",
    unit: "University College",
    institution: "Arizona State University",
    officialUrl: "https://universitycollege.asu.edu/propel",
    projectUrl: "https://universitycollege.asu.edu/projects/project-propel",
    asuUrl: "https://www.asu.edu/",
    unitUrl: "https://universitycollege.asu.edu/",
    window: "November 2025 – November 2028",
  },
  hero: {
    eyebrow: "Arizona State University · University College",
    title: "PROPEL: Empowered to flourish",
    support:
      "Re-designing student success through integrated data, human connection, and personalized support.",
    primaryLabel: "Explore the PROPEL model",
    primaryHref: "#pillars",
    secondaryLabel: "Explore the journey",
    secondaryHref: "#journey",
    legend: ["Insights", "Care", "Connection", "Support"],
    caption: "Four paths of support meet at the student.",
  },
  flourish: {
    heading: "Flourishing is foundational to academic success",
    lede:
      "At ASU, we know that flourishing is foundational to academic success. Project PROPEL (Positive Relationships, Optimized Potential, and Enhanced Learning) celebrates the humanity of our students and builds a structure at scale that holistically caters to their success.",
    figure: {
      src: "./media/story/flourish.jpg",
      alt: "Illustration from the PROPEL page: a laptop with a rocket lifting off the screen.",
      width: 1400,
      height: 787,
    },
    imagine: "Imagine transforming the student approach",
    imagineBody:
      "By integrating academic support and creating personalized engagement, the most sophisticated student data ecosystem is able to create systemic care.",
    concepts: [
      {
        id: "insights",
        number: "01",
        name: "Real-time insights",
        summary:
          "Faculty who receive real-time insights and are equipped with data to curate individualized learning.",
        icon: "./media/story/icon-insights.png",
        iconAlt: "Real-time insights icon",
      },
      {
        id: "adaptive",
        number: "02",
        name: "Adaptive support",
        summary:
          "Automated AI systems to generate tailored course material help based on a student’s needs.",
        icon: "./media/story/icon-adaptive.png",
        iconAlt: "Adaptive support icon",
      },
      {
        id: "human",
        number: "03",
        name: "Human connection",
        summary:
          "Student coaches have access to flourishing-informed training, videos, and resources that adapt to what students require at that moment.",
        icon: "./media/story/icon-human.png",
        iconAlt: "Human connection icon",
      },
    ],
    close:
      "PROPEL brings together rich data with strengths-based and proactive support, to deliver an innovative model of care that honors who students are and empowers them to flourish throughout college and beyond.",
  },
  why: {
    heading: "Why it matters",
    traditionalTitle: "What’s wrong?",
    traditionalBody:
      "Traditional support models were designed around a singular path, focusing on singular problems. Students often have to navigate separate systems on their own.",
    traditionalItems: ["Remedial education", "Financial aid", "Counseling"],
    possibleTitle: "What’s possible?",
    possibleBody:
      "When engagement dips, PROPEL routes students to the right support. Support becomes specific and grounded in what students are doing well.",
    possibleItems: ["Peer coaching", "Academic scaffolding", "Intensive one-on-one help"],
    paragraphs: [
      "Where traditional support models in higher education ask, “What’s wrong?” PROPEL seeks to shift the paradigm. It asks, “What’s possible?” That difference changes everything. We’re building on strengths, and it fundamentally redefines what success means.",
      "Today’s students face different challenges than students faced even five years ago, and many aren’t singular. Whether they are first-generation students needing guidance, managing a mental health crisis while trying to keep up academically, working full-time while balancing multiple obligations, or a combination of these. Traditional support models were designed around a singular path, focusing on singular problems. Remedial education, financial aid, and counseling, for example, have often functioned as separate systems that students must navigate on their own or enter by default, with little coordination across their support.",
    ],
    differentHeading: "PROPEL is different",
    different: [
      "It’s a new data-informed model that is responsive to the complexity of students’ needs, meeting them where they are. Designed with intentionality to allow students to flourish.",
      "When engagement dips, PROPEL routes students to the right support: peer coaching, academic scaffolding, or intensive one-on-one help. Support becomes specific and grounded in what students are doing well.",
    ],
    figure: {
      src: "./media/story/why-matters.jpg",
      alt: "Illustration from the PROPEL page: stacked books, ladders, and a graduation cap.",
      width: 1000,
      height: 1000,
    },
  },
  pillars: {
    eyebrow: "Responsive personalization",
    heading: "How PROPEL adapts as students evolve",
    lede: [
      "PROPEL integrates four pillars: The flourishing model, life design principles, analytics integrator, and tiered care into a unified ecosystem where data informs care, care honors agency, and agency is strengthened by insight.",
      "As students evolve, support scales alongside that evolution.",
    ],
    figure: {
      src: "./media/story/pillars.jpg",
      alt: "The four PROPEL pillar illustrations together: analytics, student profiles, life design, and the flourishing model.",
      width: 600,
      height: 480,
    },
    relationship: "Each pillar connects to the student. Together they are one support ecosystem.",
    items: [
      {
        id: "flourishing",
        number: "01",
        node: "Flourishing model",
        role: "Beyond the GPA",
        heading: "The flourishing model",
        paragraphs: [
          "PROPEL builds predictive analytics that track engagement patterns and wellbeing signals, that goes beyond the GPA and provide an opportunity to intercede before student disengagement occurs. It flags students at risk and routes them to the right support, whether that's peer connection, academic scaffolding, or intensive coaching.",
          "Grounded in the flourishing framework, we recognize student support is multidimensional: examining positive emotion, positive relationships, purpose, and engagement alongside academic achievements. Strengthening flourishing dimensions could create momentum across academic success. By incorporating these measurements we can proactively match students to services and resources that are individually tailored to their unique strengths and aspirations.",
        ],
        image: "./media/pillars/flourishing.png",
        imageAlt: "Illustration of a hand selecting one shape in a field of connected paths.",
      },
      {
        id: "life-design",
        number: "02",
        node: "Life by Design",
        role: "What matters most",
        heading: "Life by Design: Intentionally shaping the student journey",
        paragraphs: [
          "Life by Design asks students, “what matters most to you?” That becomes the starting point for students to explore what is possible, allows them to test ideas, and refine their direction. Drawing from design thinking and positive psychology, Life Design is an iterative approach that builds agency, adaptability, resilience, and self-awareness. Students are empowered to design a future that aligns with their interests and values.",
        ],
        image: "./media/pillars/life-design.png",
        imageAlt: "Illustration of a light bulb beside a dashed route that climbs toward a flag.",
      },
      {
        id: "analytics",
        number: "03",
        node: "Analytics Integrator",
        role: "Real-time insight",
        heading: "Analytics integrator: Transforming data into personalized insights",
        paragraphs: [
          "Building on previous institutional investments in student support, Analytics Integrator 2.0 is a machine learning model and decision-support backbone that transforms student data into actionable, real-time insight. By identifying patterns associated with academic risk before students reach a point of crisis, it enables a proactive approach to support rather than a reactive one.",
          "It provides faculty and success coaches visibility into students’ needs, strengths, and opportunities for engagement, while also helping determine the level of support each student may need. Enriched by flourishing data, this visibility makes it possible to match students to personalized interventions and resources before challenges become barriers.",
        ],
        image: "./media/pillars/analytics.png",
        imageAlt: "Illustration of a magnifying glass over a chart inside a browser window.",
      },
      {
        id: "tiered-care",
        number: "04",
        node: "Tiered care",
        role: "Support that adapts",
        heading: "Support that adapts to you: Tiered care and personalization",
        paragraphs: [
          "Tiered care and personalization are the foundation to how PROPEL matches students with the support they need. Drawing from insights from Analytics Integrator 2.0, PROPEL creates a coherent ecosystem of student engagement. Rather than relying on a singular model of support, PROPEL uses classroom instruction, peer coaching, academic support, and mentorship to create a dynamic partnership that honors a student’s agency. As students’ needs change, the system evolves, providing timely support through in-class support, tutoring, coaching, or connections to campus resources.",
          "This tiered model is designed to connect classroom practice, co-curricular support, and institutional analytics into a coherent support ecosystem. By removing fragmented interventions, PROPEL creates a more human-centered student support system.",
        ],
        image: "./media/pillars/tiered-care.png",
        imageAlt: "Illustration of a hand choosing one profile among overlapping cards in a browser window.",
      },
    ],
  },
  tiers: {
    eyebrow: "Personalized support",
    heading: "Three tiers of support",
    lede:
      "Tier 3 is universal support, the broad foundation. Tier 2 is targeted. Tier 1 is intensive, one-to-one support. The numbering follows the PROPEL page: Tier 1 is not the universal tier.",
    items: [
      {
        id: "tier-3",
        number: "Tier 3",
        name: "Universal support",
        line: "Foundational support inside the course.",
        icon: "./media/story/icon-tier-3.png",
        iconAlt: "Universal support icon",
        paragraphs: [
          "A foundational tier that removes barriers to support and provides immediate help when needed. This includes embedded microlearning videos and academic skill resources to be integrated directly into the course experience.",
        ],
        includes: ["Embedded microlearning videos", "Academic skill resources in the course"],
      },
      {
        id: "tier-2",
        number: "Tier 2",
        name: "Targeted support",
        line: "Peer coaching, tutoring, and learning communities.",
        icon: "./media/story/icon-tier-2.png",
        iconAlt: "Targeted support icon",
        paragraphs: [
          "For students needing a deeper connection, peer coaching, AI-supported tutoring, and group-based learning communities are intentionally matched with the student to build skills alongside a sense of belonging.",
        ],
        includes: ["Peer coaching", "AI-supported tutoring", "Group-based learning communities"],
      },
      {
        id: "tier-1",
        number: "Tier 1",
        name: "Intensive support",
        line: "One-to-one flourishing coaching.",
        icon: "./media/story/icon-tier-1.png",
        iconAlt: "Intensive support icon",
        paragraphs: [
          "For the student who needs a more dedicated touch to navigate complex challenges, a flourishing coach partners with them to create a plan that includes one-on-one support to help overcome barriers and be fully seen and supported.",
        ],
        includes: ["Flourishing coach", "One-on-one support"],
      },
    ],
  },
  journey: {
    eyebrow: "The journey",
    heading: "This is how we plan to build it.",
    lede:
      "Three stages, from infrastructure to expansion to full implementation. The University College project listing gives the window as November 2025 – November 2028. Dates inside that window are not published.",
    stages: [
      {
        id: "infrastructure",
        number: "01",
        yearLabel: "Year one",
        name: "Infrastructure",
        paragraphs: [
          "Established the foundation that powered PROPEL’s promise. With the development of Analytics Integrator 2.0 alongside micro-learning videos and the launch of tier three piloted with 500 LEAD students.",
          "Demonstrated that integrated, data-informed support can drive measurable improvement in engagement, retention and the flourish model.",
        ],
        milestones: [
          {
            id: "analytics-integrator",
            label: "Analytics Integrator 2.0",
            detail:
              "Year one includes development of Analytics Integrator 2.0, the machine-learning model and decision-support backbone for faculty and success coaches.",
          },
          {
            id: "microlearning",
            label: "Microlearning",
            detail:
              "Micro-learning videos are part of the foundation, alongside academic skill resources intended for the course experience.",
          },
          {
            id: "tier-3-pilot",
            label: "Tier 3 pilot",
            detail:
              "Tier three launched as a pilot with 500 LEAD students. That figure is the published pilot cohort. It is not a reported retention or graduation result.",
          },
        ],
        goals: [
          {
            title: "Content development",
            detail:
              "Create and finalize the first set of microlearning videos (approximately 30) focused on essential academic skills, ensuring content is suitable for embedding within Canvas.",
          },
          {
            title: "Tier 3 deployment",
            detail:
              "Integrate Tier 3 resources (self-directed videos) within select LEAD and Explore courses, providing initial support to students and gathering usage data to inform content effectiveness.",
          },
          {
            title: "Data integration and faculty collaboration",
            detail:
              "Design Analytics Integrator 2.0 to embed the Flourishing Measure and metrics of engagement with the design elements of the active tier of service.",
          },
          {
            title: "Assessment",
            detail:
              "Create a student-facing survey, using the questions from the Flourishing Measure (VanderWeele, 2017). Have students complete pre- and post-implementation of Tier 3 interventions.",
          },
          {
            title: "Pilot and evaluation",
            detail:
              "Engage an initial cohort of 500 LEAD students in pilot testing of Tier 3 engagement, measuring engagement (usage rates of Tier 3 resources, academic performance improvement, retention rates, and utilization of the Student Success Center and Academic Support Services), feedback, and early outcomes.",
          },
          {
            title: "Communication strategy",
            detail:
              "Develop and implement a communication plan, including a web presence, to inform students, faculty, and staff about the available resources developed and refined for Tier 3 and any updates made through iteration.",
          },
        ],
      },
      {
        id: "expansion",
        number: "02",
        yearLabel: "Year two",
        name: "Expansion",
        paragraphs: [
          "Tiers 1 and 2 launch alongside the focus on personalized care. Self-directed content, AI-driven chatbots, and digital learning communities go live.",
          "Flourishing coaches are introduced as well as team teaching and collaborative learning structures activated across campus.",
        ],
        milestones: [
          {
            id: "tiers-1-and-2",
            label: "Tiers 1 and 2",
            detail: "Tiers 1 and 2 launch alongside the focus on personalized care.",
          },
          {
            id: "digital-communities",
            label: "Digital learning communities",
            detail: "Self-directed content, AI-driven chatbots, and digital learning communities go live.",
          },
          {
            id: "flourishing-coaches",
            label: "Flourishing coaches",
            detail: "Flourishing coaches are introduced in the expansion year.",
          },
          {
            id: "team-teaching",
            label: "Team teaching",
            detail: "Team teaching and collaborative learning structures are activated across campus.",
          },
        ],
      },
      {
        id: "implementation",
        number: "03",
        yearLabel: "Year three",
        name: "Full implementation",
        paragraphs: [
          "Project PROPEL will become a replicable, scalable intervention model ready for broad institutional adoption.",
          "Year three will focus on deployment, refinement and future scalability while expanding all three tiers.",
        ],
        milestones: [
          {
            id: "adoption",
            label: "Broad institutional adoption",
            detail:
              "Project PROPEL will become a replicable, scalable intervention model ready for broad institutional adoption.",
          },
          {
            id: "deployment",
            label: "Deployment and refinement",
            detail: "Year three will focus on deployment, refinement and future scalability.",
          },
          {
            id: "all-tiers",
            label: "All three tiers",
            detail:
              "Year three expands universal support, targeted support, and intensive support. The page describes this as future work.",
          },
        ],
      },
    ],
  },
  team: {
    eyebrow: "Who we are",
    heading: "Meet the team",
    lede:
      "Project PROPEL brings together educators and researchers with decades of combined experience in quantitative and qualitative research aligned with student success. Each member of this research team is deeply committed to our core mission: reimagining how universities support the whole student.",
    groups: [
      {
        id: "principal",
        heading: "Principal investigator",
        people: [
          {
            id: "sukhwant-jhaj",
            name: "Sukhwant Jhaj",
            title:
              "Vice Provost for Academic Innovation and Student Achievement, Office of the University Provost & Dean, University College",
            image: "./media/team/sukhwant-jhaj.png",
            initials: "SJ",
          },
        ],
      },
      {
        id: "leads",
        heading: "Project leads",
        people: [
          {
            id: "raquel-fong",
            name: "Raquel Fong",
            title: "Director of Explore and Interim Director of Success by Design, UC University College Dean Office",
            image: "./media/team/raquel-fong.png",
            initials: "RF",
          },
          {
            id: "stephanie-el-khoury",
            name: "Stephanie El Khoury",
            title: "Student Services Researcher, University College, Dean's office",
            image: "./media/team/stephanie-el-khoury.png",
            initials: "SE",
          },
        ],
      },
      {
        id: "steering",
        heading: "Steering committee",
        people: [
          {
            id: "esteban-aucejo",
            name: "Esteban Aucejo",
            title: "Dean's Council Distinguished Scholar and Professor, Department of Economics",
            image: "./media/team/esteban-aucejo.png",
            initials: "EA",
          },
          {
            id: "diana-sesate",
            name: "Diana Sesate",
            title: "Senior Director, Institutional Research and Evaluation",
            image: "./media/team/diana-sesate.png",
            initials: "DS",
          },
          {
            id: "phil-arcuria",
            name: "Phil Arcuria",
            title: "Senior Director, Actionable Analytics",
            image: "./media/team/phil-arcuria.png",
            initials: "PA",
          },
          {
            id: "aaron-krasnow",
            name: "Aaron Krasnow",
            title: "Associate Vice President and Director, Health and Counseling Services",
            image: "./media/team/aaron-krasnow.png",
            initials: "AK",
          },
          {
            id: "sarah-martin",
            name: "Sarah Martin",
            title: "Instructor, Explore",
            image: "./media/team/sarah-martin.png",
            initials: "SM",
          },
          {
            id: "laura-shaw",
            name: "Laura Shaw",
            title: "Associate Teaching Professor, Explore",
            image: "./media/team/laura-shaw.png",
            initials: "LS",
          },
          {
            id: "teddy-moya",
            name: "Teddy Moya",
            title: "Instructor, Success by Design",
            image: "./media/team/teddy-moya.png",
            initials: "TM",
          },
        ],
      },
    ],
  },
  donors: {
    figure: {
      src: "./media/story/donors.jpg",
      alt: "Illustrated thank-you note from the PROPEL page.",
      width: 1200,
      height: 1200,
    },
    heading: "To our donors, thank you",
    body:
      "PROPEL was made possible thanks to the generous support of a donor committed to advancing equitable student support and the betterment of the student experience.",
    statement:
      "PROPEL helps students to develop clarity of who they are, with agency to shape their futures, and with a support system to ensure they flourish.",
  },
  contact: {
    eyebrow: "Get in touch",
    heading: "Curious about PROPEL?",
    lede:
      "Want to know how this integrated approach might work at your institution? Let’s connect and discover what’s possible together!",
    note:
      "On the University College website this is the PROPEL webform. This review build delivers a message only after an approved endpoint is configured. Until then, submitting does not send anything.",
    unconfigured:
      "This review build is not connected to the University College webform, so the message was not sent.",
    success: "The message was delivered.",
    failure: "The message could not be delivered. Nothing was confirmed as received.",
  },
  footer: {
    note: "Review prototype for University College. Not published to the ASU website.",
    links: [
      { label: "Official PROPEL page", href: "https://universitycollege.asu.edu/propel" },
      { label: "Project listing", href: "https://universitycollege.asu.edu/projects/project-propel" },
      { label: "University College", href: "https://universitycollege.asu.edu/" },
      { label: "Contact ASU", href: "https://www.asu.edu/about/contact" },
      { label: "Accessibility", href: "https://accessibility.asu.edu/report" },
      { label: "Privacy", href: "https://www.asu.edu/about/privacy" },
      { label: "Copyright and Trademark", href: "https://www.asu.edu/about/copyright-trademark" },
      { label: "Terms of Use", href: "https://www.asu.edu/about/terms-of-use" },
      { label: "Emergency", href: "https://www.asu.edu/emergency/" },
    ],
  },
  nav: [
    { href: "#flourish", label: "Flourishing" },
    { href: "#why", label: "Why it matters" },
    { href: "#pillars", label: "Pillars" },
    { href: "#tiers", label: "Tiers" },
    { href: "#journey", label: "Journey" },
    { href: "#team", label: "Team" },
    { href: "#contact", label: "Contact" },
  ],
};
