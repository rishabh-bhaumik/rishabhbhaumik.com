"use client";

import { useState } from "react";
import DraftRail from "./DraftRail";

/**
 * The rail drawer and its trigger. The page always runs full width; hovering the
 * 24px left edge slides the rail in over it, and leaving the rail slides it back
 * out. From md up. Rendered beside the sheet, not inside it (app/draft/page.tsx).
 */
export default function DraftShell() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Edge trigger, under the nav (61px); stands down while the rail is open so it can't steal the hover. */}
      <div
        aria-hidden="true"
        onMouseEnter={() => setOpen(true)}
        className={`fixed bottom-0 left-0 top-[61px] z-40 hidden w-6 md:block ${open ? "pointer-events-none" : ""}`}
      />
      <DraftRail open={open} onOpenChange={setOpen} />
    </>
  );
}
