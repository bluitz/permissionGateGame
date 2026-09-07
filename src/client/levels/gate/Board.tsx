import { useEffect, useState } from "react";
import { Sequencer } from "../../engine/Sequencer";
import { ShiftFrame } from "../../engine/Shift";
import { useQueue } from "../../engine/useQueue";
import { useShift } from "../../engine/useShift";
import type { Incident, ShiftInfo } from "../../engine/types";
import { CALLS, LAYERS, NO_GATE, ORDER, checkOrder, judgeCall, type LayerId } from "./data";

const STALL: Incident = {
  title: "The pipeline stalled",
  panels: [
    { emoji: "🚚🚚🚚", caption: "Tool calls piling up at the gate. Nobody deciding." },
    { emoji: "🦞⏳", caption: "Clawde: 'Still waiting on ls from 20 minutes ago.'" },
    { emoji: "🏃🚪", caption: "The humans quit. Again." },
  ],
  report: {
    youDid: "Let the queue back up past three waiting calls.",
    whatHappened: "A gate that never answers is as broken as one that always says yes.",
    concept: "Cheap deterministic layers exist so most calls are decided instantly.",
    fix: "Decide each call as it arrives. Most take one click.",
  },
};

export function GateBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const [phase, setPhase] = useState<"build" | "run">("build");

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="You can now name the precedence order AND where each layer is enforced. That is the Staff+ signal.">
      {phase === "build"
        ? <BuildPhase shift={shift} onBuilt={() => { shift.addScore(30); setPhase("run"); }} />
        : <RunPhase shift={shift} />}
    </ShiftFrame>
  );
}

/** Phase A: put the eight layers in precedence order. */
function BuildPhase({ shift, onBuilt }: { shift: ReturnType<typeof useShift>; onBuilt: () => void }) {
  function check(order: (string | null)[]) {
    const result = checkOrder(order as (LayerId | null)[]);
    if (result.ok) {
      shift.log({ who: "gatekeeper", what: "assembled the gate", why: "managed → deny → hook → allow → sandbox → mode → classifier → human" });
      onBuilt();
    } else {
      shift.raise(result.incident, { who: "gatekeeper", what: "assembled the gate wrong", why: result.incident.title });
    }
  }
  return (
    <div>
      <h2>Phase A: build the gate</h2>
      <p className="muted">Eight layers, one order. Click a tile, then a slot. Tool calls will enter at slot 1 and stop at the first layer that decides.</p>
      <Sequencer items={ORDER.map((id) => ({ id, render: <LayerTile id={id} /> }))} slotCount={ORDER.length} columns={4} onCheck={check} checkLabel="Check the gate" />
    </div>
  );
}

function LayerTile({ id }: { id: LayerId }) {
  const l = LAYERS[id];
  return (
    <div className="tile">
      <div className="tile-name">{l.name}</div>
      <div className="tile-meta">enforced at: {l.enforcedAt}</div>
      <div className="tile-meta">{l.cost}</div>
    </div>
  );
}

/** Phase B: calls roll in; click the layer that should decide the one at the front. */
function RunPhase({ shift }: { shift: ReturnType<typeof useShift> }) {
  const paused = shift.incident !== null || shift.status !== "playing";
  const queue = useQueue(CALLS, 9000, 3, () => shift.raise(STALL, { who: "gate", what: "stalled", why: "queue overflowed" }), paused);
  const [lit, setLit] = useState(-1); // how far the current call has travelled through the gate
  const [flying, setFlying] = useState(false);
  const current = queue.pending[0];

  useEffect(() => {
    if (queue.done && shift.status === "playing") shift.win();
  }, [queue.done]);

  function choose(layer: LayerId | typeof NO_GATE) {
    if (!current || flying) return;
    if (layer === NO_GATE) {
      shift.raise(current.incident, { who: current.who, what: current.label, why: "waved through with no gate" });
      queue.resolve(current.id);
      return;
    }
    const { correct } = judgeCall(current, layer);
    if (!correct) {
      shift.raise(current.incident, { who: current.who, what: current.label, why: `decided by ${LAYERS[layer].name}, should be ${LAYERS[current.decidedBy].name}` });
      queue.resolve(current.id);
      return;
    }
    // Animate the call walking through the layers until the one that decides it.
    const target = ORDER.indexOf(layer);
    setFlying(true);
    let step = 0;
    const timer = setInterval(() => {
      setLit(step);
      if (step >= target) {
        clearInterval(timer);
        shift.log({ who: LAYERS[layer].name, what: `${current.outcome.toUpperCase()} ${current.label}`, why: current.why });
        if (current.aftermath) shift.log({ who: "harness", what: "dialog expired", why: current.aftermath });
        shift.addScore(10);
        setTimeout(() => { setLit(-1); setFlying(false); queue.resolve(current.id); }, 500);
      }
      step += 1;
    }, 180);
  }

  return (
    <div>
      <h2>Phase B: run the gate</h2>
      <p className="muted">Calls arrive on the conveyor. For the one at the front, click the layer that decides it. Every decision lands in the transcript.</p>

      <div className="conveyor">
        {current ? (
          <div className={"call call-front" + (flying ? " call-fly" : "")}>
            <div className="call-who">{current.who} proposes</div>
            <div className="call-label">{current.label}</div>
            <div className="call-context">{current.context}</div>
          </div>
        ) : (
          <div className="call call-empty">waiting for the next call… ({queue.remaining} left)</div>
        )}
        {queue.pending.slice(1).map((c) => (
          <div key={c.id} className="call call-queued"><div className="call-label">{c.label}</div></div>
        ))}
      </div>

      <div className="gate-row">
        {ORDER.map((id, i) => (
          <button key={id} className={"gate-layer" + (lit >= i ? " gate-lit" : "")} onClick={() => choose(id)} disabled={!current || flying}>
            <div className="slot-num">{i + 1}</div>
            <div className="tile-name">{LAYERS[id].name}</div>
            <div className="tile-meta">{LAYERS[id].blurb}</div>
          </button>
        ))}
        <button className="gate-layer gate-nogate" onClick={() => choose(NO_GATE)} disabled={!current || flying}>
          <div className="tile-name">⚡ No gate needed</div>
          <div className="tile-meta">It's just a small thing. Probably fine.</div>
        </button>
      </div>
    </div>
  );
}
