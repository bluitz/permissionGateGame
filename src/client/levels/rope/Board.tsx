import { useEffect, useState } from "react";
import { ShiftFrame } from "../../engine/Shift";
import { useQueue } from "../../engine/useQueue";
import { useShift } from "../../engine/useShift";
import type { Incident, ShiftInfo } from "../../engine/types";
import { GATES, VISITORS, correctStamp, falseBounce } from "./data";

const CROWD: Incident = {
  title: "The line reached the parking lot",
  panels: [
    { emoji: "🧍🧍🧍🧍", caption: "Four people waiting at the rope. You: thinking." },
    { emoji: "🦝🚪", caption: "Mallory slipped in through the kitchen while you were thinking." },
    { emoji: "🍹", caption: "She's already at the bar." },
  ],
  report: {
    youDid: "Let the queue back up past three visitors.",
    whatHappened: "A gate that never answers becomes a gate that gets bypassed.",
    concept: "Each gate asks one question. Read the evidence for that question and stamp.",
    fix: "Stamp faster. One question per gate.",
  },
};

export function RopeBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const paused = shift.incident !== null || shift.status !== "playing";
  const queue = useQueue(VISITORS, 11000, 3, () => shift.raise(CROWD, { who: "rope", what: "queue overflowed", why: "nobody stamped" }), paused);
  const [gate, setGate] = useState(0); // which gate the front visitor is standing at
  const [walking, setWalking] = useState(false);
  const v = queue.pending[0];

  useEffect(() => {
    if (queue.done && shift.status === "playing") shift.win();
  }, [queue.done]);

  function finish(delay: number) {
    setWalking(true);
    setTimeout(() => { setWalking(false); setGate(0); queue.resolve(v!.id); }, delay);
  }

  function stamp(choice: "pass" | "bounce") {
    if (!v || walking) return;
    const should = correctStamp(v, gate);
    const g = GATES[gate]!;
    if (choice !== should) {
      const inc = choice === "bounce" || !v.incident ? falseBounce(v, gate) : v.incident;
      shift.raise(inc, { who: "gatekeeper", what: `${choice.toUpperCase()} ${v.name} at ${g.name}`, why: `should have been ${should.toUpperCase()}` });
      finish(0);
      return;
    }
    shift.addScore(5);
    if (choice === "bounce") {
      shift.log({ who: g.name, what: `BOUNCE ${v.name}`, why: g.question + " failed: " + evidence(v, gate) });
      finish(600);
    } else if (gate === GATES.length - 1) {
      shift.log({ who: g.name, what: `PASS ${v.name}`, why: "all three questions answered yes" });
      finish(600);
    } else {
      shift.log({ who: g.name, what: `PASS ${v.name}`, why: g.question + " ok" });
      setGate(gate + 1);
    }
  }

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="Three questions, three tables, one order: who are you, what may you do, and what may the agent do for you right now.">
      <h2>The Velvet Rope</h2>
      <p className="muted">Each visitor walks through three gates. Each gate asks one question. Stamp PASS or BOUNCE using only the evidence for the gate they are standing at.</p>

      <div className="gates">
        {GATES.map((g, i) => (
          <div key={g.name} className={"gate" + (v && gate === i ? " gate-active" : "")}>
            <div className="gate-name">{g.name}</div>
            <div className="tile-meta">{g.question}</div>
            <div className="gate-hint">{g.hint}</div>
            {v && gate === i && <div className={"visitor" + (walking ? " visitor-walk" : "")}>{v.emoji}</div>}
          </div>
        ))}
        <div className="gate gate-inside">🍹 inside</div>
      </div>

      {v ? (
        <div className="call call-front">
          <div className="call-who">at the rope</div>
          <div className="call-label">{v.emoji} {v.name}</div>
          <div className="evidence">
            <div className={gate === 0 ? "evidence-now" : ""}>🪪 credential: {v.credential}</div>
            <div className={gate === 1 ? "evidence-now" : ""}>🎟️ role: {v.role}</div>
            <div className={gate === 2 ? "evidence-now" : ""}>🦞 wants Clawde to: {v.intent} <span className="muted">(session granted the agent: {v.sessionGrants ? "yes, this" : "read-only, not this"})</span></div>
          </div>
          <button className="btn" onClick={() => stamp("pass")} disabled={walking}>✅ PASS</button>
          <button className="btn btn-ghost" onClick={() => stamp("bounce")} disabled={walking}>⛔ BOUNCE</button>
        </div>
      ) : (
        <div className="call call-empty">the next visitor is walking up… ({queue.remaining} left)</div>
      )}
      <div className="conveyor">
        {queue.pending.slice(1).map((q) => <div key={q.id} className="call call-queued">{q.emoji} {q.name}</div>)}
      </div>
    </ShiftFrame>
  );
}

function evidence(v: { credential: string; role: string; intent: string }, gate: number) {
  return [v.credential, v.role, "session did not grant: " + v.intent][gate]!;
}
