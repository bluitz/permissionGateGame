import { useEffect, useState } from "react";

/**
 * Releases items one at a time, paceMs apart, until the list is exhausted.
 * `pending` is what has arrived and not been resolved. If pending grows past
 * `maxPending`, onOverflow fires once (the pipeline stalled) and the queue drops its oldest.
 */
export function useQueue<T extends { id: string }>(items: T[], paceMs: number, maxPending: number, onOverflow: () => void, paused: boolean) {
  const [released, setReleased] = useState(1);
  const [resolved, setResolved] = useState<string[]>([]);

  useEffect(() => {
    if (paused || released >= items.length) return;
    const t = setTimeout(() => setReleased((n) => n + 1), paceMs);
    return () => clearTimeout(t);
  }, [released, paused, items.length, paceMs]);

  const pending = items.slice(0, released).filter((it) => !resolved.includes(it.id));

  useEffect(() => {
    if (pending.length > maxPending) {
      onOverflow();
      setResolved((r) => [...r, pending[0]!.id]);
    }
  }, [pending.length]);

  function resolve(id: string) {
    setResolved((r) => [...r, id]);
  }
  const done = released >= items.length && pending.length === 0;
  return { pending, resolve, done, remaining: items.length - released };
}
