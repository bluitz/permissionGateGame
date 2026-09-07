import { describe, expect, test } from "bun:test";
import { VISITORS, correctStamp, stopsAt } from "../src/client/levels/rope/data";

const by = (id: string) => VISITORS.find((v) => v.id === id)!;

describe("velvet rope", () => {
  test("the CEO passes all three gates", () => expect(stopsAt(by("dana"))).toBe(-1));
  test("a name tag is not a credential: Mallory stops at WHO?", () => expect(stopsAt(by("mallory"))).toBe(0));
  test("an expired JWT stops at WHO?", () => expect(stopsAt(by("kevin"))).toBe(0));
  test("alg:none stops at WHO?", () => expect(stopsAt(by("root"))).toBe(0));
  test("authenticated but not authorized: Bob stops at MAY THEY?", () => expect(stopsAt(by("bob"))).toBe(1));
  test("an admin whose session never granted it: Priya stops at MAY CLAWDE, NOW?", () => expect(stopsAt(by("priya"))).toBe(2));
  test("even the CEO's agent only holds the session grant", () => expect(stopsAt(by("dana2"))).toBe(2));
  test("gate 1 never looks at role or session", () => {
    for (const v of VISITORS) expect(correctStamp(v, 0)).toBe(v.credentialValid ? "pass" : "bounce");
  });
});
