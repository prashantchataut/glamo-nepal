"use client";

import { useState, type ReactNode } from "react";

export function ComingSoonTooltip({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <span
        tabIndex={0}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-describedby="coming-soon-tooltip"
      >
        {children}
      </span>
      {show && (
        <span
          id="coming-soon-tooltip"
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 whitespace-nowrap rounded-none bg-brand-bgDark px-3 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          Coming soon
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-brand-bgDark" />
        </span>
      )}
    </span>
  );
}