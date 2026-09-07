import { useEffect, useState } from "react";
import { Choice, type Option } from "../../engine/Choice";
import { ShiftFrame } from "../../engine/Shift";
import { useQueue } from "../../engine/useQueue";
import { useShift } from "../../engine/useShift";
import type { Incident, ShiftInfo } from "../../engine/types";
import { MODELS, PERMITS, REVOKE_OPTIONS, SPAWN_OPTIONS, judgePermit, type ModelId } from "./data";

const BACKLOG: Incident = {
  title: "The permit office has a line out the door",
  panels: [
    { emoji: "🏢🧍🧍🧍", caption: "Three buildings waiting for a permit." },
    { emoji: "🏗️🤷", caption: "They built anyway. With no permissions at all. Or all of them." },
    { emoji: "🦝🏠", caption: "Mallory got a permit for a moat." },
  ],
  report: {
    youDid: "Let the permit queue overflow.",
    whatHappened: "Each request has a shape, and each shape has a model.",
    concept: "RBAC for roles, ABAC for attributes, ReBAC for relationship graphs, capabilities for agent sessions, rule lists for tool patterns.",
    fix: "Stamp faster.",
  },
};

export function ZoningBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const [round, setRound] = useState(1);
  const paused = shift.incident !== null || shift.status !== "playing" || round !== 1;
  const queue = useQueue(PERMITS, 12000, 3, () => shift.raise(BACKLOG, { who: "zoning", what: "queue overflowed", why: "nobody stamped" }), paused);
  const permit = queue.pending[0];

  useEffect(() => {
    if (queue.done && round === 1) { shift.addScore(10); setRound(2); }
  }, [queue.done]);

  function zone(id: ModelId) {
    if (!permit) return;
    if (judgePermit(permit, id)) {
      shift.log({ who: MODELS[id].name, what: `permit for ${permit.building}`, why: permit.why });
      shift.addScore(10);
    } else {
      shift.raise(permit.incident, { who: MODELS[id].name, what: `permit for ${permit.building}`, why: `should be ${MODELS[permit.correct].name}` });
    }
    queue.resolve(permit.id);
  }

  function pick(o: Option, next: () => void) {
    if (o.correct) {
      shift.log({ who: "capability table", what: o.label, why: o.why });
      shift.addScore(20);
      next();
    } else if (o.incident) {
      shift.raise(o.incident, { who: "you", what: o.label, why: o.why });
    }
  }

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="Roles for coarse org structure, attributes for context, graphs for sharing, capabilities for agents, and rule lists for tools. And a child never outranks its parent.">
      {round === 1 && (
        <div>
          <h2>Round 1: permits</h2>
          <p className="muted">Buildings need a permit. Each policy has a shape; pick the authorization model that fits it. The wrong one either over-grants or grinds the city to a halt.</p>
          <div className="conveyor">
            {permit ? (
              <div className="call call-front">
                <div className="call-who">permit request</div>
                <div className="call-label">{permit.building}</div>
                <div className="call-context">{permit.text}</div>
              </div>
            ) : (
              <div className="call call-empty">the next building is on its way… ({queue.remaining} left)</div>
            )}
            {queue.pending.slice(1).map((p) => <div key={p.id} className="call call-queued">{p.building}</div>)}
          </div>
          <div className="gate-row">
            {(Object.keys(MODELS) as ModelId[]).map((id) => (
              <button key={id} className="gate-layer" onClick={() => zone(id)} disabled={!permit}>
                <div className="tile-name">{MODELS[id].name}</div>
                <div className="tile-meta">{MODELS[id].idea}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {round === 2 && (
        <div>
          <h2>Round 2: Clawde spawns Clawde Jr.</h2>
          <div className="captable">
            <div className="tile-meta">Clawde's capability table this session</div>
            <div>🔑 Read(src/**)</div><div>🔑 Bash(npm test:*)</div><div>🔑 Fetch(docs.example.com)</div>
          </div>
          <Choice prompt="Clawde spawns Junior to run the test suite in parallel. Junior asks for Bash(*) and Read(**). What does Junior get?" options={SPAWN_OPTIONS} onPick={(o) => pick(o, () => setRound(3))} />
        </div>
      )}
      {round === 3 && (
        <div>
          <h2>Round 3: mid-session revoke</h2>
          <Choice prompt="Dana notices the tests are hitting prod and revokes Bash(npm test:*) from Clawde's session. Junior is halfway through 3,000 tests. What happens to Junior?" options={REVOKE_OPTIONS} onPick={(o) => pick(o, () => shift.win())} />
        </div>
      )}
    </ShiftFrame>
  );
}
