"use client";

import { useState } from "react";
import DraftRail from "./DraftRail";

/**
 * The page plus its rail drawer. The page always runs full width; hovering the
 * 24px left edge slides the rail in over it, and leaving the rail slides it
 * back out. From md up.
 */
export default function DraftShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Edge trigger; stands down while the rail is open so it can't steal the hover. */}
      <div
        aria-hidden="true"
        onMouseEnter={() => setOpen(true)}
        className={`fixed bottom-0 left-0 top-16 z-40 hidden w-6 md:block ${open ? "pointer-events-none" : ""}`}
      />
      <DraftRail open={open} onOpenChange={setOpen} />
      {children}
    </div>
  );
}
