# Optimizations

Things that work today but could be lighter or faster. Each entry says where it
stands now, what to do, and what it saves.

## Background music file (`public/media/bgm/bgm.mp3`)

**Now:** 18 MB. MP3 at 320 kbps, 48 kHz stereo, 7 min 32 s. Played by the dock's
music control (`components/Dock.tsx`, `lib/bgm.ts`, path in `SITE.bgm.src` in
`data/site.ts`). Nothing downloads until the music starts, and browsers stream it
in ranges as it plays, so the first paint never waits on it. A visitor who
listens through still pulls the whole file, which is heavy on mobile data.

**Do:** re-encode to AAC at 128 kbps, about 7 MB, with little audible difference
for a lofi track. macOS can do it without extra tools:

```bash
afconvert -f m4af -d aac -b 128000 public/media/bgm/bgm.mp3 public/media/bgm/bgm.m4a
```

Then point `SITE.bgm.src` at `/media/bgm/bgm.m4a` and delete the MP3. AAC in .m4a
plays in Chrome, Safari, Firefox and Edge. To stay on MP3 instead, use ffmpeg
(`ffmpeg -i bgm.mp3 -b:a 128k bgm-128.mp3`, about 7 MB).

**Saves:** about 11 MB per full listen. Note that the 18 MB file stays in git
history (commit `b9b6d54`) after it's replaced; reclaiming that space would need
a history rewrite, which isn't worth it at this size.
