import type { MotionFlags } from "./motion";

export function bindNav(root: HTMLElement, signal: AbortSignal, motion: MotionFlags): void {
  const links = [...root.querySelectorAll<HTMLAnchorElement>(".page-nav a[href^='#']")];
  const sections = links
    .map((link) => root.querySelector<HTMLElement>(link.getAttribute("href") ?? ""))
    .filter((section): section is HTMLElement => section instanceof HTMLElement);

  if (sections.length && "IntersectionObserver" in window) {
    const visible = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        let current: Element | null = null;
        let best = 0;
        visible.forEach((ratio, element) => {
          if (ratio > best) {
            best = ratio;
            current = element;
          }
        });
        links.forEach((link) => {
          const match = current instanceof HTMLElement && link.hash === `#${current.id}`;
          if (match) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    sections.forEach((section) => observer.observe(section));
    signal.addEventListener("abort", () => observer.disconnect());
  }

  root.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((link) => {
    link.addEventListener(
      "click",
      (event) => {
        const id = link.hash.replace(/^#/, "");
        const target = id ? root.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: motion.reduced ? "auto" : "smooth", block: "start" });
        history.pushState(null, "", `#${id}`);
        if (event.detail === 0) {
          if (target.tabIndex < 0) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      },
      { signal },
    );
  });
}
