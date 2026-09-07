import { useState } from "react";
import type { AuditEntry, Incident } from "./types";

export const MAX_LIVES = 3;

/**
 * Everything every shift shares: lives, score, the transcript, the current
 * incident, and whether the shift is still going. Boards call these functions;
 * the Shift wrapper renders the results.
 */
export function useShift() {
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState<"playing" | "failed" | "won">("playing");

  function log(entry: AuditEntry) {
    setAudit((a) => [...a, entry]);
  }

  /** A wrong move: costs a life and plays the cutscene. The board keeps going after dismiss. */
  function raise(inc: Incident, entry: AuditEntry) {
    log({ ...entry, bad: true });
    setIncident(inc);
    setLives((l) => l - 1);
  }

  function dismissIncident() {
    setIncident(null);
    if (lives <= 0) setStatus("failed");
  }

  function addScore(n: number) {
    setScore((s) => s + n);
  }

  function win() {
    setStatus("won");
  }

  function restart() {
    setLives(MAX_LIVES);
    setScore(0);
    setAudit([]);
    setIncident(null);
    setStatus("playing");
  }

  return { lives, score, audit, incident, status, log, raise, dismissIncident, addScore, win, restart };
}

export type Shift = ReturnType<typeof useShift>;
