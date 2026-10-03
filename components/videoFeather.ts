import type { CSSProperties } from "react";

/**
 * For a clip whose backdrop is the light page colour: browsers composite video
 * a level or two off CSS colour, so a hard video edge shows as a faint frame.
 * Feathering the outer edge into its card (which is the page colour) hides it.
 */
const EDGES =
  "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)";

export const VIDEO_FEATHER: CSSProperties = {
  maskImage: EDGES,
  maskComposite: "intersect",
  WebkitMaskImage: EDGES,
  WebkitMaskComposite: "source-in",
};
