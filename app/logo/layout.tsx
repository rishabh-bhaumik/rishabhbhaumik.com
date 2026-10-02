import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logo lab",
  robots: { index: false, follow: false },
};

/** /logo — unlisted playground; `data-lenis-prevent` keeps the site's smooth scroll out of its panels. */
export default function LogoLayout({ children }: { children: React.ReactNode }) {
  return <div data-lenis-prevent>{children}</div>;
}
