import type { Metadata } from "next";
import PeetalContent from "@/components/peetal/PeetalContent";

// Unlisted deep-dive on Peetal (linked from 004 on /draft). Kept out of search
// results by the robots meta below and the X-Robots-Tag header in next.config.ts.
export const metadata: Metadata = {
  title: "Peetal",
  robots: { index: false, follow: false, nocache: true },
};

export default function PeetalPage() {
  return <PeetalContent />;
}
