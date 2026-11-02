import { checkedIndex } from "./choices";
import type { MotionFlags } from "./motion";
import { createPathway, type PathwayController } from "../viz/pathway";
import { site } from "../content/site";

export interface JourneyController {
  setStage(index: number): void;
  getStage(): number;
  refresh(animate?: boolean): void;
  destroy(): void;
}

export function bindJourney(root: HTMLElement, signal: AbortSignal, motion: MotionFlags): JourneyController {
  const svg = root.querySelector<SVGSVGElement>(".pathway-svg");
  const pathway: PathwayController | null = svg ? createPathway(svg) : null;
  const live = root.querySelector<HTMLElement>("[data-year-live]");
  const steps = [...root.querySelectorAll<HTMLButtonElement>("[data-year-step]")];

  const radios = () => [...root.querySelectorAll<HTMLInputElement>('input[name="propel-year"]')];

  const paint = (animate = true) => {
    const index = checkedIndex(root, "propel-year");
    pathway?.setStage(index, animate && !motion.reduced);
    const stage = site.journey.stages[index];
    if (live && stage) live.textContent = `${stage.yearLabel}, ${stage.name}`;
    steps.forEach((button) => {
      const delta = Number(button.dataset.yearStep);
      const target = index + delta;
      const disabled = target < 0 || target >= radios().length;
      button.disabled = disabled;
      button.setAttribute("aria-disabled", disabled ? "true" : "false");
    });
  };

  steps.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const index = checkedIndex(root, "propel-year");
        const delta = Number(button.dataset.yearStep);
        const next = radios()[index + delta];
        if (!next) return;
        next.checked = true;
        next.dispatchEvent(new Event("change", { bubbles: true }));
        next.focus();
      },
      { signal },
    );
  });

  root.querySelectorAll<HTMLDetailsElement>(".milestone").forEach((item) => {
    item.addEventListener(
      "toggle",
      () => {
        if (!item.open) return;
        item.closest(".stage-panel")?.querySelectorAll<HTMLDetailsElement>(".milestone").forEach((other) => {
          if (other !== item) other.open = false;
        });
      },
      { signal },
    );
  });

  return {
    setStage(index: number) {
      const radio = radios()[index];
      if (!radio) return;
      radio.checked = true;
      paint(true);
    },
    getStage() {
      return checkedIndex(root, "propel-year");
    },
    refresh(animate = false) {
      paint(animate);
    },
    destroy() {
      pathway?.destroy();
    },
  };
}
