"use client";

import type { MindCard } from "@/types/mindCard";

interface MindCardViewProps {
  mindCard: MindCard;
  impressionLabel?: string;
}

interface ScoreBarProps {
  label: string;
  value: number;
  helper?: string;
}

const clampScore = (value: number) => Math.max(0, Math.min(100, value));
const scoreBand = (value: number) => {
  if (value < 40) return "Low";
  if (value < 70) return "Medium";
  return "High";
};

const mbtiLettersToWords = (type: string): string[] => {
  const map: Record<string, string> = {
    I: "Introverted",
    E: "Extraverted",
    N: "Intuitive",
    S: "Sensing",
    T: "Thinking",
    F: "Feeling",
    P: "Prospecting",
    J: "Judging",
  };
  return type
    .toUpperCase()
    .split("")
    .map((ch) => map[ch] || ch);
};

const ScoreBar = ({ label, value, helper }: ScoreBarProps) => {
  const clamped = clampScore(value);
  return (
    <li className="mb-3">
      <div className="flex items-center justify-between text-xs text-slate-200">
        <div className="flex flex-col">
          <span>{label}</span>
          {helper && <span className="text-[11px] text-slate-400">{helper}</span>}
        </div>
        <span className="text-slate-100">
          {clamped}/100 ({scoreBand(clamped)})
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-sky-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </li>
  );
};

export const MindCardView = ({ mindCard, impressionLabel }: MindCardViewProps) => {
  const { archetypeName, archetypeTagline, brainScores, bigFive, mbti, loveLanguage, roles, brainIndex } = mindCard;
  const mbtiWords = mbtiLettersToWords(mbti.type);

  return (
    <section className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10">
      <div className="mb-2 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">MindCard</p>
            <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl">{archetypeName}</h2>
            <p className="muted mt-1 text-sm text-slate-100">{archetypeTagline}</p>
          </div>
          <div className="text-xs sm:text-right text-slate-200">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {impressionLabel || "AI impression from this chat"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Your brain scores</h3>
          <p className="muted mb-3 mt-1 text-xs">Scores are from 0–100 based on this chat.</p>
          <ul>
            <ScoreBar label="Reasoning depth" value={brainScores.reasoning} />
            <ScoreBar label="Curiosity" value={brainScores.curiosity} />
            <ScoreBar label="Structure & planning" value={brainScores.structure} />
            <ScoreBar
              label="Emotional attunement"
              helper="How tuned-in you seem to feelings in this chat."
              value={brainScores.emotionalAttunement}
            />
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Personality vibes</h3>
          <p className="muted mb-3 mt-1 text-xs">Lightweight impressions, not clinical scores.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">Big Five style</h4>
              <ul className="mt-2">
                <ScoreBar label="Openness" value={bigFive.openness} />
                <ScoreBar label="Conscientiousness" value={bigFive.conscientiousness} />
                <ScoreBar label="Extraversion" value={bigFive.extraversion} />
                <ScoreBar label="Agreeableness" value={bigFive.agreeableness} />
                <ScoreBar
                  label="Emotional ups & downs"
                  helper="How reactive vs steady your mood sounds here."
                  value={bigFive.neuroticism}
                />
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">MBTI-ish guess</h4>
              <p className="mt-2 text-sm text-white">
                <strong>{mbti.type}</strong> – {mbtiWords.join(" · ")}
              </p>
              <p className="text-xs text-slate-200">{mbti.blurb}</p>
              <p className="muted mt-2 text-[11px]">
                This is an MBTI-style vibe based only on this chat, not a full MBTI test.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">How you connect</h3>
          <p className="muted mb-3 mt-1 text-xs">Attachment / love-language vibe from this chat.</p>
          <p className="text-sm text-white">
            <strong>{loveLanguage.primary}</strong>
            {loveLanguage.secondary ? ` + ${loveLanguage.secondary}` : ""}
          </p>
          <p className="muted mt-2 text-xs">{loveLanguage.blurb}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Where you might shine</h3>
          <p className="muted mb-3 mt-1 text-xs">Archetypes & domains that fit the vibe.</p>
          <p className="text-sm font-semibold text-white">{roles.primaryArchetype}</p>
          <p className="muted mt-1 text-xs">{roles.blurb}</p>
          {roles.suggestedRoles?.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-slate-200">
              {roles.suggestedRoles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          )}
          {roles.alternativeArchetypes?.length > 0 && (
            <p className="muted mt-2 text-[11px]">
              Also resonates with: {roles.alternativeArchetypes.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold text-white">Brain Index</h3>
        <p className="text-lg font-semibold text-white">
          {brainIndex.overall}/100 ({scoreBand(brainIndex.overall)})
        </p>
        <p className="muted mt-2 text-xs">
          AI&apos;s impression of your reasoning in this chat. Not a formal IQ test.
        </p>
        <p className="muted mt-1 text-xs">{brainIndex.explanation}</p>
      </div>

      <p className="muted text-[11px] text-slate-300">
        These are AI-generated impressions from this chat. Not clinical tests or diagnostics.
      </p>
    </section>
  );
};
