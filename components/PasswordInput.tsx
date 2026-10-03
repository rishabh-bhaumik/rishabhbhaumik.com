"use client";

import { useState } from "react";
import Image from "next/image";
import { useSfx } from "@/lib/sfx";

export default function PasswordInput({
  minLength = 9,
  onSubmit,
  placeholder = "Enter your password",
}: {
  minLength?: number;
  onSubmit: (value: string) => boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const revealed = value.length >= minLength;
  const { play } = useSfx();

  const submit = () => {
    if (!revealed) return;
    const ok = onSubmit(value);
    if (ok) {
      play("/media/pw-success.mp3", 0.175);
    } else {
      setError(true);
      play("/media/pw-error.mp3", 0.15);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        data-no-click-sfx
        className={`flex h-8 w-[298px] max-w-full items-center gap-1 rounded-md border bg-black pl-[9px] pr-1 transition-colors ${
          error ? "border-red-500/60" : "border-[#1c1c1c] focus-within:border-white/25"
        }`}
      >
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={placeholder}
          autoFocus
          aria-label="Password"
          className="min-w-0 flex-1 bg-transparent text-14 leading-none text-white outline-none placeholder:text-faint"
          style={{ caretColor: revealed ? "transparent" : undefined }}
        />
        {revealed && (
          <button
            type="button"
            onClick={error ? () => { setValue(""); setError(false); } : submit}
            aria-label={error ? "Reset" : "Enter"}
            className="grid size-6 shrink-0 place-items-center rounded transition-opacity hover:opacity-70"
          >
            <Image
              src={error ? "/media/Iconography/password/password-field-refresh.png" : "/media/Iconography/password/password-field-enter.png"}
              alt=""
              width={12}
              height={12}
              className="size-3"
            />
          </button>
        )}
      </div>
      {error && (
        <p className="text-12 text-red-400">Incorrect password. Try again.</p>
      )}
    </div>
  );
}
