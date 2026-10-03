import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ClickSFX from "@/components/ClickSFX";
import SoundToggle from "@/components/SoundToggle";
import PageRevealSFX from "@/components/PageRevealSFX";
import { SfxProvider } from "@/lib/sfx";
import MotionProvider from "@/components/MotionProvider";
import ThemeSync from "@/components/ThemeSync";
import { SITE } from "@/data/site";
import { THEME_SCRIPT } from "@/lib/theme-script";

export const metadata: Metadata = {
  title: `${SITE.name} - ${SITE.role}`,
  description:
    "Practicing Experience Design at BimaKavach in Bengaluru. Product and visual design, design systems, and craft.",
  openGraph: {
    title: `${SITE.name} - Product & Visual Designer`,
    description:
      "Design systems and product craft for India's most complex industries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme is set before paint by THEME_SCRIPT, so the server's "dark" may
    // differ from what the client hydrates over.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeSync />
        <MotionProvider>
          <SfxProvider>
            <PageRevealSFX />
            <ClickSFX />
            <SoundToggle />
            <SmoothScroll>{children}</SmoothScroll>
          </SfxProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
