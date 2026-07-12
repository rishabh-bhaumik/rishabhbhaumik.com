import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description:
    "Who's this Jack again? A bit about Rishabh Bhaumik — heritage, curiosity, and the stories behind the craft.",
};

export default function AboutPage() {
  return <AboutContent />;
}
