import { describe, expect, test } from "bun:test";
import { MODELS, PERMITS, REVOKE_OPTIONS, SPAWN_OPTIONS, judgePermit, type ModelId } from "../src/client/levels/zoning/data";
import { LINES, lineDone } from "../src/client/levels/boss/data";

describe("zoning office", () => {
  test("each permit has exactly one model", () => {
    for (const p of PERMITS) {
      expect((Object.keys(MODELS) as ModelId[]).filter((m) => judgePermit(p, m))).toEqual([p.correct]);
    }
  });
  test("the agent session is capability-based; tool patterns are rule lists", () => {
    expect(PERMITS.find((p) => p.id === "session")!.correct).toBe("cap");
    expect(PERMITS.find((p) => p.id === "tools")!.correct).toBe("rules");
  });
  test("a child gets a subset; revocation propagates", () => {
    expect(SPAWN_OPTIONS.filter((o) => o.correct).map((o) => o.id)).toEqual(["subset"]);
    expect(REVOKE_OPTIONS.filter((o) => o.correct).map((o) => o.id)).toEqual(["propagate"]);
  });
});

describe("boss", () => {
  test("a line is done only when every correct fragment is picked", () => {
    const gate = LINES.find((l) => l.id === "gate")!;
    const right = gate.fragments.filter((f) => f.correct).map((f) => f.id);
    expect(lineDone(gate, right.slice(0, -1))).toBe(false);
    expect(lineDone(gate, right)).toBe(true);
  });
  test("every line has at least one decoy and one answer", () => {
    for (const l of LINES) {
      expect(l.fragments.some((f) => f.correct)).toBe(true);
      expect(l.fragments.some((f) => !f.correct)).toBe(true);
    }
  });
});
