// Turn a maintainer-pasted YouTube link into a privacy-friendly embed URL.
// Pure / client-safe. Accepts the common YouTube shapes:
//   youtube.com/watch?v=ID , youtu.be/ID , youtube.com/embed/ID ,
//   youtube.com/shorts/ID , with or without extra query params.
// Returns a youtube-nocookie embed URL (no tracking — matches FORGE's ethos),
// or null if the input isn't a recognizable YouTube link.

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const input = raw.trim();
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      // /embed/ID or /shorts/ID
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") id = parts[1] ?? null;
    }
  }

  if (!id || !YT_ID.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
