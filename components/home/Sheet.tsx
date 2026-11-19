import SheetFooter from "./SheetFooter";
import SheetNav from "./SheetNav";

/**
 * The ruled sheet (Figma 8780:35610): one 1200px column with hairlines down both
 * sides, the nav stuck to its top and the footer at its foot. Home, the 404, the
 * projects, About, Work and Play sit on it.
 */
export default function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[var(--shell-max)] flex-col border-rule min-[1201px]:border-x">
      <SheetNav />
      <main className="flex flex-1 flex-col gap-20">{children}</main>
      <SheetFooter />
    </div>
  );
}
