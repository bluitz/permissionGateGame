import { useEffect, useState } from "react";
import { ShiftFrame } from "../../engine/Shift";
import { useQueue } from "../../engine/useQueue";
import { useShift } from "../../engine/useShift";
import type { Incident, ShiftInfo } from "../../engine/types";
import { MITIGATIONS, WAVES, judgeWave, type MitigationId } from "./data";

const OVERRUN: Incident = {
  title: "Two attacks landed while you were reading",
  panels: [
    { emoji: "🦝🦝", caption: "Two waves at once. You: still deciding." },
    { emoji: "💥💥", caption: "Both land." },
    { emoji: "📟", caption: "The pager does not care that you were being thorough." },
  ],
  report: {
    youDid: "Let the attack queue overflow.",
    whatHappened: "Mitigations are pre-built. They are cards you already hold, not research projects.",
    concept: "Threat ↔ mechanism ↔ mitigation. Know the pairs cold.",
    fix: "Play the card as the wave appears.",
  },
};

export function VillainsBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const paused = shift.incident !== null || shift.status !== "playing";
  const queue = useQueue(WAVES, 13000, 2, () => shift.raise(OVERRUN, { who: "Mallory", what: "two waves landed", why: "queue overflowed" }), paused);
  const [blocked, setBlocked] = useState(false);
  const wave = queue.pending[0];

  useEffect(() => {
    if (queue.done && shift.status === "playing") shift.win();
  }, [queue.done]);

  function play(id: MitigationId) {
    if (!wave || blocked) return;
    if (judgeWave(wave, id)) {
      shift.log({ who: MITIGATIONS[id].name, what: `blocked ${wave.name}`, why: wave.why });
      shift.addScore(15);
      setBlocked(true);
      setTimeout(() => { setBlocked(false); queue.resolve(wave.id); }, 700);
    } else {
      shift.raise(wave.incident, { who: "you", what: `played '${MITIGATIONS[id].name}' against ${wave.name}`, why: `needed '${MITIGATIONS[wave.mitigation].name}'` });
      queue.resolve(wave.id);
    }
  }

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="Six threats, six mechanisms, six mitigations. And one card that was never a mitigation.">
      <h2>The Villain Lineup</h2>
      <p className="muted">Mallory's attacks walk in from the left. Play the mitigation card that stops the one at the front.</p>
      <div className="conveyor">
        {wave ? (
          <div className={"call call-front wave" + (blocked ? " wave-blocked" : "")}>
            <div className="call-who">🦝 {wave.name}, from {wave.from}</div>
            <div className="call-label">{wave.mechanism}</div>
            <div className="call-context">target: {wave.target}</div>
            {blocked && <div className="blocked-stamp">BLOCKED</div>}
          </div>
        ) : (
          <div className="call call-empty">Mallory is winding up… ({queue.remaining} left)</div>
        )}
        {queue.pending.slice(1).map((w) => <div key={w.id} className="call call-queued">🦝 {w.name}</div>)}
      </div>
      <div className="gate-row">
        {(Object.keys(MITIGATIONS) as MitigationId[]).map((id) => (
          <button key={id} className={"gate-layer" + (id === "please" ? " gate-nogate" : "")} onClick={() => play(id)} disabled={!wave || blocked}>
            <div className="tile-name">🃏 {MITIGATIONS[id].name}</div>
            <div className="tile-meta">{MITIGATIONS[id].detail}</div>
          </button>
        ))}
      </div>
    </ShiftFrame>
  );
}
