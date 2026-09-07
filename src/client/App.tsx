import { useState } from "react";
import { loadCompleted, markCompleted } from "./engine/progress";
import { SHIFTS, type ShiftId, type ShiftInfo } from "./engine/types";
import { CAST } from "./cast";
import { GateBoard } from "./levels/gate/Board";

export function App() {
  const [current, setCurrent] = useState<ShiftId | null>(null);
  const [completed, setCompleted] = useState<ShiftId[]>(loadCompleted);

  const info = SHIFTS.find((s) => s.id === current);
  if (!info) return <Menu completed={completed} onPick={setCurrent} />;

  function won() {
    markCompleted(info!.id);
    setCompleted(loadCompleted());
    const next = SHIFTS[SHIFTS.indexOf(info!) + 1];
    setCurrent(next ? next.id : null);
  }
  const quit = () => setCurrent(null);

  return <Board info={info} onQuit={quit} onWon={won} />;
}

function Board({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  switch (info.id) {
    case "gate": return <GateBoard info={info} onQuit={onQuit} onWon={onWon} />;
    default: return <ComingSoon info={info} onQuit={onQuit} />;
  }
}

function ComingSoon({ info, onQuit }: { info: ShiftInfo; onQuit: () => void }) {
  return (
    <div className="menu">
      <h2>{info.emoji} {info.name}</h2>
      <p>This shift is still being built.</p>
      <button className="btn" onClick={onQuit}>Back</button>
    </div>
  );
}

function Menu({ completed, onPick }: { completed: ShiftId[]; onPick: (id: ShiftId) => void }) {
  return (
    <div className="menu">
      <h1 className="title">🛡️ GATEKEEPER</h1>
      <p className="tagline">You run the permission gate at Lobster Labs. {CAST.clawde.emoji} Clawde does exactly what you let him. {CAST.mallory.emoji} Mallory wants his keys.</p>
      <p className="muted">Get the sequence right or somebody does something hilarious. Three incidents and the pager fires.</p>
      <div className="shift-list">
        {SHIFTS.map((s) => (
          <button key={s.id} className="shift-card" onClick={() => onPick(s.id)}>
            <div className="shift-emoji">{s.emoji}</div>
            <div>
              <div className="shift-num">{s.number} {completed.includes(s.id) ? "✅" : ""}</div>
              <div className="shift-name">{s.name}</div>
              <div className="muted">{s.teaches}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
