// Slug = a readable, URL-safe stem from the title plus a short random suffix.
// The suffix makes collisions effectively impossible without a DB round-trip,
// so creation stays a single synchronous write.
const STEM_MAX = 60;

export function slugify(title: string): string {
  const stem = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, STEM_MAX)
    .replace(/-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 7); // 5 base36 chars
  return `${stem || "project"}-${suffix}`;
}
