import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ClickSFX from "@/components/ClickSFX";
import SoundToggle from "@/components/SoundToggle";
import PageRevealSFX from "@/components/PageRevealSFX";
import { SfxProvider } from "@/lib/sfx";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.role}`,
  description:
    "Practicing Experience Design at BimaKavach in Bengaluru. Product & visual design, design systems, and craft.",
  openGraph: {
    title: `${SITE.name} — Product & Visual Designer`,
    description:
      "Design systems and product craft for India's most complex industries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SfxProvider>
          <PageRevealSFX />
          <ClickSFX />
          <SoundToggle />
          <SmoothScroll>{children}</SmoothScroll>
        </SfxProvider>
      </body>
    </html>
  );
}
