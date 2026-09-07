import { useState } from "react";
import { Choice, type Option } from "../../engine/Choice";
import { Sequencer } from "../../engine/Sequencer";
import { ShiftFrame } from "../../engine/Shift";
import { useShift } from "../../engine/useShift";
import type { ShiftInfo } from "../../engine/types";
import { DANCE, GRANT_OPTIONS, REPLAY_OPTIONS, STEPS, checkDance } from "./data";

export function PkceBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const [round, setRound] = useState(1);

  function checkRound1(order: (string | null)[]) {
    const r = checkDance(order);
    if (r.ok) {
      shift.log({ who: "CLI", what: "logged in with authorization code + PKCE", why: "public client, user present, browser available" });
      shift.addScore(30);
      setRound(2);
    } else {
      shift.raise(r.incident, { who: "CLI", what: "danced wrong", why: r.incident.title });
    }
  }

  function pick(o: Option, next: () => void) {
    if (o.correct) {
      shift.log({ who: "auth server", what: o.label, why: o.why });
      shift.addScore(20);
      next();
    } else if (o.incident) {
      shift.raise(o.incident, { who: "you", what: o.label, why: o.why });
    }
  }

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="Auth code + PKCE when a user and a browser are present, device code when the browser is elsewhere, client credentials only for machines, and a replayed refresh token means revoke the family.">
      {round === 1 && (
        <div>
          <h2>Round 1: the dance</h2>
          <p className="muted">Mallory is watching the redirect. Build the ten steps of authorization code + PKCE for the CLI. Four cards are traps.</p>
          <Sequencer
            items={STEPS.map((s) => ({ id: s.id, render: <div className="tile"><div className="tile-meta">{s.lane}</div><div className="step-text">{s.text}</div></div> }))}
            slotCount={DANCE.length} columns={5} onCheck={checkRound1} checkLabel="Hit the dance floor" />
        </div>
      )}
      {round === 2 && (
        <div>
          <h2>Round 2: the laptop is in a datacenter</h2>
          <Choice prompt="You SSH into a build box with no browser. You, a human, need the CLI to act as you. Which grant?" options={GRANT_OPTIONS} onPick={(o) => pick(o, () => setRound(3))} />
        </div>
      )}
      {round === 3 && (
        <div>
          <h2>Round 3: the replay</h2>
          <Choice prompt="The auth server sees refresh token R1 redeemed a second time, from a new IP, four minutes after it was already rotated into R2. What now?" options={REPLAY_OPTIONS} onPick={(o) => pick(o, () => shift.win())} />
        </div>
      )}
    </ShiftFrame>
  );
}
