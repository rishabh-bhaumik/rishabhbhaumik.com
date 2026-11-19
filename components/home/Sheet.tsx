import SheetContact from "./SheetContact";
import SheetFooter from "./SheetFooter";
import SheetNav from "./SheetNav";

/**
 * The ruled sheet (Figma 8780:35610): one 1200px column with hairlines down both
 * sides, the nav stuck to its top and the footer at its foot. Home, the 404, the
 * projects, About, Work and Play sit on it. `contact` puts the contact block over the
 * footer, the foot of the pages that aren't projects (home, About, Play, the 404);
 * projects end on Next Project instead.
 */
export default function Sheet({ children, contact }: { children: React.ReactNode; contact?: boolean }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[var(--shell-max)] flex-col border-rule min-[1201px]:border-x">
      <SheetNav />
      <main className="flex flex-1 flex-col gap-20">
        {children}
        {contact && <SheetContact />}
      </main>
      <SheetFooter />
    </div>
  );
}
