import { MAX_LIVES } from "./useShift";
import type { ShiftInfo } from "./types";

export function Hud({ info, lives, score, onQuit }: { info: ShiftInfo; lives: number; score: number; onQuit: () => void }) {
  const pagers = Array.from({ length: MAX_LIVES }, (_, i) => (i < lives ? "📟" : "💥"));
  return (
    <header className="hud">
      <button className="btn btn-small" onClick={onQuit}>◀ Shifts</button>
      <div className="hud-name">{info.emoji} {info.number}: {info.name}</div>
      <div className="hud-lives" title="Three incidents and the pager fires">{pagers.join(" ")}</div>
      <div className="hud-score">score {score}</div>
    </header>
  );
}
