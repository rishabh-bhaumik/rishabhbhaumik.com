"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSfx } from "@/lib/sfx";
import LazyVideo from "@/components/LazyVideo";

const PHOTOS = [
  {
    src: "/media/about/carousel01.mp4",
    caption: "The city of joy, shot from above.",
    content:
      "I always want to be blown away by the wind of life and what it has to offer. I could float, fly, and soar. I have always been cradled in the City of Joy, being able to be creative and expressive in a city that encourages exploration - where everyone has something to say about everything. However when I first took flight to India’s Silicon Valley - I knew I had to change - mould myself to a new life.",
  },
  {
    src: "/media/about/carousel02.mp4",
    caption: "An extremely rare look at a young Rahul & Molly Bhaumik. Unknown dtv.",
    content:
      "I love this picture because I don’t have many like these. A life before me, a life with strangers getting to know each other. A life where my parents were young, naive, and in a less fortunate position than the one they’ve given me.",
  },
  {
    src: "/media/about/carousel-3.mp4",
    caption: "A truck with “Amul Doodh” (Amul Milk) written in Bangla.",
    content:
      "My mother tongue was something I actively avoided, I wanted to be the smart sounding, English flaunting boy in school. But I think I understood its value the minute I moved. Bangla is what connects me to my sensibilities, my attitude. I want to read a book written completely in Bangla from front to end in my lifetime.",
  },
  {
    src: "/media/about/carousel-4.mp4",
    caption: "Re-entering my own classroom after 10 years.",
    content:
      "School has formed the core of my confidence and self belief. The Debate Teams, the Theatre Productions. Being “that guy” in school was one of the most priceless experiences I’ve ever had. In my lifetime, I want to make this version of myself happy.",
  },
  {
    src: "/media/about/carousel-5.mp4",
    caption: "The window near the kitchen of my home.",
    content:
      "My family has seen financial ups and downs throughout my upbringing. When my father decided to start on his own, we remembered days when he used to borrow pedestal fans to put me to sleep because Kolkata was so humid and we couldn’t afford air conditioning.",
  },
];

/** Each slide's sound, levelled so they all play equally loud (the files are mastered unevenly). */
const SLIDE_VOLUME = [0.25, 0.38, 0.25, 0.7, 0.39];

export default function PhotoCarousel() {
  const [i, setI] = useState(0);
  const total = PHOTOS.length;
  const photo = PHOTOS[i];
  const { play } = useSfx();
  const pad = (n: number) => String(n).padStart(3, "0");
  const prev = () => {
    const target = (i - 1 + total) % total;
    setI(target);
    play(`/media/about-carousel-sfx/${target + 1}.mp3`, SLIDE_VOLUME[target]);
  };
  const next = () => {
    const target = (i + 1) % total;
    setI(target);
    play(`/media/about-carousel-sfx/${target + 1}.mp3`, SLIDE_VOLUME[target]);
  };

  return (
    <div>
      {/* Photo/video frame */}
      <div className="relative aspect-[800/560] w-full overflow-hidden rounded-2xl bg-black">
        {/* Each clip has its own poster, so a swap never flashes; the next clip's poster is fetched ahead. */}
        <LazyVideo
          key={photo.src}
          src={photo.src}
          poster={photo.src.replace(/\.mp4$/, ".webp")}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <link rel="prefetch" as="image" href={PHOTOS[(i + 1) % total].src.replace(/\.mp4$/, ".webp")} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />
        <p className="absolute inset-x-0 bottom-5 px-4 text-left font-mono text-12 leading-snug text-muted sm:px-8 sm:text-center">
          {photo.caption}
        </p>
      </div>

      {/* Content + carousel control. Copy flushes left on mobile to line up with
          the rest of the page; the centered stack is a desktop composition.

          Every copy occupies the same grid cell, so the block always reserves
          the height of the longest one and the controls below hold their
          position as you page through. Inactive copies keep their space via
          `invisible` (visibility: hidden), which also drops them from the
          accessibility tree. */}
      <div className="mt-6 grid px-3">
        {PHOTOS.map((p, n) => (
          <p
            key={p.src}
            aria-hidden={n !== i}
            className={`col-start-1 row-start-1 text-left text-14 leading-relaxed text-muted sm:text-center ${
              n === i ? "" : "invisible"
            }`}
          >
            {p.content}
          </p>
        ))}
      </div>
      <div className="mx-auto mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={total < 2}
          aria-label="Previous photo"
          data-no-click-sfx
          className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-dim"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <span className="font-mono text-14 tabular-nums text-dim">
          {pad(i + 1)} / {pad(total)}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={total < 2}
          aria-label="Next photo"
          data-no-click-sfx
          className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-dim"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
