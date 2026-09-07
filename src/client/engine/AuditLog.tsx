import { useEffect, useRef } from "react";
import type { AuditEntry } from "./types";

/** The transcript. Every decision is an event with who / what / why. */
export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [entries.length]);
  return (
    <aside className="audit">
      <div className="audit-title">transcript.jsonl</div>
      {entries.length === 0 && <div className="audit-empty">(no decisions yet: every one you make lands here)</div>}
      {entries.map((e, i) => (
        <div key={i} className={"audit-line" + (e.bad ? " audit-bad" : "")}>
          <span className="audit-who">{e.who}</span> {e.what} <span className="audit-why">// {e.why}</span>
        </div>
      ))}
      <div ref={end} />
    </aside>
  );
}
