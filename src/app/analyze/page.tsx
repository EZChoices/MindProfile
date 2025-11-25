"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "link" | "text" | "screenshot";

const demoText = `User: I'm trying to plan an AI agent that helps with customer tickets. Can you propose a flow?
AI: Sure! What's the average handle time and where does context live?
User: We use Slack + Jira. Give me a process map and scripts for the handoffs. Keep it concise and include risks.`;

const modeCopy: Record<Mode, string> = {
  link: "Paste a public ChatGPT/Claude link. We'll fetch the content.",
  text: "Paste 1–3 great chats or transcripts. More detail = better profile.",
  screenshot: "Upload up to 5 screenshots. We run OCR and then profile the text.",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("link");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    if (mode === "link") return !link.trim();
    if (mode === "text") return text.trim().length < 20;
    return !files || files.length === 0;
  }, [mode, link, text, files]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    setError(null);
    setLoading(true);

    try {
      let response: Response;

      if (mode === "link") {
        response = await fetch("/api/ingest/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link.trim() }),
        });
      } else if (mode === "text") {
        response = await fetch("/api/ingest/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } else {
        const formData = new FormData();
        Array.from(files ?? []).forEach((file) => formData.append("files", file));
        response = await fetch("/api/ingest/screenshot", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to create profile.");
      }

      const profileId = data.profileId || data.profile?.id;
      if (!profileId) throw new Error("Profile id missing in response.");
      router.push(`/result/${profileId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="beam gridlines min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="pill inline-flex w-fit items-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
            Level 1 · Share
          </p>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            Ingest a conversation.
          </h1>
          <p className="muted max-w-3xl text-base leading-relaxed">
            Choose how to share your chat. We anonymize text before storage, then generate a
            profile in one pass. More context = higher confidence.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {(["link", "text", "screenshot"] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  mode === option
                    ? "border-emerald-300/70 bg-emerald-300/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  {option === "link" && "Share URL"}
                  {option === "text" && "Paste text"}
                  {option === "screenshot" && "Screenshots"}
                </div>
                <div className="mt-1 font-semibold capitalize text-white">{option}</div>
                <p className="muted mt-2 text-xs leading-relaxed">{modeCopy[option]}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-white">
              {mode === "link" && "Chat share link"}
              {mode === "text" && "Paste conversation"}
              {mode === "screenshot" && "Upload screenshots"}
            </label>
            {mode === "link" && (
              <input
                type="url"
                placeholder="https://chat.openai.com/share/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/60"
              />
            )}
            {mode === "text" && (
              <div className="space-y-3">
                <textarea
                  rows={8}
                  placeholder="Paste 1–3 representative chats. We'll anonymize automatically."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
                <button
                  type="button"
                  onClick={() => setText(demoText)}
                  className="text-xs font-semibold text-emerald-200 underline underline-offset-4"
                >
                  Paste demo text
                </button>
              </div>
            )}
            {mode === "screenshot" && (
              <label className="dropzone flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-white/5 px-4 py-6 text-sm text-slate-200 hover:border-emerald-300/60">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <span className="pill px-4 py-2 text-xs font-semibold text-slate-900">
                  Upload files
                </span>
                <p className="muted text-center text-xs">
                  Drop 1–5 screenshots of your chat window. We will run OCR and discard the
                  images after profiling.
                </p>
                {files && files.length > 0 && (
                  <p className="text-xs text-emerald-200">{files.length} file(s) selected</p>
                )}
              </label>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="muted text-xs">
              Data is anonymized in-pipeline. Profiles are persisted with a short retention window.
            </div>
            <button
              type="submit"
              disabled={loading || disabled}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing…" : "Generate profile"}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </form>

        <div className="glass card-border grid gap-6 rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-[var(--font-display)] text-2xl text-white">
              What we run under the hood
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-emerald-100">
              Anonymize → Profile → Return JSON
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Anonymizer</div>
              <p className="muted mt-2">
                Strips emails, phones, URLs, and obvious names before storing anything.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Profiler</div>
              <p className="muted mt-2">
                Generates thinking and communication styles, strengths, blind spots, and usage
                patterns.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Result</div>
              <p className="muted mt-2">
                We store your profile in-memory for this session and give you a shareable link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
