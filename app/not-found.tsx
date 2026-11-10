import Header from "@/components/Header";
import RetryButton from "@/components/RetryButton";

/**
 * Any address that doesn't exist (Figma 8189:3173), with the site header kept so
 * there's a way on. Below 640px the line scales with the screen so it stays on one
 * line.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center">
        <section className="flex w-full max-w-[700px] flex-col items-center gap-6 px-4 pb-20 pt-[60px]">
          <h1 className="whitespace-nowrap text-[min(48px,9vw)] font-normal leading-[1.1] tracking-[-0.02em] text-ink">
            404 / 404 / 404 / 404
          </h1>
          <div className="py-2">
            <RetryButton />
          </div>
        </section>
      </main>
    </>
  );
}
