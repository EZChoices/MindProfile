export default function ProfileLoading() {
  return (
    <main className="beam gridlines flex min-h-screen items-center justify-center px-6 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="mx-auto h-4 w-40 rounded-full bg-white/20" />
          <div className="mx-auto h-6 w-64 rounded-full bg-white/20" />
          <div className="mx-auto h-3 w-52 rounded-full bg-white/20" />
        </div>
      </div>
    </main>
  );
}
