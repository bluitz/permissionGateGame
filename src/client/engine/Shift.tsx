import type { ReactNode } from "react";
import { AuditLog } from "./AuditLog";
import { Hud } from "./Hud";
import { IncidentView } from "./Incident";
import type { Shift } from "./useShift";
import type { ShiftInfo } from "./types";

/** Frame around every board: HUD, the board itself, the transcript, and the overlays. */
export function ShiftFrame({
  info, shift, onQuit, onWon, children, winText,
}: { info: ShiftInfo; shift: Shift; onQuit: () => void; onWon: () => void; children: ReactNode; winText: string }) {
  return (
    <div className="shift">
      <Hud info={info} lives={shift.lives} score={shift.score} onQuit={onQuit} />
      <div className="shift-body">
        <main className="board">{children}</main>
        <AuditLog entries={shift.audit} />
      </div>
      {shift.incident && <IncidentView incident={shift.incident} onDismiss={shift.dismissIncident} />}
      {shift.status === "failed" && (
        <div className="overlay">
          <div className="card">
            <h2>📟 PAGER FIRED</h2>
            <p>Three incidents in one shift. The on-call engineer would like a word.</p>
            <button className="btn" onClick={shift.restart}>Restart shift</button>
            <button className="btn btn-ghost" onClick={onQuit}>Back to shifts</button>
          </div>
        </div>
      )}
      {shift.status === "won" && (
        <div className="overlay">
          <div className="card">
            <h2>✅ SHIFT COMPLETE</h2>
            <p>{winText}</p>
            <p className="muted">Final score {shift.score}. Incidents survived: {3 - shift.lives}.</p>
            <button className="btn" onClick={onWon}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
