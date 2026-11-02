/**
 * Mount boundary for the PROPEL living journey.
 *
 * The root element must already contain the semantic markup. This demo injects
 * that markup at build time from `src/content/roadmap.ts`. A Drupal template
 * can print the same structure and call `mountPropelJourney` when it attaches.
 *
 * A second call on the same element returns the existing controller and does
 * not bind listeners again.
 */
import { bindJourney } from "./behavior/journey";
import { bindMode } from "./behavior/mode";
import { bindPillars } from "./behavior/pillars";
import type { MotionFlags } from "./behavior/motion";

export interface PropelMountOptions {
  /** Force reduced motion on or off. Omit to follow the OS setting and `?motion=`. */
  reducedMotion?: boolean;
}

export interface PropelJourneyController {
  destroy(): void;
  setStage(index: number): void;
  getStage(): number;
}

interface PropelRoot extends HTMLElement {
  propelController?: PropelJourneyController;
}

const controllers = new WeakMap<HTMLElement, PropelJourneyController>();

export function mountPropelJourney(root: HTMLElement, options: PropelMountOptions = {}): PropelJourneyController {
  const existing = controllers.get(root);
  if (existing && root.dataset.propelInitialized === "true") return existing;

  if (!root.querySelector(".hero")) {
    console.warn("PROPEL: no journey markup found inside the mount element.");
    return {
      destroy() {},
      setStage() {},
      getStage: () => 0,
    };
  }

  const abort = new AbortController();
  const { signal } = abort;
  const motion: MotionFlags = { reduced: resolveReduced(options) };
  syncMotionClass(root, motion.reduced);
  syncChrome(root);

  const journey = bindJourney(root, signal, motion);
  bindMode(root, signal, motion, () => journey.refresh(true));
  bindPillars(root, signal);

  root.classList.add("propel-enhanced");
  root.dataset.propelInitialized = "true";

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onPreference = () => {
    if (options.reducedMotion !== undefined || motionQuery() !== null) return;
    motion.reduced = media.matches;
    syncMotionClass(root, motion.reduced);
    journey.refresh(true);
  };
  media.addEventListener("change", onPreference, { signal });

  const chrome = new ResizeObserver(() => syncChrome(root));
  const header = root.querySelector(".site-header");
  const nav = root.querySelector(".journey-nav");
  if (header) chrome.observe(header);
  if (nav) chrome.observe(nav);
  window.addEventListener("resize", () => syncChrome(root), { signal });

  const controller: PropelJourneyController = {
    destroy() {
      abort.abort();
      chrome.disconnect();
      root.classList.remove("propel-enhanced", "propel-reduced");
      delete root.dataset.propelInitialized;
      delete root.dataset.stageReady;
      controllers.delete(root);
      delete (root as PropelRoot).propelController;
    },
    setStage: (index) => journey.setStage(index),
    getStage: () => journey.getStage(),
  };

  controllers.set(root, controller);
  (root as PropelRoot).propelController = controller;
  return controller;
}

function motionQuery(): "reduce" | "full" | null {
  const value = new URLSearchParams(window.location.search).get("motion");
  if (value === "reduce" || value === "full") return value;
  return null;
}

function resolveReduced(options: PropelMountOptions): boolean {
  if (options.reducedMotion !== undefined) return options.reducedMotion;
  const query = motionQuery();
  if (query === "reduce") return true;
  if (query === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncMotionClass(root: HTMLElement, reduced: boolean) {
  root.classList.toggle("propel-reduced", reduced);
}

function syncChrome(root: HTMLElement) {
  const header = root.querySelector(".site-header");
  const nav = root.querySelector(".journey-nav");
  if (header instanceof HTMLElement) {
    root.style.setProperty("--header-h", `${header.offsetHeight}px`);
  }
  if (nav instanceof HTMLElement && window.matchMedia("(max-width: 1023px)").matches) {
    root.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
  } else {
    root.style.setProperty("--nav-h", "0px");
  }
}
