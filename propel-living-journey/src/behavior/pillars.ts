/** Pointer and touch selection for the pillar diagram. Radios carry the keyboard. */
export function bindPillars(root: HTMLElement, signal: AbortSignal): void {
  root.querySelectorAll<SVGGElement>("[data-pillar-node]").forEach((node) => {
    node.addEventListener(
      "click",
      () => {
        const id = node.getAttribute("data-pillar-node");
        if (!id) return;
        const input = root.querySelector<HTMLInputElement>(
          `input[name="propel-pillar"][value="${CSS.escape(id)}"]`,
        );
        if (!input) return;
        input.checked = true;
        input.focus({ preventScroll: true });
      },
      { signal },
    );
  });
}
