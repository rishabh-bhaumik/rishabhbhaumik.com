import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Unlisted work-in-progress page: reachable only by its link. Kept out of search
// results by the robots meta below and the X-Robots-Tag header in next.config.ts.
export const metadata: Metadata = {
  title: "Draft",
  robots: { index: false, follow: false, nocache: true },
};

export default function DraftPage() {
  return (
    <>
      <Header />
      <main className="min-h-svh" />
      <Footer />
    </>
  );
}
