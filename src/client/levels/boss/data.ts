/** Worksheet 2: five lines you should be able to say in under two minutes. */
export type Fragment = { id: string; text: string; correct: boolean };
export type Line = { id: string; prompt: string; fragments: Fragment[] };

export const TIME_LIMIT_S = 120;
export const HMM_PENALTY_S = 10;

export function lineDone(line: Line, picked: string[]) {
  return line.fragments.filter((f) => f.correct).every((f) => picked.includes(f.id));
}

export const LINES: Line[] = [
  {
    id: "login", prompt: "Login flow: grant type, redirect, fallback when no browser?",
    fragments: [
      { id: "l1", text: "authorization code + PKCE (public client, no secret)", correct: true },
      { id: "l2", text: "redirect to a localhost callback, state checked", correct: true },
      { id: "l3", text: "device code, or paste the code, when there is no browser", correct: true },
      { id: "l4", text: "client credentials", correct: false },
      { id: "l5", text: "ask for the user's password", correct: false },
      { id: "l6", text: "the implicit grant", correct: false },
    ],
  },
  {
    id: "tokens", prompt: "Token lifetimes and storage location?",
    fragments: [
      { id: "t1", text: "access token 5–15 minutes", correct: true },
      { id: "t2", text: "refresh token rotated on use; reuse revokes the family", correct: true },
      { id: "t3", text: "OS keychain, else a 0600 file; never shell history or a repo", correct: true },
      { id: "t4", text: "30-day access tokens so nobody has to refresh", correct: false },
      { id: "t5", text: "~/.tokens.txt", correct: false },
      { id: "t6", text: "an environment variable in the Dockerfile", correct: false },
    ],
  },
  {
    id: "enterprise", prompt: "What the enterprise version changes: IdP, gateway, IAM?",
    fragments: [
      { id: "e1", text: "SSO via SAML/OIDC with the IdP; SCIM provisioning; domain capture", correct: true },
      { id: "e2", text: "an LLM gateway with OIDC and per-group model access; mTLS and custom CAs", correct: true },
      { id: "e3", text: "cloud IAM roles on Bedrock/Vertex/Foundry instead of stored keys", correct: true },
      { id: "e4", text: "managed settings that outrank user settings", correct: true },
      { id: "e5", text: "one shared API key for the whole company", correct: false },
      { id: "e6", text: "Kerberos ticket schema design", correct: false },
    ],
  },
  {
    id: "gate", prompt: "Permission gate layers, in order, with the enforcement point of each?",
    fragments: [
      { id: "g1", text: "managed deny (server / MDM)", correct: true },
      { id: "g2", text: "user/project deny, then PreToolUse hooks (harness / your code)", correct: true },
      { id: "g3", text: "allow rules, then sandbox auto-allow (harness / OS)", correct: true },
      { id: "g4", text: "mode default, then classifier (harness / a model)", correct: true },
      { id: "g5", text: "human last (a person; 5-minute default action)", correct: true },
      { id: "g6", text: "classifier first, it is the smartest layer", correct: false },
      { id: "g7", text: "the system prompt says no", correct: false },
    ],
  },
  {
    id: "repo", prompt: "The one thing repo content is allowed to do to permissions?",
    fragments: [
      { id: "r1", text: "reduce privilege: turn a feature off, never on", correct: true },
      { id: "r2", text: "enable Remote Control for whoever clones it", correct: false },
      { id: "r3", text: "add allow rules for itself", correct: false },
      { id: "r4", text: "nothing, repo settings are ignored entirely", correct: false },
    ],
  },
];
