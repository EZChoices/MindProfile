export default function LoadingResult() {
  return (
    <main className="beam gridlines min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-pulse">
        <div className="h-4 w-40 rounded-full bg-white/20" />
        <div className="h-10 w-3/4 rounded-full bg-white/15" />
        <div className="h-5 w-1/2 rounded-full bg-white/10" />
        <div className="glass card-border h-64 rounded-3xl bg-white/5" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass card-border h-48 rounded-3xl bg-white/5" />
          <div className="glass card-border h-48 rounded-3xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}
