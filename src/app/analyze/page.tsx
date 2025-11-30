"use client";

import { useEffect, useState } from "react";
import type { Profile, SourceMode, Tier } from "@/types/profile";
import { ProfileFeedback } from "@/components/ProfileFeedback";
import type { MindCard } from "@/types/mindCard";
import { MindCardView } from "@/components/MindCardView";
import { ShareLinkBlock } from "@/components/ShareLinkBlock";
import { getOrCreateClientId } from "@/lib/clientId";

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

const readStrengthLabel = (confidence?: Profile["confidence"]) => {
  if (confidence === "high") return "Strong";
  if (confidence === "medium") return "Solid";
  return "Light";
};

const readStrengthNote = (confidence?: Profile["confidence"]) => {
  if (confidence === "high") return "Rich conversation with clear patterns — this should feel close to you.";
  if (confidence === "medium") return "Decent amount of information, but still limited context.";
  return "Short or narrow chat — treat this as a first impression.";
};

const ConfidenceText = ({ confidence }: { confidence?: Profile["confidence"] }) => (
  <span className="text-xs text-slate-200">
    Read strength: {readStrengthLabel(confidence)}
    <span
      className="ml-1 text-[10px] text-slate-400 cursor-help"
      title="How sure the model is about these patterns based on the amount and richness of text in this chat."
    >
      ?
    </span>
    <span className="block text-[11px] text-slate-400">{readStrengthNote(confidence)}</span>
  </span>
);

