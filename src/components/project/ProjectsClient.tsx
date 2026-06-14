"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ProjectCard } from "@/components/project/ProjectCard";
import { DirectoryControls } from "@/components/project/DirectoryControls";
import { GroupedProjects } from "@/components/project/GroupedProjects";
import { Pagination } from "@/components/project/Pagination";
import { ViewToggle, type View } from "@/components/project/ViewToggle";
import {
  toQueryString,
  type DirectoryGroup,
  type DirectoryQuery,
  type DirectoryResult,
} from "@/lib/directory";

// A query with no search and no filters = the browse (grouped) view; anything
// else = flat ranked results.
function isBrowse(q: DirectoryQuery): boolean {
  return !q.q && !q.pool && !q.stage;
}

// Owns directory state and drives both modes. Browse shows the SSR `groups`
// (capped previews); typing or filtering switches to the route-handler results
// (debounced, abortable, cached). Clearing returns to the groups with no fetch.
export function ProjectsClient({
  groups,
  initial,
  initialQuery,
}: {
  groups: DirectoryGroup[];
  initial: DirectoryResult | null;
  initialQuery: DirectoryQuery;
}) {
  const t = useTranslations("directory");

  const [query, setQuery] = useState<DirectoryQuery>(initialQuery);
  const [result, setResult] = useState<DirectoryResult | null>(initial);
  const [text, setText] = useState(initialQuery.q ?? "");
  const [view, setView] = useState<View>("grid");
  const [pending, setPending] = useState(false);

  const cache = useRef<Map<string, DirectoryResult>>(
    new Map(initial ? [[toQueryString(initialQuery), initial]] : []),
  );
  const aborter = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function run(next: DirectoryQuery) {
    setQuery(next);
    const qs = toQueryString(next);
    window.history.replaceState(null, "", `${window.location.pathname}${qs}`);

    // Browse mode: no fetch, the grouped previews are already in memory.
    if (isBrowse(next)) {
      setResult(null);
      return;
    }

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
      const res = await fetch(`/api/projects/search${qs}`, { signal: controller.signal });
      const data: DirectoryResult = await res.json();
      cache.current.set(qs, data);
      setResult(data);
      setPending(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setPending(false);
    }
  }

  // Any control change resets to page 1; an explicit page (the pager) overrides it.
  function commit(partial: Partial<DirectoryQuery>) {
    run({ ...query, page: 1, ...partial });
  }

  function onText(value: string) {
    setText(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => commit({ q: value.trim() || undefined }), 250);
  }

  const browse = isBrowse(query);
  const listLayout = view === "grid" ? "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-4 space-y-3";

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <DirectoryControls
            text={text}
            pool={query.pool}
            stage={query.stage}
            onText={onText}
            onPool={(pool) => commit({ pool })}
            onStage={(stage) => commit({ stage })}
          />
        </div>
        <ViewToggle view={view} onView={setView} />
      </div>

      {browse ? (
        <GroupedProjects groups={groups} view={view} onSeeAll={(stage) => commit({ stage })} />
      ) : result ? (
        <>
          <p className="mt-6 text-sm text-neutral-500">{t("results", { n: result.total })}</p>
          {result.items.length === 0 ? (
            <p className="mt-8 text-sm text-neutral-500">{t("noResults")}</p>
          ) : (
            <ul className={`${listLayout} transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
              {result.items.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} variant={view} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={result.page} totalPages={result.totalPages} onPage={(page) => commit({ page })} />
        </>
      ) : null}
    </>
  );
}
