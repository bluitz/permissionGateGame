import { useEffect, useState } from "react";
import type { Incident } from "./types";

const PANEL_MS = 900; // each comic panel pops in this long after the previous one

/** The cutscene: three panels pop in one by one, then the report slides up. */
export function IncidentView({ incident, onDismiss }: { incident: Incident; onDismiss: () => void }) {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    setShown(1);
    const t1 = setTimeout(() => setShown(2), PANEL_MS);
    const t2 = setTimeout(() => setShown(3), PANEL_MS * 2);
    const t3 = setTimeout(() => setShown(4), PANEL_MS * 3);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [incident]);

  const r = incident.report;
  return (
    <div className="overlay">
      <div className="incident">
        <h2 className="incident-title">🚨 INCIDENT: {incident.title}</h2>
        <div className="panels">
          {incident.panels.map((p, i) => (
            <div key={i} className={"panel" + (shown > i ? " panel-in" : "")}>
              <div className="panel-emoji">{p.emoji}</div>
              <div className="panel-caption">{p.caption}</div>
            </div>
          ))}
        </div>
        {shown >= 4 && (
          <div className="report">
            <h3>📋 Incident Report</h3>
            <p><b>What you did:</b> {r.youDid}</p>
            <p><b>What happened:</b> {r.whatHappened}</p>
            <p><b>The concept:</b> {r.concept}</p>
            <p><b>The fix:</b> {r.fix}</p>
            <button className="btn" onClick={onDismiss}>Back to work</button>
          </div>
        )}
      </div>
    </div>
  );
}
