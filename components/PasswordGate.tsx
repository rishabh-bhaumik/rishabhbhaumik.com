"use client";

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
 * placeholder) and its own `password`.
 */
export default function PasswordGate({
  project,
  password,
  children,
}: {
  project: string;
  password: string;
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);

  if (authed) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[var(--reading-max)] pt-2">
        <section className="flex flex-col gap-6 px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <h1 className="font-display text-[32px] leading-none text-ink">
            Confirm Entry for &ldquo;{project}&rdquo;
          </h1>
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] leading-[1.4] text-ink">Password</span>
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
