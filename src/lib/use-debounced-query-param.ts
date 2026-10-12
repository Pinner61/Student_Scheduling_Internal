"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 300;

type PendingFocus = { key: string; caret: number; x: number; y: number } | null;

/** Survives Next.js remounts caused by search-param navigations. */
let pendingFocus: PendingFocus = null;

export function resetPendingSearchFocus() {
  pendingFocus = null;
}

export function useDebouncedQueryParam(paramName: string, pathname: string, urlValue: string, paramsString: string) {
  const router = useRouter();
  const [value, setValue] = useState(urlValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const [, startTransition] = useTransition();
  const focusKey = `${pathname}:${paramName}`;

  useLayoutEffect(() => {
    if (pendingFocus?.key !== focusKey) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const caret = Math.min(pendingFocus.caret, el.value.length);
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      // some input types reject setSelectionRange
    }
    try {
      window.scrollTo(pendingFocus.x, pendingFocus.y);
    } catch {
      // jsdom does not implement scrollTo
    }
    pendingFocus = null;
  }, [focusKey]);

  useEffect(() => {
    if (focusedRef.current) return;
    setValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    if (value === urlValue) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(paramsString);
      if (value) next.set(paramName, value);
      else next.delete(paramName);
      const qs = next.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value, urlValue, paramsString, pathname, paramName, router, startTransition]);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    pendingFocus = {
      key: focusKey,
      caret: event.target.selectionStart ?? nextValue.length,
      x: window.scrollX,
      y: window.scrollY,
    };
    focusedRef.current = true;
    setValue(nextValue);
  }

  return {
    value,
    inputRef,
    onChange,
    onFocus() {
      focusedRef.current = true;
    },
    onBlur() {
      focusedRef.current = false;
    },
  };
}
