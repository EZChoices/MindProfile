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
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-slate-200">{formatDate(profile.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {profile.sourceMode === "url" && profile.inputSourceHost ? (
                      /* ensure older rows that stored only a host still link out */
                      ((url) => (
                        <a href={url} className="text-emerald-200 underline break-words" target="_blank" rel="noreferrer">
                          {profile.inputSourceHost}
                        </a>
                      ))(
                        profile.inputSourceHost.startsWith("http")
                          ? profile.inputSourceHost
                          : `https://${profile.inputSourceHost}`,
                      )
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
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={10}>
                    No profiles yet.
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
              href={requiredKey ? `/api/admin/analysis-logs?key=${requiredKey}` : "/api/admin/analysis-logs"}
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
                  const meta = (log.meta ?? {}) as { shareUrls?: unknown };
                  const shareUrls =
                    Array.isArray(meta.shareUrls) && meta.shareUrls.length
                      ? meta.shareUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
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
                        {shareUrls.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {shareUrls.map((u, i) => (
                              <span key={`${log.id}-url-${i}`} className="flex items-center gap-1">
                                {i > 0 && <span>,</span>}
                                <a href={u} className="text-emerald-200 underline" target="_blank" rel="noreferrer">
                                  link {i + 1}
                                </a>
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
                      <a
                        href={profile.inputSourceHost}
                        className="text-emerald-200 underline break-words"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {profile.inputSourceHost}
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
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={10}>
                    No profiles yet.
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
              href={requiredKey ? `/api/admin/analysis-logs?key=${requiredKey}` : "/api/admin/analysis-logs"}
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
                  const meta = (log.meta ?? {}) as { shareUrls?: unknown };
                  const shareUrls =
                    Array.isArray(meta.shareUrls) && meta.shareUrls.length
                      ? meta.shareUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
                      : [];
                  const metaStr = JSON.stringify(log.meta ?? {});
                  const truncatedMeta = metaStr.length > 120 ? `${metaStr.slice(0, 120)}…` : metaStr;

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
                        {shareUrls.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {shareUrls.map((u, i) => (
                              <span key={`${log.id}-url-${i}`} className="flex items-center gap-1">
                                {i > 0 && <span>,</span>}
                                <a href={u} className="text-emerald-200 underline" target="_blank" rel="noreferrer">
                                  link {i + 1}
                                </a>
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
