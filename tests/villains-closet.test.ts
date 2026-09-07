import { describe, expect, test } from "bun:test";
import { MITIGATIONS, WAVES, judgeWave, type MitigationId } from "../src/client/levels/villains/data";
import { CREDS, SLOTS, judgeSlot, slotIncident, type CredId } from "../src/client/levels/closet/data";

describe("villain lineup", () => {
  test("each wave has exactly one mitigation, and 'please' stops nothing", () => {
    for (const w of WAVES) {
      const winners = (Object.keys(MITIGATIONS) as MitigationId[]).filter((m) => judgeWave(w, m));
      expect(winners).toEqual([w.mitigation]);
    }
    expect(WAVES.some((w) => w.mitigation === "please")).toBe(false);
  });
  test("the confused deputy is fixed by per-user tokens, never passthrough", () => {
    expect(WAVES.find((w) => w.id === "deputy")!.mitigation).toBe("peruser");
  });
});

describe("credential closet", () => {
  test("seven slots, seven credentials, a one-to-one match", () => {
    const used = SLOTS.map((s) => s.correct).sort();
    expect(used).toEqual((Object.keys(CREDS) as CredId[]).sort());
  });
  test("a wrong credential is judged wrong and names itself in the report", () => {
    const web = SLOTS.find((s) => s.id === "web")!;
    expect(judgeSlot(web, "cookie")).toBe(true);
    expect(judgeSlot(web, "jwt")).toBe(false);
    expect(slotIncident(web, "jwt").report.youDid).toContain("JWT");
  });
  test("remote control wants instant revocation, the runner wants offline verification", () => {
    expect(SLOTS.find((s) => s.id === "remote")!.correct).toBe("bearer");
    expect(SLOTS.find((s) => s.id === "runner")!.correct).toBe("jwt");
  });
});
