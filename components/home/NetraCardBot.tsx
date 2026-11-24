"use client";

import { m, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { NetraBot, type NetraBotHandle } from "../netrabot/NetraBot";

/*
 * NetraBot in BimaNetra's Selected Work card. It pops in as the card scrolls into view
 * (and ducks out as it leaves) and stays in the middle of it, following the pointer
 * wherever it is on the page: its head turns and tips and its eyes slide toward it, and
 * it leans a little to the pointer's side on a soft spring. When nothing has
 * moved for a while it gets on with its own life: it runs through a string of moods
 * (held faces, with a one-off reaction now and then), then nods off. Any movement wakes
 * it, with a double take if it was asleep. BimaNetra's own bot only reacts to events;
 * the lean and the idle moods are made here from its parts. Under reduced motion it
 * doesn't follow or lean, and its moods change without the reactions.
 */

/** Quiet this long and it starts its moods; it changes mood this often; it sleeps after this many. */
const IDLE_MS = 3500;
const MOOD_MS = 2600;
const MOODS_BEFORE_SLEEP = 10;

/** Faces it holds while idle (BimaNetra's expressions), and the reactions it slips in. */
const MOODS = ["curious", "bored", "playful", "sceptical", "content", "cheeky", "thinking", "hopeful", "shy", "sleepy", "amazed", "remembering"];
const REACTIONS = ["hmm", "curiousTilt", "winkReaction", "shrug", "softSmile", "curiousPeek", "laugh"];

/** How far it leans toward the pointer's side, in degrees, with the pointer at the screen's edge. */
const TILT = 8;

type Mood = { state: string; expression?: string };

export default function NetraCardBot() {
  const box = useRef<HTMLDivElement>(null);
  const self = useRef<HTMLDivElement>(null);
  const bot = useRef<NetraBotHandle>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [seen, setSeen] = useState(false);
  const [size, setSize] = useState(112);
  const [mood, setMood] = useState<Mood>({ state: "idle" });
  const tilt = useMotionValue(0);
  const lean = useSpring(tilt, { stiffness: 90, damping: 14, mass: 0.8 });

  // Shown while the card is well on screen; sized to the card.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const ro = new ResizeObserver(([e]) => setSize(Math.round(Math.min(128, Math.max(56, e.contentRect.width * 0.1)))));
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  // The pointer, and what it does when there isn't one.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let idleTimer = 0;
    let moodTimer = 0;
    let count = 0;
    let asleep = false;
    let idle = false;
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

    const nextMood = () => {
      count += 1;
      if (count > MOODS_BEFORE_SLEEP) {
        asleep = true;
        setMood({ state: "sleeping" });
        return;
      }
      // Mostly a new face to hold; now and then a little one-off on top.
      if (!still && Math.random() < 0.3) bot.current?.react(pick(REACTIONS));
      else setMood({ state: "idle", expression: pick(MOODS) });
      moodTimer = window.setTimeout(nextMood, MOOD_MS);
    };
    const goIdle = () => {
      idle = true;
      count = 0;
      nextMood();
    };
    const wake = () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(moodTimer);
      if (idle) {
        idle = false;
        setMood({ state: "idle" });
        if (asleep && !still) bot.current?.react("doubleTake");
        asleep = false;
      }
      idleTimer = window.setTimeout(goIdle, IDLE_MS);
    };

    const onMove = (e: PointerEvent) => {
      wake();
      pointer.current = { x: e.clientX, y: e.clientY };
      if (still) return;
      // The lean: a few degrees toward the pointer's side, more the further out it is.
      const me = self.current?.getBoundingClientRect();
      if (!me) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (me.left + me.width / 2)) / (window.innerWidth / 2)));
      tilt.set(nx * TILT);
    };
    const onLeave = () => {
      pointer.current = null;
      tilt.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    idleTimer = window.setTimeout(goIdle, IDLE_MS);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("mouseleave", onLeave);
      window.clearTimeout(idleTimer);
      window.clearTimeout(moodTimer);
    };
  }, [tilt]);

  // Head and eyes on the pointer, wherever it is on the page (as BimaNetra's follow="page":
  // ±1 at half the screen away), or straight ahead once it leaves the window.
  const gaze = () => {
    const p = pointer.current;
    const me = self.current?.getBoundingClientRect();
    if (!p || !me) return null;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    return {
      x: clamp((p.x - (me.left + me.width / 2)) / (window.innerWidth / 2)),
      y: clamp((p.y - (me.top + me.height / 2)) / (window.innerHeight / 2)),
    };
  };

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0">
      <m.div className="absolute left-1/2 top-1/2" style={{ rotate: lean }}>
        <div ref={self} className="-translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
          <NetraBot
            ref={bot}
            size={size}
            state={mood.state}
            expression={mood.expression}
            visible={seen}
            enter="sparkPop"
            exit="duckDown"
            effects
            getGaze={gaze}
          />
        </div>
      </m.div>
    </div>
  );
}
