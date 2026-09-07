import type { Incident } from "./types";

export type Option = { id: string; label: string; detail?: string; correct?: boolean; incident?: Incident; why: string };

/** One question, a few buttons. The board decides what a right or wrong pick does. */
export function Choice({ prompt, options, onPick }: { prompt: string; options: Option[]; onPick: (o: Option) => void }) {
  return (
    <div className="choice">
      <p className="choice-prompt">{prompt}</p>
      <div className="choice-options">
        {options.map((o) => (
          <button key={o.id} className="gate-layer" onClick={() => onPick(o)}>
            <div className="tile-name">{o.label}</div>
            {o.detail && <div className="tile-meta">{o.detail}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
