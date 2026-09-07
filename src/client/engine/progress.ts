import type { ShiftId } from "./types";

const KEY = "gatekeeper-progress";

/** Which shifts the player has finished. Lives only in this browser. */
export function loadCompleted(): ShiftId[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShiftId[]) : [];
  } catch {
    return [];
  }
}

export function markCompleted(id: ShiftId) {
  const done = loadCompleted();
  if (!done.includes(id)) done.push(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(done));
  } catch {
    // private window or storage blocked; progress just won't persist
  }
}
