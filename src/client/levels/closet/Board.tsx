import { useEffect, useState } from "react";
import { ShiftFrame } from "../../engine/Shift";
import { useShift } from "../../engine/useShift";
import type { ShiftInfo } from "../../engine/types";
import { CREDS, SLOTS, judgeSlot, slotIncident, type CredId } from "./data";

const WAVE_MS = 2600; // Mallory hits one slot every few seconds

export function ClosetBoard({ info, onQuit, onWon }: { info: ShiftInfo; onQuit: () => void; onWon: () => void }) {
  const shift = useShift();
  const [equipped, setEquipped] = useState<Record<string, CredId | null>>(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
  const [held, setHeld] = useState<CredId | null>(null);
  const [phase, setPhase] = useState<"equip" | "attack">("equip");
  const [attacking, setAttacking] = useState(-1); // index into SLOTS of the wave in flight
  const [survived, setSurvived] = useState<Record<string, boolean>>({}); // slots that survived
  const paused = shift.incident !== null || shift.status !== "playing";

  const allEquipped = SLOTS.every((s) => equipped[s.id]);

  function equip(slotId: string) {
    if (phase !== "equip") return;
    if (!held) {
      if (equipped[slotId]) setEquipped({ ...equipped, [slotId]: null });
      return;
    }
    const next = { ...equipped };
    for (const k of Object.keys(next)) if (next[k] === held) next[k] = null; // a credential fits one slot
    next[slotId] = held;
    setEquipped(next);
    setHeld(null);
  }

  // The attack phase: walk the slots one by one. A mismatch raises the incident and clears that slot.
  useEffect(() => {
    if (phase !== "attack" || paused) return;
    const next = SLOTS.findIndex((s, i) => i > attacking && !survived[s.id]);
    if (next === -1) {
      if (SLOTS.every((s) => survived[s.id])) shift.win();
      else { setPhase("equip"); setAttacking(-1); }
      return;
    }
    const t = setTimeout(() => {
      const slot = SLOTS[next]!;
      const cred = equipped[slot.id]!;
      setAttacking(next);
      if (judgeSlot(slot, cred)) {
        shift.log({ who: CREDS[cred].name, what: `held ${slot.name}`, why: slot.why });
        shift.addScore(10);
        setSurvived((h) => ({ ...h, [slot.id]: true }));
      } else {
        shift.raise(slotIncident(slot, cred), { who: CREDS[cred].name, what: `failed at ${slot.name}`, why: CREDS[cred].fails });
        setEquipped((e) => ({ ...e, [slot.id]: null }));
      }
    }, WAVE_MS);
    return () => clearTimeout(t);
  }, [phase, attacking, paused]);

  return (
    <ShiftFrame info={info} shift={shift} onQuit={onQuit} onWon={onWon}
      winText="Every credential has a shape, a failure mode, and a place it belongs. You can now say which is which without the table.">
      <h2>The Credential Closet</h2>
      {phase === "equip" ? (
        <p className="muted">Seven services, seven credentials, one each. Click a credential, then the service it belongs to. Then open the doors and let Mallory try each one.</p>
      ) : (
        <p className="muted">Mallory is testing each door. Watch the transcript.</p>
      )}

      <div className="closet">
        {SLOTS.map((s, i) => {
          const c = equipped[s.id];
          const state = survived[s.id] ? " door-held" : attacking === i && phase === "attack" ? " door-hit" : "";
          return (
            <button key={s.id} className={"door" + (c ? " slot-filled" : "") + (held ? " slot-target" : "") + state} onClick={() => equip(s.id)} disabled={phase === "attack"}>
              <div className="tile-name">{s.name}</div>
              <div className="tile-meta">{s.need}</div>
              <div className="door-cred">{c ? "🔐 " + CREDS[c].name : "(empty)"}</div>
              {phase === "attack" && attacking === i && !survived[s.id] && <div className="door-wave">🦝 {s.wave}</div>}
              {survived[s.id] && <div className="blocked-stamp">HELD</div>}
            </button>
          );
        })}
      </div>

      {phase === "equip" && (
        <>
          <div className="tray">
            {(Object.keys(CREDS) as CredId[]).filter((id) => !Object.values(equipped).includes(id)).map((id) => (
              <button key={id} className={"tile-btn" + (held === id ? " tile-held" : "")} onClick={() => setHeld(held === id ? null : id)}>
                <div className="tile"><div className="tile-name">{CREDS[id].name}</div><div className="tile-meta">{CREDS[id].how}</div><div className="tile-meta">fails: {CREDS[id].fails}</div></div>
              </button>
            ))}
          </div>
          <button className="btn" disabled={!allEquipped} onClick={() => { setPhase("attack"); setAttacking(-1); }}>Open the doors</button>
        </>
      )}
    </ShiftFrame>
  );
}
