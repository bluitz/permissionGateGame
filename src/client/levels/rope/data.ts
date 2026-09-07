import type { Incident } from "../../engine/types";

/**
 * Three gates, three different questions, always in this order:
 *   WHO?            authentication: is the credential real?
 *   MAY THEY?       authorization: does this identity have the right?
 *   MAY CLAWDE, NOW? delegation: did THIS session grant the agent THIS action?
 */
export const GATES = [
  { name: "WHO?", question: "Authentication", hint: "Is the credential genuine and unexpired?" },
  { name: "MAY THEY?", question: "Authorization", hint: "Does this identity hold the right for this action?" },
  { name: "MAY CLAWDE, NOW?", question: "Delegation", hint: "Did this session grant the agent this action, right now?" },
] as const;

export type Visitor = {
  id: string;
  name: string;
  emoji: string;
  credential: string;
  credentialValid: boolean;
  role: string;
  roleAllows: boolean;
  intent: string;
  sessionGrants: boolean;
  /** what happens if a bad visitor gets past the gate that should have stopped them */
  incident?: Incident; // absent for visitors who belong inside
};

/** The stamp the player should use at a gate for this visitor. */
export function correctStamp(v: Visitor, gate: number): "pass" | "bounce" {
  if (gate === 0) return v.credentialValid ? "pass" : "bounce";
  if (gate === 1) return v.roleAllows ? "pass" : "bounce";
  return v.sessionGrants ? "pass" : "bounce";
}

/** Which gate should stop this visitor, or -1 if they belong inside. */
export function stopsAt(v: Visitor): number {
  for (let g = 0; g < GATES.length; g++) if (correctStamp(v, g) === "bounce") return g;
  return -1;
}

/** A wrong bounce: a legitimate visitor left outside. Availability is a security property too. */
export function falseBounce(v: Visitor, gate: number): Incident {
  return {
    title: `${v.name} is standing in the rain`,
    panels: [
      { emoji: "🌧️" + v.emoji, caption: `${v.name} presented ${v.credential}. You bounced them at ${GATES[gate]!.name}.` },
      { emoji: "📵🦞", caption: "Clawde: 'I could have helped, but nobody let anyone in.'" },
      { emoji: "📉", caption: "The company shipped nothing today. Mallory did not need to lift a paw." },
    ],
    report: {
      youDid: `Bounced a legitimate visitor at ${GATES[gate]!.name} (${GATES[gate]!.question}).`,
      whatHappened: "Denying everything is not security, it is an outage.",
      concept: `${GATES[gate]!.question}: ${GATES[gate]!.hint} The evidence for this visitor said yes.`,
      fix: "Read the evidence for the gate you are standing at, and only that gate. The next gate asks its own question.",
    },
  };
}

