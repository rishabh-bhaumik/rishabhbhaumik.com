"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import {
  AudioLines,
  Moon,
  Settings2,
  SunMedium,
  SunMoon,
  Volume2,
  VolumeX,
  X,
  createLucideIcon,
} from "lucide-react";
import { armOnLanding, setBgm, useBgm, useBgmPlaying } from "@/lib/bgm";
import { EASE } from "@/lib/motion";
import { useSfx, useSilentRoute } from "@/lib/sfx";
import { isDarkOnlyRoute, readMode, setTheme, useThemePreference, type ThemeMode } from "@/lib/theme";
import { resolveMode } from "@/lib/theme-script";

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

/*
 * Drawn at 1.25× Figma's 33px component: a 41.25px button and pill, 20px icons
 * (Figma's 16px with a 1.25 stroke), 10px padding, an 11.25px gap, 15px labels.
 */
const ICON = { size: 20, strokeWidth: 1.5625, absoluteStrokeWidth: true } as const;

/** Shared skin: the header's overlay fill (`bg-bg/90`) under Figma's hairline. */
const SKIN = "border-[0.625px] border-[rgba(169,172,177,0.16)] bg-bg/90";

/**
 * The mode control switches between dark and light. Auto (lib/theme-script) is kept
 * but not offered; a saved auto switches to the opposite of what it's showing.
 */
const nextMode = (mode: ThemeMode): ThemeMode => (resolveMode(mode) === "light" ? "dark" : "light");
const MODE_ICON: Record<ThemeMode, React.ReactNode> = {
  dark: <Moon {...ICON} />,
  auto: <SunMoon {...ICON} />,
  light: <SunMedium {...ICON} />,
};

/** Icon tones from Figma: resting, lit (the hovered thing), sunk (everything else). */
const REST = "text-[#a9acb1]";
const LIT = "text-ink";
const SUNK = "text-surface";

/**
 * The view control (Figma 8705:56277, "supermenu"): a round settings button with a
 * slim pill of three controls above it: theme mode (dark or light), background
 * music, sound effects (music and sound effects are independent).
 *
 * - Default (8705:56274): only the button, Lucide settings-2.
 * - Hover the button (8705:56275): the pill comes out at rest, the icon lights.
 * - Hover a control (8705:56349 / 56400 / 56447): it lights up with its state
 *   written beside it ("mode: dark", "music: on", "sfx: on"); the other controls
 *   and the button sink.
 * - Click (or tap) the button: the pill is pinned open and the icon becomes an x;
 *   clicking the x, Escape or a click elsewhere closes it.
 *
 * With a mouse it also shows on hover, while the pointer is over the button, the
 * pill or the gap between, however many times you click a control; keyboard focus
 * behaves the same. `drop`: the pill opens above the button (floating dock) or
 * below it (phone header).
 */
