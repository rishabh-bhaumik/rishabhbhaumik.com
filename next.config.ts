import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first (smallest), WebP where it isn't supported.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    // Play-gallery cover thumbnails come from Vimeo / SoundCloud oEmbed.
    remotePatterns: [
      { protocol: "https", hostname: "**.vimeocdn.com" },
      { protocol: "https", hostname: "**.sndcdn.com" },
    ],
  },
};

export default nextConfig;
