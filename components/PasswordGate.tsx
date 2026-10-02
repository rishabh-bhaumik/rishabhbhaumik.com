"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/PasswordInput";

/**
 * Soft client-side gate for case-study pages. Re-prompts on every visit (the
 * unlock lives only in component state — no persistence). NOTE: the password is
 * in the frontend, so this is a soft teaser gate, not real security.
 *
 * Each project passes its own `project` name (surfaced in the title + input
 * placeholder), its own `password`, and which study to show once unlocked.
 */
/**
 * The case studies themselves, as separate chunks: nothing of a study (its
 * code, its WebGL, its media) downloads until the password is right. Typing
 * starts fetching it, so the unlock itself is instant.
 */
const LOADERS = {
  saathi: () => import("@/components/saathi/SaathiContent"),
  identity: () => import("@/components/bk/IdentityContent"),
};
const CONTENT = {
  saathi: dynamic(LOADERS.saathi),
  identity: dynamic(LOADERS.identity),
};
export type GatedContent = keyof typeof CONTENT;

export default function PasswordGate({
  project,
  password,
  content,
}: {
  project: string;
  password: string;
  content: GatedContent;
}) {
  const [authed, setAuthed] = useState(false);

  if (authed) {
    const Content = CONTENT[content];
    return <Content />;
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[var(--reading-max)] pt-2">
        <section className="flex flex-col gap-6 px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <h1 className="font-display text-32 leading-none text-ink">
            Confirm Entry for &ldquo;{project}&rdquo;
          </h1>
          <div className="flex flex-col gap-1.5" onFocusCapture={() => void LOADERS[content]()}>
            <span className="text-14 leading-[1.4] text-ink">Password</span>
            <PasswordInput
              placeholder={`Enter password for "${project}"`}
              minLength={password.length}
              onSubmit={(v) => {
                const ok = v === password;
                if (ok) setAuthed(true);
                return ok;
              }}
            />
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
