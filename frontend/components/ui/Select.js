"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CheckIcon } from "./icons";

/**
 * Custom styled dropdown, replacing native <select>.
 * `options` accepts either plain strings or { value, label } objects.
 */
export default function Select({ value, onChange, options, placeholder = "Select...", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-left text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper"
      >
        <span className={selected ? "" : "text-ink/35 dark:text-paper/35"}>{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon
          width={15}
          height={15}
          className={`shrink-0 text-ink/40 transition-transform dark:text-paper/40 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-lg border border-line bg-cloud py-1 shadow-lg dark:border-line-dark dark:bg-graphite-2">
          {normalized.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${
                o.value === value
                  ? "bg-signal/10 font-medium text-signal dark:bg-signal-dark/15 dark:text-signal-dark"
                  : "text-ink/75 hover:bg-paper dark:text-paper/75 dark:hover:bg-graphite"
              }`}
            >
              {o.label}
              {o.value === value && <CheckIcon width={15} height={15} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}