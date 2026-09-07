import { describe, expect, test } from "bun:test";
import { DANCE, GRANT_OPTIONS, REPLAY_OPTIONS, STEPS, checkDance } from "../src/client/levels/pkce/data";

describe("pkce dance", () => {
  test("the right ten steps pass", () => expect(checkDance(DANCE).ok).toBe(true));
  test("every decoy names its own incident", () => {
    const swap = (from: string, to: string) => DANCE.map((s) => (s === from ? to : s));
    const title = (o: (string | null)[]) => { const r = checkDance(o); return r.ok ? "" : r.incident.title; };
    expect(title(swap("exchange", "skipverifier"))).toContain("Mallory caught the code");
    expect(title(swap("store", "plain"))).toContain("tokens.txt");
    expect(title(swap("exchange", "clientcreds"))).toContain("robot");
    expect(title(swap("verifier", "secret"))).toContain("secret");
  });
  test("a hole or a shuffle fails", () => {
    expect(checkDance([...DANCE.slice(0, 9), null]).ok).toBe(false);
    expect(checkDance([...DANCE].reverse()).ok).toBe(false);
  });
  test("decoys are marked and never in the dance", () => {
    for (const s of STEPS.filter((s) => s.decoy)) expect(DANCE).not.toContain(s.id);
  });
  test("device code is the headless answer; revoke the family on replay", () => {
    expect(GRANT_OPTIONS.filter((o) => o.correct).map((o) => o.id)).toEqual(["device"]);
    expect(REPLAY_OPTIONS.filter((o) => o.correct).map((o) => o.id)).toEqual(["revoke"]);
    for (const o of [...GRANT_OPTIONS, ...REPLAY_OPTIONS]) if (!o.correct) expect(o.incident).toBeDefined();
  });
});
