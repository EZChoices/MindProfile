"use client";

import { useState } from "react";
import Link from "next/link";

export function ShareActions({ profileId }: { profileId: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/result/${profileId}`;

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300/60 hover:bg-white/15"
      >
        {copied ? "Link copied" : "Copy share link"}
      </button>
      <Link
        href="/analyze"
        className="rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
      >
        Start another
      </Link>
    </div>
  );
}
