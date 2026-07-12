import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Play-gallery cover thumbnails come from Vimeo / SoundCloud oEmbed.
    remotePatterns: [
      { protocol: "https", hostname: "**.vimeocdn.com" },
      { protocol: "https", hostname: "**.sndcdn.com" },
    ],
  },
};

export default nextConfig;
