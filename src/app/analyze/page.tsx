"use client";

import { useEffect, useState } from "react";
import type { Profile, SourceMode } from "@/types/profile";

type Mode = "link" | "text" | "screenshots";
type ProfileSource = SourceMode;

const MIN_TEXT_LENGTH = 50;

const demoText = `User: I'm trying to plan an AI agent that helps with customer tickets. Can you propose a flow?
AI: Sure! What's the average handle time and where does context live?
User: We use Slack + Jira. Give me a process map and scripts for the handoffs. Keep it concise and include risks.`;

const modeCopy: Record<Mode, string> = {
  link: "Paste a public ChatGPT/Claude/Gemini share link.",
  text: "Paste 1-3 great chats or transcripts. More detail = better profile.",
  screenshots: "Upload up to 5 screenshots of a chat. Works from your phone.",
};

export default function AnalyzePage() {
  const [mode, setMode] = useState<Mode>("text");
  const [shareUrl, setShareUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSource, setProfileSource] = useState<ProfileSource | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleScreenshotSelect = (files: FileList | null) => {
    const next = Array.from(files ?? []).slice(0, 5);
    setScreenshotFiles(next);
    setInputError(null);
    setApiError(null);
    if ((files?.length || 0) > 5) {
      setInputError("Upload up to 5 images.");
    }
  };

  useEffect(() => {
    if (profileId && typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/p/${profileId}`);
    } else {
      setShareLink("");
    }
  }, [profileId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setInputError(null);
    setApiError(null);
    setCopied(false);

    const trimmedText = pastedText.trim();
    const trimmedUrl = shareUrl.trim();

    if (mode === "text") {
      if (trimmedText.length < MIN_TEXT_LENGTH) {
        setInputError("Paste a longer conversation so we can read your style.");
        return;
      }
    } else if (mode === "link") {
      if (!trimmedUrl) {
        setInputError("Paste a valid public share link.");
        return;
      }
    } else if (mode === "screenshots") {
      if (screenshotFiles.length === 0) {
        setInputError("Upload at least one screenshot to analyze.");
        return;
      }
      if (screenshotFiles.length > 5) {
        setInputError("Limit to 5 screenshots for now.");
        return;
      }
    } else {
      setApiError("Something went wrong. Please try again.");
      return;
    }

    setLoading(true);
    setProfileId(null);

    try {
      const request = () => {
        if (mode === "text" || mode === "link") {
          return fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body:
              mode === "text"
                ? JSON.stringify({ mode: "text", text: trimmedText })
                : JSON.stringify({ mode: "url", url: trimmedUrl }),
          });
        }

        const formData = new FormData();
        screenshotFiles.forEach((file) => formData.append("images", file));
        return fetch("/api/analyze-screenshots", { method: "POST", body: formData });
      };

      const response = await request();

      const data = (await response.json()) as { profile?: Profile; profileId?: string; error?: string };

      if (!response.ok || !data?.profile) {
        if (mode === "link" && data?.error === "invalid_url_or_content") {
          setApiError("We couldn't read that link. Try a different one or paste the conversation text instead.");
        } else if (mode === "screenshots") {
          setApiError("We couldn't read those screenshots. Try fewer images or a clearer chat.");
        } else if (mode === "link") {
          setApiError("We couldn't analyze that conversation. Try a different one or shorten it.");
        } else {
          setApiError("We couldn't analyze that conversation. Try a different one or shorten it.");
        }
        return;
      }

      setProfile(data.profile);
      setProfileId(data.profileId ?? null);
      setProfileSource(
        (data.profile.sourceMode as ProfileSource | undefined) ??
          (mode === "screenshots" ? "screenshots" : mode === "link" ? "url" : "text"),
      );
    } catch {
      setApiError("We couldn't analyze that conversation. Try a different one or shorten it.");
    } finally {
      setLoading(false);
    }
  };

  const confidenceLabel = profile
    ? `${profile.confidence.charAt(0).toUpperCase()}${profile.confidence.slice(1)}`
    : null;

  return (
    <main className="beam gridlines min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="pill inline-flex w-fit items-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
            Level 1 - Share
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
          <div className="inline-flex w-full overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm">
            {(["link", "text", "screenshots"] as Mode[]).map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMode(option);
                    setInputError(null);
                    setApiError(null);
                  }}
                  className={`flex-1 px-4 py-3 transition ${
                    active
                      ? "bg-emerald-300/20 text-white"
                      : "text-slate-200 hover:bg-white/5"
                  }`}
                  aria-pressed={active}
                >
                  {option === "link" && "Share link"}
                  {option === "text" && "Paste text"}
                  {option === "screenshots" && "Screenshots"}
                </button>
              );
            })}
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="muted text-xs text-slate-200">{modeCopy[mode]}</p>
            <p className="text-[11px] text-slate-300">We only analyze what you provide; sensitive details are stripped.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-white">
              {mode === "link" && "Chat share link"}
              {mode === "text" && "Paste conversation"}
              {mode === "screenshots" && "Upload screenshots"}
            </label>

            {mode === "link" && (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://chatgpt.com/share/..."
                  value={shareUrl}
                  onChange={(e) => setShareUrl(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-200">
                    Paste a public ChatGPT/Claude/Gemini share link. We only analyze what you paste here.
                  </p>
                  {inputError && <span className="text-xs text-red-200">{inputError}</span>}
                </div>
              </div>
            )}

            {mode === "text" && (
              <div className="space-y-2">
                <textarea
                  rows={8}
                  placeholder="Paste 1-3 representative chats. We'll anonymize automatically."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPastedText(demoText)}
                    className="text-xs font-semibold text-emerald-200 underline underline-offset-4"
                  >
                    Paste demo text
                  </button>
                  {inputError && <span className="text-xs text-red-200">{inputError}</span>}
                </div>
                <p className="text-xs text-slate-200">
                  We only analyze what you paste here. Sensitive details are stripped in-pipeline.
                </p>
              </div>
            )}

            {mode === "screenshots" && (
              <div className="space-y-3">
                <label className="dropzone flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-200 hover:border-emerald-300/60">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleScreenshotSelect(e.target.files)}
                  />
                  <span className="pill px-4 py-2 text-xs font-semibold text-slate-900">Upload files</span>
                  <p className="muted text-center text-xs">
                    Upload up to 5 screenshots of a chat. Works from your phone.
                  </p>
                  {screenshotFiles.length > 0 && (
                    <p className="text-xs text-emerald-200">{screenshotFiles.length} file(s) selected</p>
                  )}
                </label>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-200">
                    {"We'll extract text from the images and profile the human."}
                  </p>
                  {inputError && <span className="text-xs text-red-200">{inputError}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="muted text-xs">
              Data is anonymized in-pipeline. Profiles are persisted with a short retention window.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Generate profile"}
            </button>
          </div>

          {apiError && (
            <div className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {apiError}
            </div>
          )}
        </form>

        {profile && (
          <div className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Your MindProfile snapshot
                </p>
                {confidenceLabel && (
                  <p className="muted mt-1 text-sm">Confidence: {confidenceLabel}</p>
                )}
              </div>
              <span className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs text-emerald-50">
                {profileSource === "url" && "Generated from share URL"}
                {profileSource === "text" && "Generated from pasted text"}
                {profileSource === "screenshots" && "Generated from screenshots"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Thinking style
                </div>
                <p className="muted mt-2 leading-relaxed">{profile.thinkingStyle}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Communication style
                </div>
                <p className="muted mt-2 leading-relaxed">{profile.communicationStyle}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Strengths</div>
                <ul className="mt-2 list-inside list-disc space-y-2 text-slate-200">
                  {profile.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Blind spots</div>
                <ul className="mt-2 list-inside list-disc space-y-2 text-slate-200">
                  {profile.blindSpots.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Suggested workflows
                </div>
                <ul className="mt-2 list-inside list-disc space-y-2 text-slate-200">
                  {profile.suggestedWorkflows.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {profile && profileId && (
          <div className="glass card-border space-y-4 rounded-3xl p-6 sm:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Share this profile</p>
                <p className="muted text-sm">Send this link to view the read-only snapshot.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!shareLink) return;
                  try {
                    await navigator.clipboard.writeText(shareLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setCopied(false);
                  }
                }}
                disabled={!shareLink}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <input
              readOnly
              value={shareLink}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
        )}

        <div className="glass card-border grid gap-6 rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-[var(--font-display)] text-2xl text-white">
              What we run under the hood
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-emerald-100">
              {"Anonymize -> Profile -> Return JSON"}
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
                We store your profile briefly so you can use and share the generated snapshot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
