"use client";

import { useEffect, useState } from "react";

interface ShareLinkBlockProps {
  sharePath: string; // e.g. `/p/abc`
}

export function ShareLinkBlock({ sharePath }: ShareLinkBlockProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    setShareUrl(`${origin}${sharePath}`);
  }, [sharePath]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">Share this Mind Report</h3>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          readOnly
          value={shareUrl}
          className="w-full flex-1 truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!shareUrl}
          className="rounded-full bg-emerald-300 px-4 py-2 text-xs font-semibold text-slate-900 shadow disabled:opacity-60"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-300">Anyone with this link can view your card.</p>
    </section>
  );
}
