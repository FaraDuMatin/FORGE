import { randomUUID } from "crypto";

// A fresh maintainer token. Used when access transfers (succession handoff or
// adoption) so the previous maintainer's link stops working — a clean handover.
export function newMaintainerToken(): string {
  return randomUUID();
}
