import { useState } from "react";
import { loadCompleted, markCompleted } from "./engine/progress";
import { SHIFTS, type ShiftId, type ShiftInfo } from "./engine/types";
import { CAST } from "./cast";
import { GateBoard } from "./levels/gate/Board";
import { RopeBoard } from "./levels/rope/Board";
import { PkceBoard } from "./levels/pkce/Board";
import { VillainsBoard } from "./levels/villains/Board";
import { ClosetBoard } from "./levels/closet/Board";
import { ZoningBoard } from "./levels/zoning/Board";
import { BossBoard } from "./levels/boss/Board";

export function App() {
  // #gate, #rope, etc. open a shift directly, so a link can point at one
  const [current, setCurrent] = useState<ShiftId | null>(() => (SHIFTS.find((s) => "#" + s.id === location.hash)?.id ?? null));
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
    case "rope": return <RopeBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "pkce": return <PkceBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "villains": return <VillainsBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "closet": return <ClosetBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "zoning": return <ZoningBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "boss": return <BossBoard info={info} onQuit={onQuit} onWon={onWon} />;
    case "gate": return <GateBoard info={info} onQuit={onQuit} onWon={onWon} />;
  }
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
