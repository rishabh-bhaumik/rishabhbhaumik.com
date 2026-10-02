"use client";

import { useEffect, useRef } from "react";

/**
 * A muted, looping clip that costs nothing until it is near the screen: the
 * poster paints straight away, the file is only fetched once the clip comes
 * within `margin` of the viewport, and it plays only while visible (pausing
 * off screen and in background tabs). `warm` fetches just the first bytes
 * ahead of time, for a clip that is about to be shown.
 */
export default function LazyVideo({
  src,
  poster,
  className,
  margin = "200px",
  warm = false,
}: {
  src: string;
  poster: string;
  className?: string;
  margin?: string;
  warm?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) {
        if (video.preload !== "auto") video.preload = "auto";
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { rootMargin: margin },
    );
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [margin, src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload={warm ? "metadata" : "none"}
      className={className}
    />
  );
}
