"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AudioLines, Moon, SunMedium, Volume2, VolumeX, createLucideIcon } from "lucide-react";
import { followMute, setBgm, useBgm } from "@/lib/bgm";
import { useSfx, useSilentRoute } from "@/lib/sfx";
import { isDarkOnlyRoute, setTheme, useThemePreference } from "@/lib/theme";

/**
 * Lucide's audio-lines with the two right-hand bars cut short and an x beside them:
 * the music-off state of Figma's view control (8701:55460), which Lucide doesn't ship.
 */
const AudioLinesX = createLucideIcon("audio-lines-x", [
  ["path", { d: "M2 10v3", key: "a" }],
  ["path", { d: "M6 6v11", key: "b" }],
  ["path", { d: "M10 3v18", key: "c" }],
  ["path", { d: "M14 8v6.35", key: "d" }],
  ["path", { d: "M18 5v8.1", key: "e" }],
  ["path", { d: "M22 10v3", key: "f" }],
  ["path", { d: "m17 17 5 5", key: "g" }],
  ["path", { d: "m22 17-5 5", key: "h" }],
]);

/** Figma draws the icons at 16px with a 1.25 stroke. */
const ICON = { size: 16, strokeWidth: 1.25, absoluteStrokeWidth: true } as const;

/**
 * The view control itself (Figma 8206:1779): theme, background music and sound
 * effects in one pill. Hovering a control brightens it and dims the other two.
 * Used by the floating dock and, on phones, in the header. Its fill is the header's
 * overlay (`bg-bg/90`), so whatever scrolls under it reads through faintly.
 */
export function DockControls({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const silent = useSilentRoute();
  const theme = useThemePreference();
  const music = useBgm();
  const { muted, toggle: toggleSfx } = useSfx();
  const [hot, setHot] = useState<number | null>(null);

  if (silent) return null;

  // The speaker silences everything: the click sounds and, while it's muted, the music.
  const toggleSound = () => {
    toggleSfx();
    followMute(!muted);
  };

  const tone = (i: number) =>
    hot === null ? "text-[#a9acb1]" : hot === i ? "text-ink" : "text-surface";
  /** A control's hover/focus wiring and look; `edge` places its padding and divider. */
  const segment = (i: number, edge: string) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHot(i);
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (e.currentTarget.matches(":focus-visible")) setHot(i);
    },
    onBlur: () => setHot(null),
    className: `relative flex h-full items-center transition-colors duration-200 focus-visible:outline-offset-[-3px] disabled:opacity-40 after:absolute after:top-1/2 after:h-[14px] after:-translate-y-1/2 after:border-[#303745] light:after:border-ink/15 ${edge} ${tone(i)}`,
  });

  return (
    <div
      className={`flex h-9 w-fit items-center overflow-hidden rounded-full border-[0.5px] border-[rgba(169,172,177,0.16)] bg-bg/90 px-[0.5px] ${className}`}
      onPointerLeave={() => setHot(null)}
    >
      <button
        type="button"
        onClick={() => setTheme(theme === "light" ? "dark" : "light", pathname)}
        disabled={isDarkOnlyRoute(pathname)}
        aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        {...segment(0, "pl-2 pr-[8.25px] after:right-0 after:border-r-[0.25px]")}
      >
        {theme === "light" ? <Moon {...ICON} /> : <SunMedium {...ICON} />}
      </button>
      <button
        type="button"
        onClick={() => setBgm(!music, muted)}
        aria-label={music ? "Stop the music" : "Play music"}
        aria-pressed={music}
        {...segment(1, "pl-2 pr-[8.25px] after:right-0 after:border-r-[0.25px]")}
      >
        {music ? <AudioLines {...ICON} className="dock-wave" /> : <AudioLinesX {...ICON} />}
      </button>
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Turn sound on" : "Mute sound"}
        aria-pressed={muted}
        data-no-click-sfx
        {...segment(2, "pl-[8.25px] pr-2 after:left-0 after:border-l-[0.25px]")}
      >
        {muted ? <VolumeX {...ICON} /> : <Volume2 {...ICON} />}
      </button>
    </div>
  );
}

/**
 * The floating dock, bottom right, from sm up (phones carry the controls in the
 * header instead). Always there; content passing under it is veiled by the same
 * 90% background the header uses.
 */
export default function Dock() {
  const silent = useSilentRoute();
  if (silent) return null;
  return (
    <div className="fixed bottom-8 right-8 z-40 max-sm:hidden">
      <DockControls />
    </div>
  );
}
