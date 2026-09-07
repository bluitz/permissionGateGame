import { useEffect, useState } from "react";
import { ShiftFrame } from "../../engine/Shift";
import { useShift } from "../../engine/useShift";
import type { ShiftInfo } from "../../engine/types";
import { CAST } from "../../cast";
import { HMM_PENALTY_S, LINES, TIME_LIMIT_S, lineDone } from "./data";

export function BossBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_S);
  const [lineIdx, setLineIdx] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [hmm, setHmm] = useState(false);
  const [beaten, setBeaten] = useState(false);
  const line = LINES[lineIdx];

  useEffect(() => {
    if (!started || beaten || shift.status !== "playing") return;
    if (timeLeft <= 0) { shift.fail(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, timeLeft, beaten, shift.status]);

  function pick(id: string) {
    if (!line || picked.includes(id)) return;
    const f = line.fragments.find((x) => x.id === id)!;
    if (!f.correct) {
      setTimeLeft((s) => s - HMM_PENALTY_S);
      setHmm(true);
      setTimeout(() => setHmm(false), 900);
      shift.log({ who: "the Head", what: "Hmm.", why: `'${f.text}' is not the answer`, bad: true });
      return;
    }
    const next = [...picked, id];
    setPicked(next);
    if (lineDone(line, next)) {
      shift.log({ who: "you", what: line.prompt, why: line.fragments.filter((x) => x.correct).map((x) => x.text).join("; ") });
      shift.addScore(20);
      if (lineIdx + 1 >= LINES.length) setBeaten(true);
      else { setLineIdx(lineIdx + 1); setPicked([]); }
    }
  }

  const health = beaten ? 0 : Math.round(100 * (1 - lineIdx / LINES.length));

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon} winText="">
      {!started && (
        <div className="card">
          <h2>{CAST.head.emoji} The Two-Minute Interview</h2>
          <p>A giant floating head asks the five worksheet lines. You have two minutes for all five. Pick every fragment that belongs in the answer. A wrong fragment makes the Head say "Hmm." and costs ten seconds.</p>
          <button className="btn" onClick={() => setStarted(true)}>I'm ready</button>
        </div>
      )}
      {started && !beaten && line && (
        <div>
          <div className="boss-row">
            <div className={"boss-head" + (hmm ? " boss-hmm" : "")}>{CAST.head.emoji}{hmm && <div className="bubble">Hmm.</div>}</div>
            <div className="boss-stats">
              <div className="healthbar"><div className="health" style={{ width: `${health}%` }} /></div>
              <div className={"timer" + (timeLeft <= 20 ? " timer-low" : "")}>⏱ {timeLeft}s</div>
            </div>
          </div>
          <div className="choice">
            <p className="choice-prompt">Line {lineIdx + 1} of {LINES.length}: {line.prompt}</p>
            <div className="choice-options">
              {line.fragments.map((f) => (
                <button key={f.id} className={"gate-layer" + (picked.includes(f.id) ? " gate-lit" : "")} onClick={() => pick(f.id)} disabled={picked.includes(f.id)}>
                  <div className="tile-name">{f.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {beaten && (
        <div className="card certificate">
          <h2>🏆 Gatekeeper, Staff+</h2>
          <p className="muted">Finished with {timeLeft}s to spare. Here is the worksheet you just spoke. Say it out loud, twice.</p>
          {LINES.map((l) => (
            <p key={l.id}><b>{l.prompt}</b><br />{l.fragments.filter((f) => f.correct).map((f) => f.text).join("; ")}.</p>
          ))}
          <button className="btn" onClick={onWon}>Collect certificate</button>
        </div>
      )}
    </ShiftFrame>
  );
}
