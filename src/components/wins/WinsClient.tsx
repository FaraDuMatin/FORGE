"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/project/Pagination";
import { WinsControls } from "@/components/wins/WinsControls";
import { WinCard } from "@/components/wins/WinCard";
import { toWinsQueryString, type WinsQuery, type WinsResult } from "@/lib/wins";

// Owns win-wall state. Default view (no search, newest first, page 1) shows the
// 3 most recent as featured cards then the rest; any search/sort/page switches to
// a flat list. Typing is debounced, abortable and cached, and the URL is kept in
// sync shallowly, so paging/searching never re-renders the whole route.
export function WinsClient({
  initial,
  initialQuery,
}: {
  initial: WinsResult;
  initialQuery: WinsQuery;
}) {
  const t = useTranslations("wins");

  const [query, setQuery] = useState<WinsQuery>(initialQuery);
  const [result, setResult] = useState<WinsResult>(initial);
  const [text, setText] = useState(initialQuery.q ?? "");
  const [pending, setPending] = useState(false);

  const cache = useRef<Map<string, WinsResult>>(new Map([[toWinsQueryString(initialQuery), initial]]));
  const aborter = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function run(next: WinsQuery) {
    setQuery(next);
    const qs = toWinsQueryString(next);
    window.history.replaceState(null, "", `${window.location.pathname}${qs}`);

    const cached = cache.current.get(qs);
    if (cached) {
      setResult(cached);
      return;
    }

    aborter.current?.abort();
    const controller = new AbortController();
    aborter.current = controller;
    setPending(true);
    try {
      const res = await fetch(`/api/wins/search${qs}`, { signal: controller.signal });
      const data: WinsResult = await res.json();
      cache.current.set(qs, data);
      setResult(data);
      setPending(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setPending(false);
    }
  }

  function onText(value: string) {
    setText(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => run({ ...query, q: value.trim() || undefined, page: 1 }), 250);
  }

  const isDefault = !query.q && query.sort === "recent" && result.page === 1;
  const featured = isDefault ? result.items.slice(0, 3) : [];
  const rest = isDefault ? result.items.slice(3) : result.items;

  return (
    <div className="mt-8">
      <WinsControls
        text={text}
        sort={query.sort}
        onText={onText}
        onSort={(sort) => run({ ...query, sort, page: 1 })}
      />

      <div className={`transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
        {result.items.length === 0 ? (
          <p className="mt-10 text-sm text-neutral-500">{query.q ? t("noResults") : t("empty")}</p>
        ) : (
          <>
            {!query.q ? null : <p className="mt-6 text-sm text-neutral-500">{t("results", { n: result.total })}</p>}

            {featured.length > 0 ? (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{t("recentHeading")}</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((w) => (
                    <WinCard key={w.id} win={w} variant="featured" />
                  ))}
                </div>
              </section>
            ) : null}

            {rest.length > 0 ? (
              <section className="mt-10">
                {isDefault ? (
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{t("allHeading")}</h2>
                ) : null}
                <ul className={`${isDefault ? "mt-3" : "mt-6"} space-y-5`}>
                  {rest.map((w) => (
                    <li key={w.id}>
                      <WinCard win={w} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} onPage={(page) => run({ ...query, page })} />
    </div>
  );
}