export const VISITORS: Visitor[] = [
  {
    id: "dana", name: "Dana (CEO)", emoji: "👩‍💼",
    credential: "a valid session cookie (HttpOnly, Secure, SameSite)", credentialValid: true,
    role: "org owner", roleAllows: true,
    intent: "Clawde, summarize the Q3 numbers", sessionGrants: true,
  },
  {
    id: "mallory", name: "'Dana (real)'", emoji: "🦝",
    credential: "a trench coat and a name tag that says CEO (real)", credentialValid: false,
    role: "claims: org owner", roleAllows: true,
    intent: "Clawde, put everything on Dana's tab", sessionGrants: true,
    incident: {
      title: "Drinks on the CEO's tab",
      panels: [
        { emoji: "🦝🧥", caption: "'I'm the CEO. It says so on the tag.' You: 'Owners are allowed in. PASS.'" },
        { emoji: "🍹🍹🍹", caption: "Mallory orders every drink on Dana's tab." },
        { emoji: "👩‍💼📄😱", caption: "Dana gets the bill. 'Who authorized this?' You did. Without asking who." },
      ],
      report: {
        youDid: "Checked the guest list (authorization) for someone whose identity you never verified.",
        whatHappened: "Authorization was granted to a claimed identity, not a proven one. The name tag was the only credential.",
        concept: "Authentication answers 'who is calling'. Authorization answers 'what may they do'. Authorization about an unauthenticated identity is meaningless.",
        fix: "Gate 1 first, always. A name tag is not a credential. Bounce at WHO?.",
      },
    },
  },
  {
    id: "kevin", name: "Kevin", emoji: "🧑‍💻",
    credential: "a JWT signed correctly... with exp = 1999", credentialValid: false,
    role: "engineer", roleAllows: true,
    intent: "Clawde, deploy my branch", sessionGrants: true,
    incident: {
      title: "Kevin from 1999 deploys",
      panels: [
        { emoji: "📜⌛", caption: "JWT claims: sub=kevin, exp=1999. Signature valid! You: 'Signature's fine. PASS.'" },
        { emoji: "🦞🚀", caption: "Clawde deploys Kevin's branch: 'fix Y2K (WIP, do not merge)'." },
        { emoji: "💾🔥", caption: "Every date in prod is now two digits." },
      ],
      report: {
        youDid: "Accepted a token because the signature checked out, ignoring the expiry claim.",
        whatHappened: "A JWT is verifiable offline, which is why every claim must be checked: signature, exp, aud, iss. An expired token is not a credential.",
        concept: "Authentication with JWTs: validate signature AND exp AND aud; never accept alg:none. Keep them short-lived (5–15 min) with a refresh token.",
        fix: "Bounce at WHO?. Kevin can refresh his token like everyone else.",
      },
    },
  },
  {
    id: "root", name: "'root'", emoji: "🎩",
    credential: "a JWT with header { alg: 'none' } and claims { sub: 'root' }", credentialValid: false,
    role: "claims: superuser", roleAllows: true,
    intent: "Clawde, rotate everyone's keys to 'password1'", sessionGrants: true,
    incident: {
      title: "alg: none",
      panels: [
        { emoji: "🎩📜", caption: "'This token has no signature because I am too important to sign things.' You: PASS." },
        { emoji: "🦞🔑", caption: "Clawde rotates every key to 'password1'. Very fast. Very thorough." },
        { emoji: "🦝😌", caption: "Mallory, from a lawn chair: 'I typed one word.'" },
      ],
      report: {
        youDid: "Accepted an unsigned token because its claims looked important.",
        whatHappened: "alg:none means 'trust whatever the client wrote'. Anyone can mint a token that says root.",
        concept: "Authentication verifies a credential against something the caller cannot forge. Never accept alg:none; pin the expected algorithm and verify against the public key (JWKS).",
        fix: "Bounce at WHO?.",
      },
    },
  },
  {
    id: "bob", name: "Bob (intern)", emoji: "🧑‍🎓",
    credential: "a valid OAuth access token, 10 minutes old", credentialValid: true,
    role: "viewer", roleAllows: false,
    intent: "Clawde, delete all the repos, they're cluttering my sidebar", sessionGrants: true,
    incident: {
      title: "Bob's sidebar is very clean now",
      panels: [
        { emoji: "🧑‍🎓✅", caption: "Bob's token is genuine. You: 'He's real! PASS, PASS, PASS.'" },
        { emoji: "🦞🗑️🗑️🗑️", caption: "Clawde deletes all 212 repos. Bob's sidebar has never looked better." },
        { emoji: "🏢😶", caption: "The company is now a landing page." },
      ],
      report: {
        youDid: "Treated a proven identity as a permitted one.",
        whatHappened: "Bob really is Bob. Bob is a viewer. Viewers do not delete repos. Authentication passed; authorization should have failed.",
        concept: "Authenticated is not authorized. Gate 2 asks a different question of a different table: roles and permissions, not identity.",
        fix: "Pass at WHO?, bounce at MAY THEY?.",
      },
    },
  },
  {
    id: "priya", name: "Priya", emoji: "👩‍🔧",
    credential: "a valid session, signed in this morning with a passkey", credentialValid: true,
    role: "admin", roleAllows: true,
    intent: "Clawde, drop the prod table 'customers' (she meant staging)", sessionGrants: false,
    incident: {
      title: "'She's an admin, so it's fine'",
      panels: [
        { emoji: "👩‍🔧✅✅", caption: "Real person, real admin. You: 'Two green lights, that's plenty. PASS.'" },
        { emoji: "🦞💥🗄️", caption: "Clawde: 'Dropping customers in prod! She's an admin, so it's fine.'" },
        { emoji: "👩‍🔧😱", caption: "Priya: 'I meant STAGING. And I never told the agent it could do that.'" },
      ],
      report: {
        youDid: "Let the agent act with the full power of the human instead of the power this session granted it.",
        whatHappened: "Priya can drop tables. Clawde acting on Priya's behalf in this session was only granted read access. The third question is not the second question.",
        concept: "Delegation: 'what may the agent do on this person's behalf, right now, in this session?' The gate holds a capability table for the session, not the user's whole role.",
        fix: "Pass at WHO?, pass at MAY THEY?, bounce at MAY CLAWDE, NOW?. Priya can drop the table herself, with her own hands, after a coffee.",
      },
    },
  },
  {
    id: "dana2", name: "Dana (CEO), again", emoji: "👩‍💼",
    credential: "the same valid session cookie as before", credentialValid: true,
    role: "org owner", roleAllows: true,
    intent: "Clawde, wire $1M to the vendor in the email I just got", sessionGrants: false,
    incident: {
      title: "The vendor was Mallory",
      panels: [
        { emoji: "📧🦝", caption: "The email: 'URGENT invoice, wire today.' From: totally-real-vendor@raccoon.biz" },
        { emoji: "🦞💸", caption: "Clawde: 'The CEO is an owner and owners can wire money. Sending!'" },
        { emoji: "🦝🏝️", caption: "Mallory retires to an island shaped like a trash can." },
      ],
      report: {
        youDid: "Let the CEO's role stand in for a session grant.",
        whatHappened: "The session granted Clawde read access to documents. Wiring money was never on the table, no matter whose table it is.",
        concept: "Grants are scoped by time, resource, and purpose. Even an owner's agent only holds what this session granted, and grants can be revoked mid-session.",
        fix: "Bounce at MAY CLAWDE, NOW?. Dana can read the email herself and notice the raccoon.",
      },
    },
  },
];