const ShareLinkHelper = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative text-xs text-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/20 px-2 py-1 text-[11px] text-emerald-100 hover:border-emerald-200"
      >
        How to get a share link?
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-[11px] leading-relaxed text-slate-100 shadow-lg">
          <p className="font-semibold text-emerald-100">How to get a share link</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>ChatGPT: open a conversation → click “Share” → “Copy link” → paste here.</li>
            <li>Claude/Gemini: use their “Share / Copy link” on the chat, then paste.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default function AnalyzePage() {
  const [mode, setMode] = useState<Mode>("text");
  const [shareUrl, setShareUrl] = useState("");
  const [shareLinks, setShareLinks] = useState<string[]>([""]);
  const [pastedText, setPastedText] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mindCard, setMindCard] = useState<MindCard | null>(null);
  const [profileSource, setProfileSource] = useState<ProfileSource | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [tier, setTier] = useState<Tier>("first_impression");

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
    // no-op, kept for future hooks if needed
  }, [profileId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setInputError(null);
    setApiError(null);
    setMindCard(null);

    const trimmedText = pastedText.trim();
    const trimmedUrl = shareUrl.trim();
    const clientId = getOrCreateClientId();

    if (mode === "text") {
      if (trimmedText.length < MIN_TEXT_LENGTH) {
        setInputError("Paste a longer conversation so we can read your style.");
        return;
      }
    } else if (mode === "link") {
      const nonEmptyLinks = shareLinks.map((s) => s.trim()).filter(Boolean);
      if (nonEmptyLinks.length === 0) {
        setInputError("Paste at least one share link.");
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
                ? JSON.stringify({ mode: "text", text: trimmedText, clientId })
                : JSON.stringify({ mode: "url", shareUrls: shareLinks.map((s) => s.trim()).filter(Boolean), clientId }),
          });
        }

        const formData = new FormData();
        screenshotFiles.forEach((file) => formData.append("images", file));
        formData.append("clientId", clientId);
        return fetch("/api/analyze-screenshots", { method: "POST", body: formData });
      };

      const response = await request();

      const data = (await response.json()) as {
        profile?: Profile;
        profileId?: string;
        mindCard?: MindCard;
        submissionCount?: number;
        tier?: Tier;
        error?: string;
      };

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
      setMindCard(data.mindCard ?? null);
      setSubmissionCount(data.submissionCount ?? null);
      setTier(data.tier ?? "first_impression");
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
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-white">Chat share links</label>
                    <p className="text-[11px] text-slate-300">
                      Paste 1–3 public ChatGPT/Claude/Gemini share links. We&apos;ll combine them.
                    </p>
                  </div>
                  <ShareLinkHelper />
                </div>
                {shareLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://chatgpt.com/share/..."
                      value={link}
                      onChange={(e) => setShareLinks((prev) => prev.map((l, i) => (i === idx ? e.target.value : l)))}
                      className="w-full flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/60"
                    />
                    {shareLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShareLinks((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-slate-200 hover:border-emerald-200"
                        aria-label="Remove link"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShareLinks((prev) => [...prev, ""])}
                  className="text-[11px] font-semibold text-emerald-200 underline underline-offset-4"
                >
                  + Add another link
                </button>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-200">
                    Paste public share links only. We only analyze what you paste here.
                  </p>
                  {inputError && <span className="text-xs text-red-200">{inputError}</span>}
                </div>
              </div>
            )}

            {mode === "text" && (
              <div className="space-y-2">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold text-white">Best chats to paste</h3>
                  <ul className="mb-3 list-inside list-disc text-xs text-slate-200">
                    <li>Planning something important (trip, project, launch).</li>
                    <li>Working through a real decision (job, move, money, relationship).</li>
                    <li>Asking for help on a problem you actually care about.</li>
                  </ul>
                </div>
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
                  Tip: The more real and messy the conversation, the better the read. Avoid one-word questions or pure trivia.
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

        {mindCard && (
          <div className="space-y-2">
            <div className="text-xs text-slate-200">
              {tier === "first_impression" && (
                <>
                  AI Mind Report — first impression from this chat.
                  <br />
                  {submissionCount ? `Based on ${submissionCount} conversation${submissionCount > 1 ? "s" : ""}` : "Based on 1 conversation"} ·{" "}
                  <ConfidenceText confidence={profile?.confidence} />
                </>
              )}
              {tier === "building_profile" && (
                <>
                  AI Mind Report — you’ve added {submissionCount ?? 2} chats.
                  <br />
                  Add {Math.max(0, 5 - (submissionCount ?? 2))} more to unlock your Full MindProfile.
                </>
              )}
              {tier === "full_profile" && (
                <>
                  AI Mind Report — based on {submissionCount ?? 5} chats from this browser.
                  <br />
                  Full MindProfile unlocked · <ConfidenceText confidence={profile?.confidence} />
                </>
              )}
            </div>
            {tier === "building_profile" && (
              <div className="h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-emerald-300"
                  style={{ width: `${Math.min(5, submissionCount ?? 2) / 5 * 100}%` }}
                />
              </div>
            )}
            <MindCardView
              mindCard={mindCard}
              impressionLabel={tier === "full_profile" ? "AI impression from your chats" : "AI impression from this chat"}
            />
            {profileId && <ShareLinkBlock sharePath={`/p/${profileId}`} />}
          </div>
        )}

        {profile && (
          <div className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your MindProfile snapshot
              </p>
              <p className="muted mt-1 text-sm">
                Read strength: {readStrengthLabel(profile.confidence)}{" "}
                <span
                  className="ml-1 text-[10px] text-slate-400 cursor-help"
                  title="How sure the model is about these patterns based on the amount and richness of text in this chat."
                >
                  ?
                </span>
              </p>
            </div>
            <span className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs text-emerald-50">
              {profileSource === "url" && "Generated from share URL"}
                {profileSource === "text" && "Generated from pasted text"}
                {profileSource === "screenshots" && "Generated from screenshots"}
              </span>
            </div>
            <p className="muted text-xs text-slate-200">
              Read strength: {readStrengthLabel(profile.confidence)}
              <span
                className="ml-1 text-[10px] text-slate-400 cursor-help"
                title="How sure the model is about these patterns based on the amount and richness of text in this chat."
              >
                ?
              </span>
              <span className="block text-[11px] text-slate-400">{readStrengthNote(profile.confidence)}</span>
            </p>

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

        {profileId && (
          <ProfileFeedback profileId={profileId} compact />
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
