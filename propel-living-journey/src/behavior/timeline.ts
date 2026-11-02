export interface TimelineController {
  setYear(id: string): void;
  destroy(): void;
}

export interface TimelineMountOptions {
  reducedMotion?: boolean;
}

const controllers = new WeakMap<HTMLElement, TimelineController>();

/**
 * Scroll progress, year navigation, and a short reveal.
 * The line tracks reading position. It does not mark project completion.
 * A second call on the same element returns the existing controller.
 */
export function mountPropelTimeline(root: HTMLElement, options: TimelineMountOptions = {}): TimelineController {
  const existing = controllers.get(root);
  if (existing && root.dataset.propelTimelineReady === "true") return existing;

  const abort = new AbortController();
  const signal = abort.signal;
  const reduced = resolveReduced(options.reducedMotion);
  const section = root.querySelector<HTMLElement>(".propel-timeline") ?? root;
  const track = root.querySelector<HTMLElement>(".propel-timeline__track");
  const nav = root.querySelector<HTMLElement>(".propel-timeline__nav");
  const live = root.querySelector<HTMLElement>("[data-timeline-live]");
  const years = [...root.querySelectorAll<HTMLElement>(".propel-timeline__year")];
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".propel-timeline__nav a")];
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-timeline-node], .propel-timeline__year-mark")];
  const bar = document.querySelector<HTMLElement>(".timeline-review__bar");

  root.classList.toggle("propel-timeline--reduced", reduced);
  root.classList.remove("propel-timeline--motion");

  let frame = 0;
  let currentId = years[0]?.id ?? "";
  let locked = false;
  let lockTimer = 0;
  let booted = false;
  let revealObserver: IntersectionObserver | undefined;

  const yearIds = new Set(years.map((year) => year.id));

  const applyOffset = () => {
    const headerHeight =
      bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().height : 0;
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    section.style.setProperty("--tl-sticky-offset", `${headerHeight}px`);
    section.style.setProperty("--tl-scroll-pad", `${headerHeight + navHeight + 12}px`);
    sizeEndSpace();
  };

  const sizeEndSpace = () => {
    const space = root.querySelector<HTMLElement>(".propel-timeline__end-space");
    const last = years[years.length - 1];
    const close = root.querySelector<HTMLElement>(".propel-timeline__close");
    if (!space || !last) return;
    const pad = Number.parseFloat(getComputedStyle(section).getPropertyValue("--tl-scroll-pad")) || 0;
    const tail = (close ?? last).getBoundingClientRect().bottom - last.getBoundingClientRect().top;
    const needed = Math.max(140, window.innerHeight - pad - tail);
    const next = `${Math.ceil(needed)}px`;
    if (space.style.height !== next) space.style.height = next;
  };

  const showYearLink = (id: string) => {
    const link = links.find((item) => item.getAttribute("href") === `#${id}`);
    const scroller = link?.parentElement;
    if (!link || !scroller?.classList.contains("propel-timeline__nav-years")) return;
    const delta = link.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    scroller.scrollTo({
      left: scroller.scrollLeft + delta - scroller.clientWidth / 2 + link.clientWidth / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const setCurrent = (id: string, announce: boolean) => {
    const changed = id !== currentId;
    currentId = id;
    years.forEach((year) => year.classList.toggle("is-current", year.id === id));
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (announce && changed && booted && live) {
      const spoken = years.find((year) => year.id === id)?.dataset.yearSpoken ?? "";
      live.textContent = spoken;
    }
    if (changed) showYearLink(id);
  };

  const updateProgress = () => {
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const marker = window.innerHeight * 0.42;
    const amount = (marker - rect.top) / Math.max(rect.height, 1);
    const value = Math.min(1, Math.max(0, amount));
    section.style.setProperty("--tl-progress", value.toFixed(4));
    nodes.forEach((node) => {
      const box = node.getBoundingClientRect();
      const center = box.top + box.height / 2;
      node.classList.toggle("is-reached", center <= marker);
    });
  };

  const spy = () => {
    if (locked || years.length === 0) return;
    const marker = (nav?.getBoundingClientRect().bottom ?? 0) + 48;
    let next = years[0]?.id ?? "";
    years.forEach((year) => {
      if (year.getBoundingClientRect().top <= marker) next = year.id;
    });
    if (!next || next === currentId) return;
    setCurrent(next, true);
    const url = new URL(window.location.href);
    if (url.hash !== `#${next}`) {
      url.hash = next;
      window.history.replaceState(null, "", url);
    }
  };

  const scrollToYear = (id: string, fromUser: boolean) => {
    const target = years.find((year) => year.id === id);
    if (!target) return;
    setCurrent(id, fromUser);
    locked = true;
    window.clearTimeout(lockTimer);
    const pad = Number.parseFloat(getComputedStyle(section).getPropertyValue("--tl-scroll-pad")) || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - pad - 16;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const dest = Math.min(Math.max(0, top), max);
    const behavior = reduced || Math.abs(dest - window.scrollY) > 1600 ? "auto" : "smooth";
    window.scrollTo({ top: dest, behavior });
    lockTimer = window.setTimeout(() => {
      locked = false;
      spy();
    }, reduced ? 60 : 1600);
    if (!fromUser) return;
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.pushState(null, "", url);
  };

  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      updateProgress();
      spy();
    });
  };

  if (!reduced) {
    const items = [...root.querySelectorAll<HTMLElement>(".propel-timeline__reveal")];
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.01 },
    );
    const viewBottom = window.innerHeight * 0.96;
    items.forEach((item) => {
      const box = item.getBoundingClientRect();
      if (box.top < viewBottom && box.bottom > 0) item.classList.add("is-in");
      else revealObserver?.observe(item);
    });
    root.classList.add("propel-timeline--motion");
  }

  nav?.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!(link instanceof HTMLAnchorElement) || !nav.contains(link)) return;
      const id = link.getAttribute("href")?.replace("#", "") ?? "";
      if (!yearIds.has(id)) return;
      event.preventDefault();
      scrollToYear(id, true);
    },
    { signal },
  );

  nav?.addEventListener(
    "keydown",
    (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      const index = links.findIndex((link) => link === document.activeElement);
      if (index < 0) return;
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = Math.min(links.length - 1, index + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = Math.max(0, index - 1);
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = links.length - 1;
      else return;
      event.preventDefault();
      links[next]?.focus();
    },
    { signal },
  );

  window.addEventListener("scroll", onScroll, { signal, passive: true });
  window.addEventListener("resize", onScroll, { signal });
  window.addEventListener(
    "hashchange",
    () => {
      const id = window.location.hash.replace("#", "");
      if (!yearIds.has(id) || id === currentId) return;
      scrollToYear(id, false);
    },
    { signal },
  );
  if ("onscrollend" in window) {
    window.addEventListener(
      "scrollend",
      () => {
        locked = false;
      },
      { signal },
    );
  }

  const resizeObserver = new ResizeObserver(() => {
    applyOffset();
    updateProgress();
  });
  resizeObserver.observe(document.documentElement);
  if (bar) resizeObserver.observe(bar);
  if (track) resizeObserver.observe(track);

  applyOffset();
  updateProgress();
  const fromHash = window.location.hash.replace("#", "");
  if (yearIds.has(fromHash)) scrollToYear(fromHash, false);
  else spy();
  booted = true;
  root.classList.add("propel-timeline--ready");
  root.dataset.propelTimelineReady = "true";

  const controller: TimelineController = {
    setYear(id: string) {
      if (yearIds.has(id)) scrollToYear(id, true);
    },
    destroy() {
      abort.abort();
      window.clearTimeout(lockTimer);
      if (frame) window.cancelAnimationFrame(frame);
      revealObserver?.disconnect();
      resizeObserver.disconnect();
      root.classList.remove("propel-timeline--ready", "propel-timeline--reduced", "propel-timeline--motion");
      delete root.dataset.propelTimelineReady;
      controllers.delete(root);
    },
  };

  controllers.set(root, controller);
  return controller;
}

function resolveReduced(forced: boolean | undefined): boolean {
  if (forced !== undefined) return forced;
  const param = new URLSearchParams(window.location.search).get("motion");
  if (param === "reduce") return true;
  if (param === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
