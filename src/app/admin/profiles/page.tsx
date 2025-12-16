import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams =
    typeof (searchParams as Promise<Record<string, string | string[] | undefined>>).then === "function"
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : (searchParams as Record<string, string | string[] | undefined>);

  const providedKey = typeof resolvedParams.key === "string" ? resolvedParams.key : undefined;
  const requiredKey = process.env.ADMIN_KEY;

  if (requiredKey && providedKey !== requiredKey) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Not authorized</h1>
          <p className="muted mt-3 text-sm text-slate-300">Provide ?key=... to view this page.</p>
        </div>
      </main>
    );
  }

  const keyParam = providedKey ? `key=${encodeURIComponent(providedKey)}` : null;
  const withKey = (href: string) => (keyParam ? `${href}${href.includes("?") ? "&" : "?"}${keyParam}` : href);

  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      sourceMode: true,
      confidence: true,
      inputCharCount: true,
      inputSourceHost: true,
      model: true,
      promptVersion: true,
      resonance: true,
      feedbackText: true,
    },
  });

  const rewinds = await prisma.yearSummary.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      clientId: true,
      year: true,
      summaryJson: true,
    },
  });

  const logs = await prisma.analysisLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      clientId: true,
      sourceMode: true,
      inputCharCount: true,
      errorCode: true,
      message: true,
      meta: true,
    },
  });

  const resonanceClass = (value: string | null | undefined) => {
    if (value === "positive") return "text-emerald-200";
    if (value === "mixed") return "text-amber-200";
    if (value === "negative") return "text-red-200";
    return "text-slate-300";
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Admin</p>
            <h1 className="font-[var(--font-display)] text-3xl">Recent profiles</h1>
          </div>
          <Link
            href="/analyze"
            className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
          >
            Create new
          </Link>
        </div>

        <div className="glass card-border space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Exports</p>
            <p className="muted mt-1 text-sm text-slate-300">Download the raw report JSON blobs for review.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={withKey("/api/admin/export/profiles?download=1&format=jsonl")}
              className="rounded-full border border-emerald-300/50 bg-emerald-300/15 px-4 py-2 text-xs font-semibold text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-300/20"
            >
              Download profiles (JSONL)
            </a>
            <a
              href={withKey("/api/admin/export/profiles?download=1&format=jsonl&includeRawText=1")}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-white/25 hover:bg-white/10"
            >
              Profiles + rawText
            </a>
            <a
              href={withKey("/api/admin/export/rewinds?download=1&format=jsonl")}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-white/25 hover:bg-white/10"
            >
              Download rewinds (JSONL)
            </a>
            <a href={withKey("/api/admin/export/profiles?format=json")} className="text-xs text-emerald-200 underline">
              Open profiles JSON
            </a>
            <a href={withKey("/api/admin/export/rewinds?format=json")} className="text-xs text-emerald-200 underline">
              Open rewinds JSON
            </a>
          </div>
          <p className="text-xs text-slate-400">
            Tip: JSONL is easiest to diff/grep. Use “Profiles + rawText” only when you need to audit masking/storage.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm text-slate-100">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.1em] text-emerald-200">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Length</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3">Resonance</th>
                <th className="px-4 py-3">Feedback?</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Raw</th>
                <th className="px-4 py-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const sourceLink =
                  profile.sourceMode === "url" && profile.inputSourceHost
                    ? profile.inputSourceHost.startsWith("http")
                      ? profile.inputSourceHost
                      : `https://${profile.inputSourceHost}`
                    : null;
                const sourceLabel = (() => {
                  if (!sourceLink) return profile.sourceMode;
                  try {
                    const url = new URL(sourceLink);
                    const shareId = url.pathname.split("/").filter(Boolean).pop();
                    const tail = shareId ? `/…${shareId.slice(-6)}` : url.pathname;
                    return `${url.hostname}${tail}`;
                  } catch {
                    return profile.inputSourceHost ?? profile.sourceMode;
                  }
                })();

                return (
                  <tr key={profile.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-slate-200">{formatDate(profile.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {sourceLink ? (
                        <a href={sourceLink} className="text-emerald-200 underline break-words" target="_blank" rel="noreferrer">
                          {sourceLabel}
                        </a>
                      ) : (
                        profile.sourceMode
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-200">{profile.confidence}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {typeof profile.inputCharCount === "number" ? `~${profile.inputCharCount}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{profile.model}</td>
                    <td className="px-4 py-3 text-slate-200">{profile.promptVersion}</td>
                    <td className={`px-4 py-3 capitalize ${resonanceClass(profile.resonance)}`}>
                      {profile.resonance ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {profile.resonance || profile.feedbackText ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/p/${profile.id}`} className="text-emerald-200 underline">
                        View
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/profile/${profile.id}`}
                        className="text-emerald-200 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Raw
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/profile/${profile.id}?download=1`}
                        className="text-emerald-200 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={11}>
                    No profiles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Recent rewinds</p>
              <p className="muted text-sm text-slate-300">Latest Year in Rewind summaries (stored JSON only).</p>
            </div>
            <a
              href={withKey("/api/admin/export/rewinds?download=1&format=jsonl")}
              className="text-xs font-semibold text-emerald-200 underline"
            >
              Download all
            </a>
          </div>
          <table className="min-w-full text-left text-sm text-slate-100">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.1em] text-emerald-200">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Convos</th>
                <th className="px-4 py-3">Prompts</th>
                <th className="px-4 py-3">Active days</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {rewinds.map((rewind) => {
                const summary = (rewind.summaryJson ?? {}) as Record<string, unknown>;
                const totalConversations =
                  typeof summary.totalConversations === "number" ? summary.totalConversations : null;
                const totalUserMessages =
                  typeof summary.totalUserMessages === "number" ? summary.totalUserMessages : null;
                const activeDays = typeof summary.activeDays === "number" ? summary.activeDays : null;

                return (
                  <tr key={rewind.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-slate-200">{formatDate(rewind.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-200">{rewind.year ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-200">{totalConversations ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-200">{totalUserMessages ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-200">{activeDays ?? "-"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={withKey(`/api/admin/export/rewinds?id=${encodeURIComponent(rewind.id)}&format=json`)}
                        className="text-emerald-200 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={withKey(`/api/admin/export/rewinds?id=${encodeURIComponent(rewind.id)}&download=1&format=json`)}
                        className="text-emerald-200 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })}
              {rewinds.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={7}>
                    No rewinds yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="glass card-border space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Recent errors</p>
              <p className="muted text-sm">Latest failed analyses with reasons.</p>
            </div>
            <Link
              href={withKey("/api/admin/analysis-logs")}
              className="text-emerald-200 underline"
            >
              Open JSON
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="min-w-full text-left text-xs text-slate-100">
              <thead className="bg-white/5 uppercase tracking-[0.08em] text-emerald-200">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Chars</th>
                  <th className="px-3 py-2">Error</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Details</th>
                  <th className="px-3 py-2">Client</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = (log.meta ?? {}) as { shareHosts?: unknown };
                  const shareHosts =
                    Array.isArray(meta.shareHosts) && meta.shareHosts.length
                      ? meta.shareHosts.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
                      : [];
                  const metaStr = JSON.stringify(log.meta ?? {});
                  const truncatedMeta = metaStr.length > 120 ? `${metaStr.slice(0, 120)}.` : metaStr;

                  return (
                    <tr key={log.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-slate-200">{formatDate(log.createdAt)}</td>
                      <td className="px-3 py-2 text-slate-200">{log.sourceMode ?? "-"}</td>
                      <td className="px-3 py-2 text-slate-200">
                        {typeof log.inputCharCount === "number" ? `~${log.inputCharCount}` : "-"}
                      </td>
                      <td className="px-3 py-2 text-amber-200">{log.errorCode ?? "-"}</td>
                      <td className="px-3 py-2 text-slate-200 truncate max-w-[180px]" title={log.message ?? ""}>
                        {log.message ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-400 truncate max-w-[240px]" title={metaStr}>
                        {shareHosts.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {shareHosts.map((h, i) => (
                              <span key={`${log.id}-host-${i}`} className="flex items-center gap-1">
                                {i > 0 && <span>,</span>}
                                <span className="text-slate-200">{h}</span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          truncatedMeta || "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{log.clientId ?? "-"}</td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-400" colSpan={7}>
                      No errors logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
