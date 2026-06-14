import { searchWins } from "@/server/wins";
import { parseWinsQuery } from "@/lib/wins";

// JSON search endpoint for the win-wall type-ahead. Reuses the same parser and
// query as the SSR page, so there's one source of truth. Called by WinsClient
// (debounced + abortable) so typing never re-renders the whole route.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = parseWinsQuery(Object.fromEntries(searchParams.entries()));
  const result = await searchWins(query);
  return Response.json(result);
}
