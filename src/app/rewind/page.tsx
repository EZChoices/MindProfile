"use client";

import { useState } from "react";
import Link from "next/link";
import { getOrCreateClientId } from "@/lib/clientId";
import type { RewindSummary } from "@/lib/rewind";

const errorMessages: Record<string, string> = {
  no_file: "Please select your ChatGPT export file.",
  invalid_file: "We couldn’t read that file. Please upload the ChatGPT export ZIP or JSON.",
  no_data: "That export looks empty — make sure you have some chat history.",
  analysis_failed: "We couldn’t generate your Rewind. Please try again.",
};

const formatHour = (hour: number) => {
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${display} ${suffix}`;
};

const formatHourRange = (hour: number) => `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;

export default function RewindPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rewind, setRewind] = useState<RewindSummary | null>(null);

  const handleFileChange = (next: FileList | null) => {
    const chosen = next?.[0] ?? null;
    setFile(chosen);
    setApiError(null);
    setRewind(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);

    if (!file) {
      setApiError(errorMessages.no_file);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".zip") && !lowerName.endsWith(".json")) {
      setApiError(errorMessages.invalid_file);
      return;
    }

    setLoading(true);
    try {
      const clientId = getOrCreateClientId();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", clientId);

      const res = await fetch("/api/rewind", { method: "POST", body: formData });
      const data = (await res.json()) as { rewind?: RewindSummary; error?: string };

      if (!res.ok || !data.rewind) {
        setApiError(errorMessages[data.error || "analysis_failed"] || errorMessages.analysis_failed);
        return;
      }

      setRewind(data.rewind);
    } catch (err) {
      console.error("Rewind upload failed", err);
      setApiError(errorMessages.analysis_failed);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setRewind(null);
    setApiError(null);
  };

  return (
    <main className="beam gridlines relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pb-16 pt-12 sm:px-10 lg:pt-16">
        <header className="space-y-4">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-emerald-200">
            MindProfile
          </Link>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            AI Year in Rewind
          </h1>
          <p className="muted text-base leading-relaxed text-slate-100">
            Upload your ChatGPT export and get a private, just‑for‑fun highlight reel of your
            year with AI.
          </p>
        </header>

        <div className="glass card-border grid gap-6 rounded-3xl p-6 sm:p-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              How to grab your export
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-100">
              <li>Open ChatGPT → Settings → Data controls → Export data.</li>
              <li>Check your email for the download link, then grab the file.</li>
              <li>Upload the ZIP or JSON here — no need to unzip.</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-100">
              <span className="font-semibold">Upload your ChatGPT export</span>
              <input
                type="file"
                accept=".zip,.json,application/zip,application/json"
                onChange={(e) => handleFileChange(e.currentTarget.files)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-50 hover:file:bg-emerald-300/30"
              />
            </label>

            {apiError && <p className="text-sm text-rose-200">{apiError}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-6 py-3 text-base font-semibold text-slate-900 shadow-xl shadow-emerald-500/30 transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                {loading ? "Generating your Rewind..." : "Generate my Rewind"}
              </button>
              <p className="muted text-xs text-slate-200">
                Your data stays private — we anonymize and don’t save raw chats.
              </p>
            </div>
          </form>
        </div>

        {rewind && (
          <section className="grid gap-6">
            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your top topics
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-100">
                {rewind.topTopics.map((t) => (
                  <li key={t.key}>
                    {t.emoji} <b>{t.label}</b>{" "}
                    <span className="muted text-xs">
                      ({t.count} {t.count === 1 ? "chat" : "chats"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                When you chat
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-100">
                <p>
                  You had <b>{rewind.totalConversations}</b> conversations and wrote{" "}
                  <b>{rewind.totalUserMessages}</b> prompts across{" "}
                  <b>{rewind.activeDays || 0}</b> active days.
                </p>
                {rewind.busiestMonth && (
                  <p>
                    Your busiest month was <b>{rewind.busiestMonth}</b>.
                  </p>
                )}
                {rewind.peakHour != null && (
                  <p>
                    Prime time: <b>{formatHourRange(rewind.peakHour)}</b>.
                  </p>
                )}
                {rewind.lateNightPercent > 0 && (
                  <p>
                    🌙 Late‑night chats made up <b>{rewind.lateNightPercent}%</b> of your year.
                  </p>
                )}
              </div>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your AI quirks
              </div>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-100">
                {rewind.topWord && (
                  <li>
                    Favorite word: <b>{rewind.topWord}</b>.
                  </li>
                )}
                {rewind.frequentPhrases.map((p) => (
                  <li key={p.phrase}>
                    You leaned on “{p.phrase}” about <b>{p.count}</b> times.
                  </li>
                ))}
                {rewind.frequentPhrases.length === 0 && (
                  <li>You kept things fresh — no single phrase dominated.</li>
                )}
              </ul>
            </div>

            <div className="glass card-border rounded-3xl p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Year records
              </div>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-100">
                {rewind.longestPromptChars != null && (
                  <li>
                    Longest prompt: <b>{rewind.longestPromptChars.toLocaleString()}</b>{" "}
                    characters.
                  </li>
                )}
                {rewind.avgPromptChars != null && (
                  <li>
                    Typical prompt length: around <b>{rewind.avgPromptChars}</b> characters.
                  </li>
                )}
                {rewind.promptLengthChangePercent != null && (
                  <li>
                    Your prompts got{" "}
                    <b>{Math.abs(rewind.promptLengthChangePercent)}%</b>{" "}
                    {rewind.promptLengthChangePercent > 0 ? "longer" : "shorter"} over the year.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-emerald-300/60 hover:bg-white/10"
              >
                Try another export
              </button>
              <Link
                href="/"
                className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-6 py-3 text-sm font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
              >
                Back to home
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

