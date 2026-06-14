import { searchProjects } from "@/server/directory";
import { parseDirectoryQuery } from "@/lib/directory";

// JSON search endpoint for the directory type-ahead. Reuses the same parser and
// query as the SSR page, so there is one source of truth for search. Called by
// the client controls (debounced + abortable) so typing never re-renders the
// whole route — only this lightweight, indexed query runs.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = parseDirectoryQuery(Object.fromEntries(searchParams.entries()));
  const result = await searchProjects(query);
  return Response.json(result);
}
