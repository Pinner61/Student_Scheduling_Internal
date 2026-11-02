/**
 * Mount boundary for the PROPEL experience.
 *
 * The root element must already contain the semantic markup. This demo injects
 * that markup at build time. A Drupal template can print the same structure and
 * call `mountPropelJourney` when it attaches.
 *
 * A second call on the same element returns the existing controller and does
 * not bind listeners again.
 */
import { bindChoices, checkedHash } from "./behavior/choices";
import { bindForm } from "./behavior/form";
import { bindJourney } from "./behavior/journey";
import type { MotionFlags } from "./behavior/motion";
import { bindNav } from "./behavior/nav";
import { bindPortraits, bindReveal } from "./behavior/reveal";
import { createPillarLinks, type PillarLinksController } from "./viz/pillar-links";

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
    console.warn("PROPEL: no experience markup found inside the mount element.");
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
  const pillarSvg = root.querySelector<SVGSVGElement>(".pillar-svg");
  const pillars: PillarLinksController | null = pillarSvg ? createPillarLinks(pillarSvg) : null;

  const paint = (animate = true) => {
    journey.refresh(animate);
    pillars?.setActive(checkedHash(root, "propel-pillar"), animate && !motion.reduced);
  };

  bindChoices(root, signal, () => paint(true));
  bindNav(root, signal, motion);
  bindForm(root, signal);
  bindReveal(root, signal, motion);
  bindPortraits(root, signal);
  paint(false);

  root.classList.add("propel-enhanced");
  root.dataset.propelInitialized = "true";

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onPreference = () => {
    if (options.reducedMotion !== undefined || motionQuery() !== null) return;
    motion.reduced = media.matches;
    syncMotionClass(root, motion.reduced);
    paint(false);
  };
  media.addEventListener("change", onPreference, { signal });

  const chrome = new ResizeObserver(() => syncChrome(root));
  const header = root.querySelector(".site-header");
  if (header) chrome.observe(header);
  window.addEventListener("resize", () => syncChrome(root), { signal });

  const controller: PropelJourneyController = {
    destroy() {
      abort.abort();
      chrome.disconnect();
      journey.destroy();
      pillars?.destroy();
      root.classList.remove("propel-enhanced", "propel-reduced", "propel-motion-full");
      delete root.dataset.propelInitialized;
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
  root.classList.toggle("propel-motion-full", !reduced && motionQuery() === "full");
}

function syncChrome(root: HTMLElement) {
  const header = root.querySelector(".site-header");
  if (header instanceof HTMLElement) {
    const height = header.offsetHeight;
    root.style.setProperty("--header-h", `${height}px`);
    document.documentElement.style.scrollPaddingTop = `${height + 16}px`;
  }
}
