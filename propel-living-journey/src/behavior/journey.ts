import {
  STAGE_FRACTION_FALLBACK,
  segmentScale,
  stageNodePoints,
} from "../viz/geometry";
import type { MotionFlags } from "./motion";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface JourneyBinding {
  refresh: (force?: boolean) => void;
  setStage: (index: number) => void;
  getStage: () => number;
}

export function bindJourney(root: HTMLElement, signal: AbortSignal, motion: MotionFlags): JourneyBinding {
  const chapters = [...root.querySelectorAll<HTMLElement>("[data-chapter]")];
  const markers = [...root.querySelectorAll<HTMLElement>("[data-marker]")];
  const navLinks = [...root.querySelectorAll<HTMLAnchorElement>(".journey-nav [data-stage-link]")];
  const viz = root.querySelector<SVGSVGElement>("[data-journey-viz]");
  const spine = root.querySelector<SVGPathElement>(".spine-route");
  const prev = root.querySelector<HTMLButtonElement>("[data-nav='prev']");
  const next = root.querySelector<HTMLButtonElement>("[data-nav='next']");
  const headerStage = root.querySelector<HTMLElement>("[data-header-stage]");
  const navCurrent = root.querySelector<HTMLElement>("[data-nav-current]");
  const rail = root.querySelector<HTMLElement>("[data-mobile-rail]");
  const railFill = root.querySelector<HTMLElement>("[data-rail-fill]");

  let fractions = [...STAGE_FRACTION_FALLBACK];
  let active = 0;
  let ticking = false;
  let lockIndex = 0;
  let lockUntil = 0;

  chapters.forEach((chapter) => {
    const rect = chapter.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) {
      chapter.classList.add("is-seen", "is-immediate");
    }
  });

  const seenObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-seen");
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
  );
  chapters.forEach((chapter) => seenObserver.observe(chapter));

  function measure() {
    if (!spine) return;
    const total = spine.getTotalLength();
    if (!total) {
      fractions = [...STAGE_FRACTION_FALLBACK];
      return;
    }
    fractions = stageNodePoints.map((point) => closestFraction(spine, total, point));
  }

  function storyVisible(): boolean {
    const panel = root.querySelector(".story-panel");
    return panel instanceof HTMLElement && panel.getClientRects().length > 0;
  }

  function read(): { index: number; pathP: number; railY: number; local: number } | null {
    if (!storyVisible() || chapters.length === 0) return null;
    const marker = window.innerHeight * 0.4;
    const tops = chapters.map((chapter) => chapter.getBoundingClientRect().top);
    const last = tops.length - 1;
    let index = 0;
    for (let i = 0; i < tops.length; i += 1) {
      if (tops[i] <= marker) index = i;
    }

    const railBox = rail?.getBoundingClientRect();
    const ys = markers.map((mark) => {
      const box = mark.getBoundingClientRect();
      return box.top + box.height / 2 - (railBox?.top ?? 0);
    });

    let pathP = fractions[0] ?? 0;
    let railY = ys[0] ?? 0;

    if (tops[0] > marker) {
      const start = window.innerHeight * 0.95;
      const t = clamp((start - tops[0]) / (start - marker), 0, 1);
      pathP = t * (fractions[0] ?? 0);
      railY = t * (ys[0] ?? 0);
      return { index: 0, pathP, railY, local: 0 };
    }

    if (index < last && tops[index + 1] > marker) {
      const span = tops[index + 1] - tops[index];
      const t = span === 0 ? 1 : clamp((marker - tops[index]) / span, 0, 1);
      segmentScale.domain([0, 1]).range([fractions[index] ?? 0, fractions[index + 1] ?? 1]);
      pathP = Number(segmentScale(t));
      const y0 = ys[index] ?? 0;
      const y1 = ys[index + 1] ?? y0;
      railY = y0 + (y1 - y0) * t;
      return { index, pathP, railY, local: t };
    }

    const end = marker - window.innerHeight * 0.5;
    const t = clamp((marker - tops[last]) / (marker - end || 1), 0, 1);
    const tail = fractions[last] ?? 1;
    pathP = tail + t * (1 - tail);
    const yLast = ys[last] ?? 0;
    const yEnd = railBox?.height ?? yLast;
    railY = yLast + (yEnd - yLast) * t;
    return { index: last, pathP, railY, local: t };
  }

  function applyStage(index: number, force = false) {
    if (!force && index === active && root.dataset.stageReady === "true") return;
    active = index;
    root.dataset.stageReady = "true";
    viz?.setAttribute("data-active", String(index));

    chapters.forEach((chapter, chapterIndex) => {
      chapter.classList.toggle("is-active", chapterIndex === index);
      chapter.classList.toggle("is-complete", chapterIndex < index);
    });

    const nodes = root.querySelectorAll<SVGGraphicsElement>(".stage-node");
    nodes.forEach((node, nodeIndex) => {
      node.classList.toggle("is-active", nodeIndex === index);
      node.classList.toggle("is-complete", nodeIndex < index);
      node.classList.toggle("is-upcoming", nodeIndex > index);
    });

    navLinks.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });

    const current = chapters[index];
    const name = current?.querySelector("h3")?.textContent?.trim() ?? "";
    const year = current?.querySelector(".chapter-year")?.textContent?.trim() ?? "";
    const label = year && name ? `${year} · ${name}` : name;
    if (headerStage) headerStage.textContent = label;
    if (navCurrent) navCurrent.textContent = label;

    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= chapters.length - 1;
  }

  function grow(kind: "branch" | "join", progress: number) {
    const paths = [...root.querySelectorAll<SVGPathElement>(`.journey-svg [data-grow="${kind}"]`)];
    const marks = [...root.querySelectorAll<SVGElement>(`.journey-svg [data-grow-mark="${kind}"]`)];
    const count = Math.max(1, ...paths.map((path) => Number(path.dataset.index ?? 0) + 1), ...marks.map((mark) => Number(mark.dataset.index ?? 0) + 1));
    const amountFor = (index: number) => {
      if (motion.reduced) return progress > 0.04 ? 1 : 0;
      const slice = 1 / count;
      const start = index * slice;
      return clamp((progress - start) / slice, 0, 1);
    };
    paths.forEach((path) => {
      const amount = amountFor(Number(path.dataset.index ?? 0));
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = String(1 - amount);
    });
    marks.forEach((mark) => {
      const amount = amountFor(Number(mark.dataset.index ?? 0));
      const reveal = motion.reduced ? amount : clamp((amount - 0.62) / 0.38, 0, 1);
      mark.style.opacity = String(reveal);
    });
  }

  function chapterProgress(chapter: HTMLElement): number {
    const rect = chapter.getBoundingClientRect();
    const startLine = window.innerHeight * 0.9;
    const endLine = window.innerHeight * 0.34;
    const total = rect.height + (startLine - endLine);
    return clamp((startLine - rect.top) / Math.max(total, 1), 0, 1);
  }

  function unfurl(chapter: HTMLElement, progress: number) {
    const figure = chapter.querySelector<HTMLElement>(".chapter-figure");
    if (motion.reduced) {
      chapter.querySelectorAll<HTMLElement>("[data-piece]").forEach((piece) => piece.classList.add("is-open"));
      if (figure) figure.style.clipPath = "none";
      chapter.querySelectorAll<SVGPathElement>(".illus [data-step]").forEach((path) => {
        path.style.strokeDasharray = "";
        path.style.strokeDashoffset = "";
      });
      chapter.querySelectorAll<SVGElement>(".illus [data-step-mark]").forEach((mark) => {
        mark.style.opacity = "";
      });
      return;
    }
    const steps = Math.max(
      1,
      ...[...chapter.querySelectorAll<HTMLElement>("[data-step]")].map((node) => Number(node.dataset.step ?? 0) + 1),
      ...[...chapter.querySelectorAll<HTMLElement>("[data-step-mark]")].map((node) => Number(node.dataset.stepMark ?? 0) + 1),
    );
    const amountFor = (step: number) => {
      const slice = 1 / steps;
      return clamp((progress - step * slice) / slice, 0, 1);
    };
    chapter.querySelectorAll<HTMLElement>("[data-piece]").forEach((piece) => {
      piece.classList.toggle("is-open", amountFor(Number(piece.dataset.step ?? 0)) > 0.34);
    });
    chapter.querySelectorAll<SVGPathElement>(".illus [data-step]").forEach((path) => {
      const amount = amountFor(Number(path.dataset.step ?? 0));
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = String(1 - amount);
    });
    chapter.querySelectorAll<SVGElement>(".illus [data-step-mark]").forEach((mark) => {
      const amount = amountFor(Number(mark.dataset.stepMark ?? 0));
      mark.style.opacity = String(clamp((amount - 0.4) / 0.6, 0, 1));
    });
    if (figure) figure.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
  }

  function paint(force = false) {
    const reading = read();
    if (!reading) return;
    const locked = performance.now() < lockUntil;
    applyStage(locked ? lockIndex : reading.index, force);
    const dash = `${clamp(reading.pathP, 0, 1)} 1`;
    root.querySelectorAll<SVGPathElement>("[data-progress]").forEach((progress) => {
      progress.setAttribute("stroke-dasharray", dash);
    });
    const branchProgress = reading.index < 1 ? 0 : reading.index > 1 || motion.reduced ? 1 : reading.local;
    const joinProgress = reading.index < 2 ? 0 : motion.reduced ? 1 : reading.local;
    grow("branch", branchProgress);
    grow("join", joinProgress);
    chapters.forEach((chapter) => unfurl(chapter, chapterProgress(chapter)));
    if (railFill) railFill.style.height = `${Math.max(0, reading.railY)}px`;
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (signal.aborted) return;
      paint(false);
    });
  }

  function setStage(index: number) {
    const clamped = clamp(index, 0, chapters.length - 1);
    const chapter = chapters[clamped];
    if (!chapter) return;
    const story = root.querySelector<HTMLInputElement>("#propel-mode-story");
    if (story && !story.checked) story.checked = true;
    lockIndex = clamped;
    lockUntil = performance.now() + (motion.reduced ? 80 : 900);
    chapter.scrollIntoView({ behavior: motion.reduced ? "auto" : "smooth", block: "start" });
    if (chapter.id) {
      try {
        history.pushState(null, "", `#${chapter.id}`);
      } catch {
        /* Ignore sandboxed environments that block history. */
      }
    }
    paint(true);
  }

  root.querySelectorAll<HTMLAnchorElement>("[data-stage-link]").forEach((link) => {
    link.addEventListener(
      "click",
      (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        const index = Number(link.dataset.stageLink);
        if (Number.isNaN(index)) return;
        setStage(index);
        const navLink = navLinks[index];
        navLink?.focus({ preventScroll: true });
      },
      { signal },
    );
  });

  const nav = root.querySelector(".journey-nav");
  nav?.addEventListener(
    "keydown",
    (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      const key = event.key;
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(key)) return;
      event.preventDefault();
      let nextIndex = active;
      if (key === "Home") nextIndex = 0;
      else if (key === "End") nextIndex = chapters.length - 1;
      else if (key === "ArrowRight" || key === "ArrowDown") nextIndex = active + 1;
      else nextIndex = active - 1;
      nextIndex = clamp(nextIndex, 0, chapters.length - 1);
      setStage(nextIndex);
      navLinks[nextIndex]?.focus({ preventScroll: true });
    },
    { signal },
  );

  prev?.addEventListener("click", () => setStage(active - 1), { signal });
  next?.addEventListener("click", () => setStage(active + 1), { signal });

  document.addEventListener("scroll", schedule, { capture: true, passive: true, signal });
  window.addEventListener("resize", () => {
    measure();
    schedule();
  }, { signal });

  const resize = new ResizeObserver(() => {
    measure();
    schedule();
  });
  if (viz) resize.observe(viz);
  signal.addEventListener("abort", () => {
    seenObserver.disconnect();
    resize.disconnect();
  });

  measure();
  paint(true);

  return {
    refresh: (force = false) => {
      measure();
      paint(force);
    },
    setStage,
    getStage: () => active,
  };
}

function closestFraction(path: SVGPathElement, total: number, point: { x: number; y: number }): number {
  let best = 0;
  let bestDistance = Infinity;
  const steps = 220;
  for (let step = 0; step <= steps; step += 1) {
    const length = (total * step) / steps;
    const sample = path.getPointAtLength(length);
    const distance = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = length / total;
    }
  }
  return best;
}
