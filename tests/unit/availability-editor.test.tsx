/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { AvailabilityPaintEditor } from "@/features/availability/availability-paint-editor";

vi.mock("@/app/actions/scheduling", () => ({
  saveAvailabilityAction: vi.fn(),
}));

describe("availability editor layout", () => {
  it("keeps the action bar outside the scrolling grid", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AvailabilityPaintEditor
          initialRanges={[]}
          workingDayStart="09:00"
          workingDayEnd="11:00"
        />
      );
    });

    const scroller = container.querySelector("[data-testid='availability-grid-scroller']");
    const bar = container.querySelector("[data-testid='availability-action-bar']");
    expect(scroller).toBeTruthy();
    expect(bar).toBeTruthy();
    expect(scroller?.contains(bar)).toBe(false);
    expect(bar?.className).not.toMatch(/sticky/);
    expect(container.textContent).toContain("Save Availability");
    expect(container.textContent).toContain("Discard Changes");
    expect(container.textContent).toContain("Share availability in text");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
