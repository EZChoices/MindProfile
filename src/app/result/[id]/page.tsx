import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareActions } from "@/components/ShareActions";
import type { Profile } from "@/lib/types";

async function fetchProfile(id: string): Promise<Profile | null> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const res = await fetch(`${base}/api/profile/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const profile = await fetchProfile(params.id);
  if (!profile) notFound();

  const { summary } = profile;
  const created = new Date(profile.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="beam gridlines min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Link href="/analyze" className="text-xs text-emerald-100 underline underline-offset-4">
            ← Analyze another conversation
          </Link>
          <h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">
            Mind profile generated
          </h1>
          <p className="muted max-w-2xl">
            Snapshot generated from your shared conversation. This instance stores data
            in-memory; reload or generate again to refresh.
          </p>
          <ShareActions profileId={profile.id} />
        </div>

        <div className="glass card-border grid gap-6 rounded-3xl p-6 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[2fr,1fr] sm:items-center">
            <div>
              <div className="pill inline-flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
                {profile.ingestionType} profile
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{summary.headline}</h2>
              <p className="muted mt-2 text-sm leading-relaxed">{profile.textPreview}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
              <div className="space-y-1 rounded-xl bg-white/5 px-3 py-2">
                <div className="muted text-xs uppercase tracking-[0.2em]">Confidence</div>
                <div className="text-xl font-semibold text-emerald-200">
                  {(summary.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="space-y-1 rounded-xl bg-white/5 px-3 py-2">
                <div className="muted text-xs uppercase tracking-[0.2em]">Created</div>
                <div className="text-sm font-semibold">{created}</div>
              </div>
              <div className="space-y-1 rounded-xl bg-white/5 px-3 py-2">
                <div className="muted text-xs uppercase tracking-[0.2em]">Source</div>
                <div className="text-sm font-semibold">{profile.source ?? "Shared text"}</div>
              </div>
              <div className="space-y-1 rounded-xl bg-white/5 px-3 py-2">
                <div className="muted text-xs uppercase tracking-[0.2em]">Mode</div>
                <div className="text-sm font-semibold capitalize">{profile.ingestionType}</div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass card-border rounded-3xl p-6 sm:p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Thinking style
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{summary.thinkingStyle}</p>
            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-emerald-200">
              Communication
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.communicationStyle}
            </p>
          </div>

          <div className="glass card-border rounded-3xl p-6 sm:p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Usage patterns
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {summary.usagePatterns.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="glass card-border rounded-3xl p-6 sm:p-7">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Strengths</div>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {summary.strengths.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass card-border rounded-3xl p-6 sm:p-7">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Blind spots</div>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {summary.blindSpots.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass card-border rounded-3xl p-6 sm:p-7">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Suggested workflows
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {summary.recommendations.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-300" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="glass card-border rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Anonymized sample text
            </div>
            <span className="text-xs text-emerald-100">
              Raw text stored temporarily for this profile only.
            </span>
          </div>
          <p className="muted mt-4 whitespace-pre-wrap text-sm leading-relaxed">
            {profile.rawText}
          </p>
        </section>
      </div>
    </main>
  );
}
