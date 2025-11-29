"use client";

import type { MindCard } from "@/types/mindCard";

interface MindCardViewProps {
  mindCard: MindCard;
  impressionLabel?: string;
}

interface ScoreBarProps {
  label: string;
  value: number;
}

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const ScoreBar = ({ label, value }: ScoreBarProps) => {
  const clamped = clampScore(value);
  return (
    <li className="mb-3">
      <div className="flex items-center justify-between text-xs text-slate-200">
        <span>{label}</span>
        <span className="text-slate-100">{clamped}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-sky-300" style={{ width: `${clamped}%` }} />
      </div>
    </li>
  );
};

export const MindCardView = ({ mindCard, impressionLabel }: MindCardViewProps) => {
  const { archetypeName, archetypeTagline, brainScores, bigFive, mbti, loveLanguage, roles, brainIndex } = mindCard;

  return (
    <section className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">MindCard</p>
          <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl">{archetypeName}</h2>
          <p className="muted mt-1 text-sm text-slate-100">{archetypeTagline}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-emerald-100">
          {impressionLabel || "AI impression from this chat"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Your brain scores</h3>
          <p className="muted mb-3 mt-1 text-xs">How your thinking comes across in this conversation.</p>
          <ul>
            <ScoreBar label="Reasoning depth" value={brainScores.reasoning} />
            <ScoreBar label="Curiosity" value={brainScores.curiosity} />
            <ScoreBar label="Structure & planning" value={brainScores.structure} />
            <ScoreBar label="Emotional attunement" value={brainScores.emotionalAttunement} />
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
                <ScoreBar label="Emotional volatility" value={bigFive.neuroticism} />
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">MBTI-ish guess</h4>
              <p className="mt-2 text-sm text-white">
                <strong>{mbti.type}</strong>{" "}
                <span className="text-slate-200">({mbti.confidence} confidence)</span>
              </p>
              <p className="muted mt-2 text-xs">{mbti.blurb}</p>
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
        <p className="text-lg font-semibold text-white">{brainIndex.overall}/100</p>
        <p className="muted mt-2 text-xs">{brainIndex.explanation}</p>
      </div>

      <p className="muted text-[11px] text-slate-300">
        AI-generated impressions from this chat. Not clinical tests or diagnostics.
      </p>
    </section>
  );
};
