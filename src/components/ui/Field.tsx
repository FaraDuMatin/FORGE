import type { ComponentProps, ReactNode } from "react";

// Black-and-white form primitives. Deliberately plain — visual design comes later;
// these just give consistent spacing and focus states so forms are usable now.
const base =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={base} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${base} min-h-24`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={base} />;
}
