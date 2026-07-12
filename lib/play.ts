import { PLAY, type PlayItem } from "@/data/site";

/** oEmbed endpoint for a Play item's provider. */
function oembedUrl(item: PlayItem): string {
  const src = encodeURIComponent(item.oembed);
  return item.provider === "vimeo"
    ? `https://vimeo.com/api/oembed.json?url=${src}&width=1200`
    : `https://soundcloud.com/oembed?format=json&url=${src}`;
}

/**
 * Fetch a cover thumbnail for one Play item from its provider's oEmbed. Returns
 * null on any failure ("otherwise skip" → the card falls back to its violet
 * gradient). Runs at build time; Next caches the fetch (weekly revalidate).
 */
export async function getPlayThumbnail(item: PlayItem): Promise<string | null> {
  try {
    const res = await fetch(oembedUrl(item), {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

/** Thumbnails for every Play item, in order (null where unavailable). */
export async function getPlayThumbnails(
  items: PlayItem[] = PLAY,
): Promise<(string | null)[]> {
  return Promise.all(items.map(getPlayThumbnail));
}
