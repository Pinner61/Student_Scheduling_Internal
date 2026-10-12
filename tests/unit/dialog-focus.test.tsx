/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function SearchDialog({ query }: { query: string }) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogContent onClose={() => setOpen(false)}>
        <label htmlFor="member-search">Available students</label>
        <input id="member-search" data-testid="member-search" defaultValue="" />
        <p>{query}</p>
      </DialogContent>
    </Dialog>
  );
}

describe("dialog search focus", () => {
  it("does not steal focus back to the close button when dialog content updates", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SearchDialog query="" />);
    });

    const search = container.querySelector<HTMLInputElement>("[data-testid='member-search']");
    expect(search).toBeTruthy();
    await act(async () => {
      search!.focus();
    });
    expect(document.activeElement).toBe(search);

    await act(async () => {
      root.render(<SearchDialog query="jordan" />);
    });

    expect(document.activeElement).toBe(search);
    expect(container.querySelector("[aria-label='Close dialog']")).not.toBe(document.activeElement);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
