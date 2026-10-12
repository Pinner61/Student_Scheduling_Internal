/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { CoverageFilters } from "@/features/coverage/coverage-filters";
import { resetPendingSearchFocus } from "@/lib/use-debounced-query-param";

const replace = vi.fn();
const push = vi.fn();
const params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => params,
}));

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("coverage student search", () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    params.delete("q");
    resetPendingSearchFocus();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets the user type a full query before updating the URL", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <CoverageFilters
          teams={[]}
          students={[]}
          basePath="/supervisor/team"
          showSearch
        />
      );
    });

    const search = container.querySelector<HTMLInputElement>("[aria-label='Search student name']");
    expect(search).toBeTruthy();

    await act(async () => {
      search!.focus();
      typeInto(search!, "a");
    });
    await act(async () => {
      typeInto(search!, "al");
    });
    await act(async () => {
      typeInto(search!, "alex");
    });

    expect(search!.value).toBe("alex");
    expect(document.activeElement).toBe(search);
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(replace).toHaveBeenCalledTimes(1);
    expect(String(replace.mock.calls[0]?.[0])).toContain("q=alex");
    expect(replace.mock.calls[0]?.[1]).toEqual({ scroll: false });
    expect(document.activeElement).toBe(search);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("restores search focus after a search-param remount", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <CoverageFilters
          teams={[]}
          students={[]}
          basePath="/supervisor/team"
          showSearch
        />
      );
    });

    const search = container.querySelector<HTMLInputElement>("[aria-label='Search student name']");
    await act(async () => {
      search!.focus();
      typeInto(search!, "al");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      root.unmount();
    });

    params.set("q", "al");
    const nextRoot = createRoot(container);
    await act(async () => {
      nextRoot.render(
        <CoverageFilters
          teams={[]}
          students={[]}
          basePath="/supervisor/team"
          showSearch
        />
      );
    });

    const restored = container.querySelector<HTMLInputElement>("[aria-label='Search student name']");
    expect(restored?.value).toBe("al");
    expect(document.activeElement).toBe(restored);

    await act(async () => {
      nextRoot.unmount();
    });
    container.remove();
  });
});
