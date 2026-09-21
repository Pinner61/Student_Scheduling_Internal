"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

interface DropdownMenuProps {
  triggerLabel?: string;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({
  triggerLabel = "Open actions menu",
  children,
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] rounded-md border border-[var(--color-border)] bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement<{ onSelect?: () => void }>(child)) return child;
            return React.cloneElement(child, {
              onSelect: () => {
                child.props.onSelect?.();
                setOpen(false);
              },
            });
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
  onSelect?: () => void;
}

export function DropdownMenuItem({
  className,
  destructive,
  onSelect,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]",
        destructive && "text-red-600 hover:bg-red-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
      }}
      {...props}
    />
  );
}
