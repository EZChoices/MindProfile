import type { Profile } from "@/types/profile";
import { prisma } from "@/lib/prisma";

const sourceLabel = (ingestionType: string) => {
  if (ingestionType === "url") return "Generated from share URL";
  if (ingestionType === "screenshots") return "Generated from screenshots";
  return "Generated from pasted text";
};

async function fetchProfile(id: string) {
  try {
    const record = await prisma.profileRecord.findUnique({ where: { id } });
    if (!record) return null;
    const profile = JSON.parse(record.profileJson) as Profile;
    return { profile, ingestionType: record.ingestionType };
  } catch (error) {
    console.error("Failed to load profile", error);
    return null;
  }
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const data = await fetchProfile(params.id);

  if (!data) {
    return (
      <main className="beam gridlines flex min-h-screen items-center justify-center px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-200">
          <h1 className="font-[var(--font-display)] text-2xl text-white">Profile not found</h1>
          <p className="muted mt-2 text-sm">This link may be expired or the profile was deleted.</p>
        </div>
      </main>
    );
  }

  const { profile, ingestionType } = data;
  const confidenceLabel = `${profile.confidence.charAt(0).toUpperCase()}${profile.confidence.slice(
    1,
  )}`;

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
            Read-only view generated from a recent conversation sample.
          </p>
        </div>

        <div className="glass card-border space-y-6 rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Your MindProfile snapshot
              </p>
              <p className="muted mt-1 text-sm">Confidence: {confidenceLabel}</p>
            </div>
            <span className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs text-emerald-50">
              {sourceLabel(ingestionType)}
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
      </div>
    </main>
  );
}
