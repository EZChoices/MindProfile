import Link from "next/link";

const features = [
  {
    title: "Thinking fingerprint",
    body: "Maps how you frame problems, how quickly you converge, and where you explore.",
  },
  {
    title: "Communication style",
    body: "Detects how you brief AI, the tone you prefer, and whether you ask for checks.",
  },
  {
    title: "Blind spots surfaced",
    body: "Flags missing context, lack of constraints, or over-trusting first drafts.",
  },
];

const steps = [
  "Share a ChatGPT/Claude link, paste text, or drop screenshots.",
  "We anonymize, extract the dialog, and run a profiling prompt.",
  "Get a shareable profile with strengths, blind spots, and better workflows.",
];

export default function Home() {
  return (
    <main className="beam gridlines relative overflow-hidden">
      <div className="absolute left-12 top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(114,246,201,0.4),transparent_60%)] blur-3xl" />
      <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(139,161,255,0.35),transparent_60%)] blur-3xl" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 pb-16 pt-12 sm:px-10 lg:pt-16">
        <header className="flex flex-col items-start gap-10 rounded-3xl border border-white/10 bg-white/5 px-6 py-10 backdrop-blur-md sm:px-10 lg:px-14">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-emerald-200">
            <span className="pill px-4 py-2 text-xs font-semibold text-slate-900">
              Private preview
            </span>
            <span className="muted">MindProfile</span>
          </div>
          <div className="grid w-full gap-10 lg:grid-cols-[1.4fr,1fr] lg:items-center">
            <div className="space-y-6">
              <h1 className="font-[var(--font-display)] text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                See how you think with AI.
              </h1>
              <p className="max-w-2xl text-lg text-slate-200">
                Drop a ChatGPT link, paste a transcript, or upload screenshots. MindProfile
                anonymizes your chats, infers thinking and communication styles, and gives
                you a shareable profile.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 px-6 py-3 text-base font-semibold text-slate-900 shadow-xl shadow-emerald-500/30 transition hover:translate-y-[-1px]"
                >
                  Analyze a conversation
                </Link>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  No login. Text is anonymized before storage.
                </div>
              </div>
              <div className="glass card-border w-full rounded-2xl p-4 text-sm text-slate-200 sm:p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
                  What you get
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 px-4 py-3">
                    Thinking style + communication
                  </div>
                  <div className="rounded-xl bg-white/5 px-4 py-3">3–5 strengths</div>
                  <div className="rounded-xl bg-white/5 px-4 py-3">
                    3–5 blind spots + workflows
                  </div>
                </div>
              </div>
            </div>
            <div className="glass card-border relative flex h-full flex-col gap-4 rounded-3xl p-6 text-sm text-slate-100 lg:justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Ingestion levels
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Level 1 · Share</div>
                  <div className="muted mt-1">ChatGPT/Claude link, text, or screenshots.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">
                    Level 2 · Extension (coming soon)
                  </div>
                  <div className="muted mt-1">
                    Pulls multiple chats to uncover cross-context patterns.
                  </div>
                </div>
                <Link
                  href="/rewind"
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-300/60 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      Level 3 · AI Year in Rewind
                    </div>
                    <span className="pill px-3 py-1 text-[10px] font-semibold text-slate-900">
                      New
                    </span>
                  </div>
                  <div className="muted mt-1">
                    Upload your ChatGPT export for a fun, full‑year recap.
                  </div>
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-full border border-white/15 px-4 py-3 text-xs text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Data stays anonymized; raw text can be auto-purged.
              </div>
            </div>
          </div>
        </header>

        <section className="glass card-border grid gap-10 rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl">What it reads</h2>
            <Link
              href="/analyze"
              className="pill inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-slate-900"
            >
              Start profiling
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.title}
                className="glass card-border rounded-2xl p-5 text-slate-200"
              >
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <p className="muted mt-2 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass card-border grid gap-8 rounded-3xl p-6 sm:p-10 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <div className="pill inline-flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
              How it works
            </div>
            <h3 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl">
              Lightweight pipeline, privacy-first.
            </h3>
            <p className="muted max-w-2xl text-base leading-relaxed">
              No accounts required for Level 1. Text is anonymized locally in the pipeline,
              stored briefly for profiling, and you can delete it after generating your
              snapshot.
            </p>
            <div className="space-y-3 text-slate-100">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 rounded-2xl bg-white/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300/80 text-base font-semibold text-slate-900">
                    {idx + 1}
                  </div>
                  <p className="muted self-center text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass card-border relative overflow-hidden rounded-3xl p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-emerald-300/10" />
            <div className="relative space-y-5">
              <div className="text-sm font-semibold text-white">Pipeline snapshot</div>
              <ul className="space-y-3 text-sm text-slate-100">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Scraper / OCR extracts chat text.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Anonymizer removes emails, phones, URLs, obvious names.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Profiler prompt crafts traits, strengths, blind spots.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Result is returned with a shareable link.
                </li>
              </ul>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-emerald-100">
                “Here is an anonymized conversation between a human and an AI. Analyze the
                human’s thinking style, communication style, strengths, blind spots, and
                suggest better workflows…”
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
