import { describe, expect, test } from "bun:test";
import { CALLS, ORDER, checkOrder, judgeCall, type LayerId } from "../src/client/levels/gate/data";

describe("gate order", () => {
  test("the documented precedence passes", () => {
    expect(checkOrder(ORDER).ok).toBe(true);
  });
  test("allow before deny is the rm -rf incident", () => {
    const wrong: LayerId[] = ["managed", "allow", "deny", "hook", "sandbox", "mode", "classifier", "human"];
    const r = checkOrder(wrong);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.incident.title).toContain("rm -rf");
  });
  test("human first empties the office", () => {
    const r = checkOrder(["human", ...ORDER.filter((l) => l !== "human")]);
    if (!r.ok) expect(r.incident.title).toContain("resigned");
    expect(r.ok).toBe(false);
  });
  test("managed must be first", () => {
    const r = checkOrder(["deny", "managed", "hook", "allow", "sandbox", "mode", "classifier", "human"]);
    if (!r.ok) expect(r.incident.title).toContain("CISO");
    expect(r.ok).toBe(false);
  });
  test("classifier ahead of rules is slow", () => {
    const r = checkOrder(["managed", "classifier", "deny", "hook", "allow", "sandbox", "mode", "human"]);
    if (!r.ok) expect(r.incident.title).toContain("classifier");
    expect(r.ok).toBe(false);
  });
  test("an empty slot is a hole", () => {
    const r = checkOrder([...ORDER.slice(0, 7), null]);
    if (!r.ok) expect(r.incident.title).toContain("hole");
    expect(r.ok).toBe(false);
  });
});

describe("gate calls", () => {
  test("every call is decided by exactly its layer", () => {
    for (const call of CALLS) {
      expect(judgeCall(call, call.decidedBy).correct).toBe(true);
      for (const other of ORDER.filter((l) => l !== call.decidedBy)) expect(judgeCall(call, other).correct).toBe(false);
      expect(judgeCall(call, "nogate").correct).toBe(false);
    }
  });
  test("repo settings can only turn features off: managed decides, deny", () => {
    const repo = CALLS.find((c) => c.id === "repo-settings")!;
    expect(repo.decidedBy).toBe("managed");
    expect(repo.outcome).toBe("deny");
  });
  test("a sub-agent goes through the same gate as its parent", () => {
    const parent = CALLS.find((c) => c.id === "curl-sh")!;
    const junior = CALLS.find((c) => c.id === "junior")!;
    expect(junior.decidedBy).toBe(parent.decidedBy);
    expect(junior.outcome).toBe("deny");
  });
  test("deny outcomes are only decided by layers at or before the first allow layer, or the classifier/human", () => {
    for (const call of CALLS.filter((c) => c.outcome === "deny")) {
      expect(["managed", "deny", "hook", "classifier"]).toContain(call.decidedBy);
    }
  });
});