export function DockControls({ drop = "up", className = "" }: { drop?: "up" | "down"; className?: string }) {
  const pathname = usePathname() ?? "/";
  const silent = useSilentRoute();
  const mode = useThemePreference();
  const music = useBgm();
  const playing = useBgmPlaying();
  const { muted, toggle: toggleSfx } = useSfx();
  const [hoverIn, setHoverIn] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  /** Opened by a click or tap on the button, until it's closed. */
  const [pinned, setPinned] = useState(false);
  /** The control under the pointer or keyboard focus (0-2), if any. */
  const [hot, setHot] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // The page a visit lands on decides whether the music starts on (home does).
  useEffect(() => armOnLanding(pathname), [pathname]);

  // Mouse: open while the pointer is over the eye, the pill or the gap between them,
  // judged by where the pointer actually is rather than by enter/leave events. Those
  // misfire when the page changes under a still pointer (the theme switch's
  // cross-fade covers the page for a moment), which closed the menu on every click.
  useEffect(() => {
    const SLACK = 4;
    const within = (x: number, y: number) => {
      const boxes = [toggleRef.current, menuRef.current]
        .map((el) => el?.getBoundingClientRect())
        .filter((b): b is DOMRect => !!b && b.width > 0);
      if (!boxes.length) return false;
      return (
        x >= Math.min(...boxes.map((b) => b.left)) - SLACK &&
        x <= Math.max(...boxes.map((b) => b.right)) + SLACK &&
        y >= Math.min(...boxes.map((b) => b.top)) - SLACK &&
        y <= Math.max(...boxes.map((b) => b.bottom)) + SLACK
      );
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const inside = within(e.clientX, e.clientY);
      setHoverIn(inside);
      if (!inside) setHot(null);
    };
    const onLeaveWindow = () => {
      setHoverIn(false);
      setHot(null);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, []);

  // Pinned open: a click or tap anywhere else closes it.
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  if (silent) return null;

  const shown = hoverIn || focusIn || pinned;
  const tone = (i: number) => (hot === null ? REST : hot === i ? LIT : SUNK);
  // The button: #E6E8EA at rest (Figma), white while the pill is out, sunk while a
  // control is lit.
  const eyeTone = !shown ? "text-[#e6e8ea] light:text-ink/70" : hot === null ? LIT : SUNK;

  const controls = [
    {
      label: `Theme: ${mode}. Switch to ${nextMode(mode)}`,
      state: `mode: ${mode}`,
      icon: MODE_ICON[mode],
      // From the saved mode, so quick repeat clicks step on rather than repeat.
      onClick: () => setTheme(nextMode(readMode()), pathname),
      disabled: isDarkOnlyRoute(pathname),
    },
    {
      label: music ? "Stop the music" : "Play music",
      state: `music: ${music ? "on" : "off"}`,
      // The bars move only while it's actually sounding (it waits for a first gesture).
      icon: music ? (
        <AudioLines {...ICON} className={playing ? "dock-wave" : undefined} />
      ) : (
        <AudioLinesX {...ICON} />
      ),
      onClick: () => setBgm(!music),
      pressed: music,
    },
    {
      label: muted ? "Turn sound effects on" : "Mute sound effects",
      state: `sfx: ${muted ? "off" : "on"}`,
      icon: muted ? <VolumeX {...ICON} /> : <Volume2 {...ICON} />,
      onClick: toggleSfx,
      pressed: !muted,
      quiet: true, // no click sound on the sound switch itself
    },
  ];

  return (
    <div
      ref={root}
      className={`relative w-[41.25px] ${className}`}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) setFocusIn(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocusIn(false);
          setHot(null);
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !shown) return;
        toggleRef.current?.focus();
        setFocusIn(false);
        setPinned(false);
        setHot(null);
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        onPointerEnter={() => setHot(null)}
        onFocus={() => setHot(null)}
        onClick={() => setPinned((p) => !p)}
        aria-expanded={shown}
        aria-controls={shown ? menuId : undefined}
        aria-label={pinned ? "Close view controls" : "View controls"}
        className={`grid size-[41.25px] place-items-center rounded-full transition-colors duration-200 ${SKIN} ${eyeTone}`}
      >
        {pinned ? <X {...ICON} /> : <Settings2 {...ICON} />}
      </button>

      <AnimatePresence>
        {shown && (
          <m.div
            key="menu"
            ref={menuRef}
            id={menuId}
            role="group"
            aria-label="View controls"
            initial={{ opacity: 0, y: drop === "up" ? 10 : -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: drop === "up" ? 10 : -10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`absolute left-0 flex w-[41.25px] flex-col rounded-full ${SKIN} ${
              drop === "up" ? "bottom-full mb-[11.25px] origin-bottom" : "top-full mt-[11.25px] origin-top"
            }`}
          >
            {controls.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={c.onClick}
                disabled={c.disabled}
                aria-label={c.label}
                aria-pressed={c.pressed}
                data-no-click-sfx={c.quiet || undefined}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHot(i);
                }}
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) setHot(i);
                }}
                className={`relative flex w-full justify-center px-[10px] transition-colors duration-200 focus-visible:outline-offset-[-3px] disabled:opacity-40 ${
                  i < 2
                    ? "pt-[10px] pb-[10.3125px] after:absolute after:bottom-0 after:left-1/2 after:w-5 after:-translate-x-1/2 after:border-b-[0.3125px] after:border-[#1c1d1f] light:after:border-ink/15"
                    : "py-[10px]"
                } ${tone(i)}`}
              >
                {c.icon}
                {/* The lit control's state, just left of the pill. */}
                {hot === i && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-full top-1/2 mr-[0.625px] -translate-y-1/2 whitespace-nowrap p-[10px] text-right text-[15px] leading-[1.7] text-ink underline"
                  >
                    {c.state}
                  </span>
                )}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The splash's only control (/enter and the 404, components/enter/Splash): the theme
 * switch on its own, bottom right on every screen size (the splash has no header).
 * Same skin and icons as the dock; hovering it writes its state beside it. Enter
 * swaps it for the full dock.
 */
export function EnterModeSwitch() {
  const pathname = usePathname() ?? "/";
  const mode = useThemePreference();
  const [hot, setHot] = useState(false);
  return (
    <div
      style={{ "--i": 4 } as React.CSSProperties}
      className="rise fixed bottom-4 right-4 z-40 sm:bottom-8 sm:right-8"
    >
      <button
        type="button"
        onClick={() => setTheme(nextMode(readMode()), pathname)}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHot(true);
        }}
        onPointerLeave={() => setHot(false)}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setHot(true);
        }}
        onBlur={() => setHot(false)}
        aria-label={`Theme: ${mode}. Switch to ${nextMode(mode)}`}
        className={`relative grid size-[41.25px] place-items-center rounded-full transition-colors duration-200 ${SKIN} ${
          hot ? LIT : "text-[#e6e8ea] light:text-ink/70"
        }`}
      >
        {MODE_ICON[mode]}
        {hot && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-full top-1/2 mr-[0.625px] -translate-y-1/2 whitespace-nowrap p-[10px] text-right text-[15px] leading-[1.7] text-ink underline"
          >
            mode: {mode}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * The floating view control, bottom right, from sm up (phones carry it in the
 * header instead). Always there; content passing under it is veiled by the same
 * 90% background the header uses. While a splash is up (/enter, the 404) it steps
 * aside for the splash's own theme switch (`.site-dock`, globals.css).
 */
export default function Dock() {
  const silent = useSilentRoute();
  if (silent) return null;
  return (
    // .rise: it fades up as it appears (on load, and again when a splash's Enter shows it).
    <div style={{ "--i": 6 } as React.CSSProperties} className="site-dock rise fixed bottom-8 right-8 z-40 max-sm:hidden">
      <DockControls />
    </div>
  );
}
