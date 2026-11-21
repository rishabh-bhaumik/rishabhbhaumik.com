"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Sheet from "@/components/home/Sheet";
import PasswordInput from "@/components/PasswordInput";
import NextProject from "@/components/project/NextProject";

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
type GatedContent = keyof typeof CONTENT;
/** Each study's slug in SELECTED_WORK, so the gate can offer the project after it. */
const SLUG: Record<GatedContent, string> = { saathi: "bima-saathi", identity: "bimakavach-identity" };

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
    // On the ruled sheet, like the project pages it opens; the sheet is at least a
    // screen tall, so its footer sits at the bottom of the window.
    <Sheet>
      <section className="flex flex-col gap-6 px-4 pb-24 sm:px-6 pt-[var(--sheet-top-phone)] sm:pt-[var(--sheet-top)]">
        <h1 className="text-28 leading-[1.3] tracking-[-0.015em] text-ink sm:text-40 lg:text-48">
          Confirm Entry for &ldquo;{project}&rdquo;
        </h1>
        <div className="flex max-w-[520px] flex-col gap-1.5" onFocusCapture={() => void LOADERS[content]()}>
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
      {/* The way on is open before the password too, as it is at the study's foot. */}
      <NextProject after={SLUG[content]} />
    </Sheet>
  );
}
