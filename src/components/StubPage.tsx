import { Header } from "@/components/Header";

// Shared shell for pages whose interactive guts arrive later in the build.
// Keeps deployed nav links real (no 404s) while the skeleton is up.
export function StubPage({ title, sub, soon }: { title: string; sub: string; soon: string }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{sub}</p>
        <p className="mt-8 inline-block rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-400 dark:border-neutral-700">
          {soon}
        </p>
      </main>
    </>
  );
}
