import type { MotionFlags } from "./motion";

const SELECTOR = ".contrast, .concepts, .pillar-map, .pillar-panels, .tier-layout, .pathway, .stage-panels, .person-feature, .team-group, .donors .wrap, .contact-layout";

export function bindReveal(root: HTMLElement, signal: AbortSignal, motion: MotionFlags): void {
  const items = [...root.querySelectorAll<HTMLElement>(SELECTOR)];
  if (motion.reduced || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }
  items.forEach((item) => item.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );
  items.forEach((item) => observer.observe(item));
  signal.addEventListener("abort", () => observer.disconnect());
}

export function bindPortraits(root: HTMLElement, signal: AbortSignal): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const ready = () => image.classList.add("is-ready");
    if (image.complete && image.naturalWidth > 0) ready();
    else image.addEventListener("load", ready, { signal });

    if (!image.closest(".portrait")) return;
    const hide = () => image.classList.add("is-missing");
    if (image.complete && image.naturalWidth === 0) hide();
    image.addEventListener("error", hide, { signal });
  });
}
