export function checkedIndex(root: ParentNode, name: string): number {
  const inputs = [...root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
  const index = inputs.findIndex((input) => input.checked);
  return index < 0 ? 0 : index;
}

export function checkedHash(root: ParentNode, name: string): string {
  const input = root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return input?.dataset.hash ?? "";
}

export function bindChoices(root: HTMLElement, signal: AbortSignal, onChange: () => void): void {
  root.querySelectorAll<HTMLInputElement>("input[data-hash]").forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        const hash = input.dataset.hash;
        if (hash && location.hash !== `#${hash}`) {
          history.pushState({ propel: hash }, "", `#${hash}`);
        }
        onChange();
      },
      { signal },
    );
  });

  const applyHash = () => {
    const id = location.hash.replace(/^#/, "");
    if (!id) {
      ["propel-year", "propel-pillar", "propel-tier"].forEach((name) => {
        const first = root.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (first) first.checked = true;
      });
      onChange();
      return;
    }
    const input = root.querySelector<HTMLInputElement>(`input[data-hash="${CSS.escape(id)}"]`);
    if (input && !input.checked) input.checked = true;
    onChange();
  };

  window.addEventListener("hashchange", applyHash, { signal });
  window.addEventListener("popstate", applyHash, { signal });
  applyHash();
}
