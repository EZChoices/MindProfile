import { useState } from "react";

type Resonance = "positive" | "mixed" | "negative";

interface ProfileFeedbackProps {
  profileId: string;
  initialResonance?: Resonance | null;
  initialFeedbackText?: string | null;
  compact?: boolean;
}

export function ProfileFeedback({
  profileId,
  initialResonance = null,
  initialFeedbackText = "",
  compact = false,
}: ProfileFeedbackProps) {
  const [resonance, setResonance] = useState<Resonance | null>(initialResonance);
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!resonance) {
      setError("Pick an option first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          resonance,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
      setMessage("Thanks for the feedback.");
    } catch {
      setError("Couldn't save feedback, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonClass = (value: Resonance) =>
    `rounded-full border px-3 py-2 text-xs font-semibold transition ${
      resonance === value
        ? "border-emerald-300/70 bg-emerald-300/15 text-white"
        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
    }`;

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 ${
        compact ? "p-4" : "p-6"
      } space-y-3 text-sm text-slate-200`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Feedback</p>
        <span className="text-xs text-slate-300">How well does this fit you?</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass("positive")} onClick={() => setResonance("positive")}>
          Mostly right
        </button>
        <button type="button" className={buttonClass("mixed")} onClick={() => setResonance("mixed")}>
          Mixed
        </button>
        <button type="button" className={buttonClass("negative")} onClick={() => setResonance("negative")}>
          Not really
        </button>
      </div>
      {resonance && (
        <div className="space-y-2">
          <textarea
            rows={3}
            placeholder="Anything you’d change or add?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-300/60"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="rounded-full bg-emerald-300/20 px-4 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-300/30 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Submit feedback"}
            </button>
            <div className="text-xs">
              {message && <span className="text-emerald-200">{message}</span>}
              {error && <span className="text-red-200">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
