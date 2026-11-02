export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function paragraphs(items: readonly string[]): string {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}
