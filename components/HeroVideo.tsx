"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIMEO_ORIGIN = "https://player.vimeo.com";

/**
 * The home showreel. The poster paints straight from the server HTML; the
 * Vimeo player (hundreds of KB of script plus a video stream) only mounts once
 * the page has loaded and gone idle, and the poster stays until the video is
 * actually playing, so there is never a black flash.
 */
export default function HeroVideo({ src, poster, title }: { src: string; poster: string | null; title: string }) {
  const [mount, setMount] = useState(false);
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const go = () => {
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(() => setMount(true), { timeout: 2500 });
      else timer = window.setTimeout(() => setMount(true), 400);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!mount) return;
    // The player says when it is really playing; until then the poster shows.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== VIMEO_ORIGIN || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string } = {};
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data?.event === "ready") {
        frame.current?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "playProgress" }), VIMEO_ORIGIN);
      } else if (data?.event === "playProgress" || data?.event === "play") {
        setPlaying(true);
      }
    };
    window.addEventListener("message", onMessage);
    // Fallback: some players never report; show it anyway after a while.
    const fallback = window.setTimeout(() => setPlaying(true), 6000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(fallback);
    };
  }, [mount]);

  return (
    <>
      {poster && (
        <Image src={poster} alt="" fill preload fetchPriority="high" sizes="(max-width: 832px) 100vw, 832px" className="object-cover" />
      )}
      {mount && (
        <iframe
          ref={frame}
          src={src}
          title={title}
          allow="autoplay; fullscreen"
          className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}
