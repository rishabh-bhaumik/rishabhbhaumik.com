import { PLAY } from "@/data/site";
import { getPlayThumbnails } from "@/lib/play";
import PlayGallery, { type PlayCardData } from "./PlayGallery";

/**
 * Home "Play" gallery (#play). Server component: fetches provider oEmbed cover
 * thumbnails at build time, then hands off to the client gallery for the
 * click-to-play interaction. Wider than the 700px reading column by design.
 */
export default async function PlaySection() {
  const thumbs = await getPlayThumbnails(PLAY);
  const items: PlayCardData[] = PLAY.map((item, i) => ({
    ...item,
    thumb: thumbs[i],
  }));

  return (
    <section
      id="play"
      className="mx-auto w-full max-w-[var(--shell-max)] scroll-mt-24 px-4 pt-24 sm:px-6"
    >
      <PlayGallery items={items} />
    </section>
  );
}
