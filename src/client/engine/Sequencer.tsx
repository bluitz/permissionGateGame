import { useState, type ReactNode } from "react";

export type SeqItem = { id: string; render: ReactNode };

function shuffle<T>(xs: T[]): T[] {
  return [...xs].sort(() => Math.random() - 0.5);
}

/**
 * Put items in order: click a tile in the tray, then a slot. Click a filled slot
 * with nothing held to send it back to the tray. Decoys are allowed, so the tray
 * may hold more items than there are slots.
 */
export function Sequencer({ items, slotCount, columns, onCheck, checkLabel }: {
  items: SeqItem[]; slotCount: number; columns: number; onCheck: (order: (string | null)[]) => void; checkLabel: string;
}) {
  const [tray, setTray] = useState<string[]>(() => shuffle(items.map((i) => i.id)));
  const [slots, setSlots] = useState<(string | null)[]>(Array(slotCount).fill(null));
  const [held, setHeld] = useState<string | null>(null);
  const byId = (id: string) => items.find((i) => i.id === id)!.render;

  function place(i: number) {
    const inSlot = slots[i];
    if (!held) {
      if (!inSlot) return;
      setSlots(slots.map((s, j) => (j === i ? null : s)));
      setTray([...tray, inSlot]);
      return;
    }
    setSlots(slots.map((s, j) => (j === i ? held : s)));
    setTray([...tray.filter((t) => t !== held), ...(inSlot ? [inSlot] : [])]);
    setHeld(null);
  }

  return (
    <div>
      <div className="slots" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {slots.map((s, i) => (
          <button key={i} className={"slot" + (s ? " slot-filled" : "") + (held ? " slot-target" : "")} onClick={() => place(i)}>
            <div className="slot-num">{i + 1}</div>
            {s ? byId(s) : <div className="slot-empty">empty</div>}
          </button>
        ))}
      </div>
      <div className="tray">
        {tray.map((id) => (
          <button key={id} className={"tile-btn" + (held === id ? " tile-held" : "")} onClick={() => setHeld(held === id ? null : id)}>
            {byId(id)}
          </button>
        ))}
      </div>
      <button className="btn" onClick={() => onCheck(slots)}>{checkLabel}</button>
    </div>
  );
}
