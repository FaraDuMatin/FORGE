import { marked } from "marked";

// Escape HTML tags in raw input before running through the markdown parser so
// stored text like "<script>" becomes "&lt;script&gt;" rather than live HTML.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Converts markdown text to sanitized HTML. Safe to use with
// dangerouslySetInnerHTML — HTML is escaped before parsing so stored tags
// can't inject. Works in Node (server components) and the browser alike.
export function renderMarkdown(text: string): string {
  return marked.parse(escapeHtml(text), { gfm: true, breaks: true }) as string;
}
