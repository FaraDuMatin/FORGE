// Shared shape for form-backed server actions (used with React's useActionState).
// Not a "use server" module — just types and helpers imported by the actions.
export type ActionState = { error?: string; ok?: boolean };
export const initialState: ActionState = {};

export function field(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export function email(fd: FormData, name: string): string {
  return field(fd, name).toLowerCase();
}
