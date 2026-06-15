"use client";

// Native confirm() guard before the delete server action fires. Client-only so the
// admin page itself can stay a server component.
export function DeleteButton({ title }: { title: string }) {
  return (
    <button
      type="submit"
      style={{ color: "#c00" }}
      onClick={(e) => {
        if (!confirm(`Delete "${title}"? This cascades to crew, tasks, log, and votes. Cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      delete
    </button>
  );
}
