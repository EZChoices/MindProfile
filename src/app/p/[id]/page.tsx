import { prisma } from "@/lib/prisma";
import type { Profile } from "@/types/profile";
import { ProfileFeedback } from "@/components/ProfileFeedback";
import type { MindCard } from "@/types/mindCard";
import { MindCardView } from "@/components/MindCardView";
import { ShareLinkBlock } from "@/components/ShareLinkBlock";

export const dynamic = "force-dynamic";

type RecordSelection = {
  id: string;
  sourceMode: string;
  confidence: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengthsJson: unknown;
  blindSpotsJson: unknown;
  suggestedJson: unknown;
  createdAt: Date;
  inputCharCount: number;
  resonance: string | null;
  feedbackText: string | null;
  mindCard: unknown;
};

const parseArray = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toProfile = (record: RecordSelection) => {
  const confidence =
    record.confidence === "low" || record.confidence === "high" ? record.confidence : "medium";

  const profile: Profile = {
    id: record.id,
    confidence,
    thinkingStyle: record.thinkingStyle,
    communicationStyle: record.communicationStyle,
    strengths: parseArray(record.strengthsJson),
    blindSpots: parseArray(record.blindSpotsJson),
    suggestedWorkflows: parseArray(record.suggestedJson),
    sourceMode: record.sourceMode as Profile["sourceMode"],
    inputCharCount: record.inputCharCount,
    createdAt: record.createdAt.toISOString(),
  };

  return profile;
};

const parseMindCard = (value: unknown): MindCard | null => {
  if (!value) return null;
  if (typeof value === "object") return value as MindCard;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as MindCard;
    } catch {
      return null;
    }
  }
  return null;
};

const NotFound = () => (
  <main className="beam gridlines flex min-h-screen items-center justify-center px-6 py-10">
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-200">
      <h1 className="font-[var(--font-display)] text-2xl text-white">Profile not found</h1>
      <p className="muted mt-2 text-sm">This link may be expired or the profile was deleted.</p>
      <div className="mt-4">
        <a
          href="/analyze"
          className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
        >
          Create your own MindProfile
        </a>
      </div>
    </div>
  </main>
);

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

export default async function ProfilePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams =
    typeof (params as Promise<{ id: string }>).then === "function"
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });

  const id = resolvedParams?.id;
  if (!id) {
    console.error("Profile id missing in route params", {
      params,
      resolvedParams,
      database: process.env.DATABASE_URL,
    });
    return <NotFound />;
  }

  let record: RecordSelection | null = null;
  try {
    record = (await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        confidence: true,
        thinkingStyle: true,
        communicationStyle: true,
        strengthsJson: true,
        blindSpotsJson: true,
        suggestedJson: true,
        sourceMode: true,
        createdAt: true,
        inputCharCount: true,
        resonance: true,
        feedbackText: true,
        mindCard: true,
      },
    })) as RecordSelection | null;
  } catch (error) {
    console.error("Profile lookup failed", { id, error, database: process.env.DATABASE_URL });
    return <NotFound />;
  }

  if (!record) {
    console.error("Profile not found", { id, database: process.env.DATABASE_URL });
    return <NotFound />;
  }

  const profile = toProfile(record);
  const mindCard = parseMindCard(record.mindCard);

  const sourceLabel =
    record.sourceMode === "url"
      ? "Generated from share URL"
      : record.sourceMode === "screenshots"
        ? "Generated from screenshots"
        : "Generated from pasted text";

  const createdDisplay = new Date(record.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const lengthLabel =
    typeof profile.inputCharCount === "number" && profile.inputCharCount > 0
      ? `~${profile.inputCharCount} characters`
      : null;

  const sourceFriendly =
    record.sourceMode === "url"
      ? "Share URL"
      : record.sourceMode === "screenshots"
        ? "Screenshots"
        : "Pasted text";

  return (
    <main className="beam gridlines min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="pill inline-flex w-fit items-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
            Shared profile
          </p>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            Your MindProfile snapshot
          </h1>
                    <p className="muted text-base leading-relaxed text-slate-100">
            Read-only view generated from a single conversation sample. Not a psychological assessment.
          </p>
          <p className="muted text-xs text-slate-200">
            Source: {sourceFriendly} • Generated: {createdDisplay}
            {lengthLabel ? ` • Length: ${lengthLabel}` : ""}
          </p>
          <p className="text-xs text-slate-200">
            Read strength: {readStrengthLabel(profile.confidence)}
            <span
              className="ml-1 text-[10px] text-slate-400 cursor-help"
              title="How sure the model is about these patterns based on the amount and richness of text in this chat."
            >
              ?
            </span>
            <span className="block text-[11px] text-slate-400">{readStrengthNote(profile.confidence)}</span>
          </p>
        </div>

        {mindCard && <MindCardView mindCard={mindCard} />}
        <ShareLinkBlock sharePath={`/p/${profile.id}`} />

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
              {sourceLabel}
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
        <ProfileFeedback
          profileId={profile.id}
          initialResonance={(record.resonance as Profile["resonance"]) ?? null}
          initialFeedbackText={record.feedbackText ?? undefined}
          compact
        />
        <div className="flex items-center justify-center">
          <a
            href="/analyze"
            className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-6 py-3 text-sm font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
          >
            Create your own MindProfile
          </a>
        </div>
      </div>
    </main>
  );
}





