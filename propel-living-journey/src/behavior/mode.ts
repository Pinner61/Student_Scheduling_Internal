import type { MotionFlags } from "./motion";

export function bindMode(root: HTMLElement, signal: AbortSignal, motion: MotionFlags, onChange: () => void): void {
  const overview = root.querySelector<HTMLInputElement>("#propel-mode-overview");
  const story = root.querySelector<HTMLInputElement>("#propel-mode-story");

  if (window.location.hash === "#propel-overview" && overview) {
    overview.checked = true;
    root.querySelector("#propel-overview")?.scrollIntoView({ block: "start" });
  }

  root.querySelectorAll<HTMLInputElement>('input[name="propel-mode"]').forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        const selector = input.value === "overview" ? "#propel-overview" : "#propel-journey";
        const panel = root.querySelector(selector);
        panel?.scrollIntoView({ behavior: motion.reduced ? "auto" : "smooth", block: "start" });
        const heading = panel?.querySelector("h2");
        if (heading instanceof HTMLElement) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
        onChange();
      },
      { signal },
    );
  });

  root.querySelector("[data-goto='story']")?.addEventListener(
    "click",
    (event) => {
      if (!(event instanceof MouseEvent)) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (story) story.checked = true;
      onChange();
      root.querySelector("#propel-journey")?.scrollIntoView({
        behavior: motion.reduced ? "auto" : "smooth",
        block: "start",
      });
    },
    { signal },
  );
}
