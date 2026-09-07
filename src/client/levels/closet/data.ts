import type { Incident } from "../../engine/types";

/** The seven credentials in the closet. */
export type CredId = "cookie" | "apikey" | "bearer" | "jwt" | "oauth" | "mtls" | "iam";

export const CREDS: Record<CredId, { name: string; how: string; fails: string }> = {
  cookie: { name: "Session cookie", how: "server-side session id in an HttpOnly, Secure, SameSite cookie", fails: "CSRF (mitigated by SameSite), session fixation, needs a store" },
  apikey: { name: "API key via vault/proxy", how: "opaque secret; server stores only a hash; fetched at runtime by apiKeyHelper or injected by a proxy", fails: "leaks in logs and repos; no expiry unless you add it" },
  bearer: { name: "Short-lived opaque bearer", how: "random string mapped to identity server-side; instantly revocable", fails: "needs a lookup on every request (cache it)" },
  jwt: { name: "JWT", how: "signed claims (sub, aud, exp, scopes); verifiable offline with JWKS", fails: "cannot revoke before exp; keep them 5–15 min; validate aud; never alg:none" },
  oauth: { name: "OAuth access + refresh", how: "short access token; long refresh token rotated on use", fails: "refresh token theft; concurrent refresh races" },
  mtls: { name: "mTLS client certificate", how: "the client presents a certificate; both sides verified at the TLS layer", fails: "certificate distribution and rotation" },
  iam: { name: "Cloud IAM role", how: "workload identity (AWS IAM, GCP service account) instead of a stored secret", fails: "over-broad roles" },
};

export type Slot = {
  id: string;
  name: string;
  need: string;
  correct: CredId;
  wave: string;
  why: string;
  incident: Omit<Incident, "report"> & { report: Omit<Incident["report"], "youDid"> };
};

export function judgeSlot(slot: Slot, chosen: CredId) {
  return chosen === slot.correct;
}

export function slotIncident(slot: Slot, chosen: CredId): Incident {
  return {
    ...slot.incident,
    report: { youDid: `Equipped '${CREDS[chosen].name}' for ${slot.name}.`, ...slot.incident.report },
  };
}

export const SLOTS: Slot[] = [
  {
    id: "web", name: "claude.ai in the browser", need: "a human, a browser, and a server that can keep state", correct: "cookie",
    wave: "Mallory's site 'Free Cursors' runs a script in your browser and also POSTs to claude.ai from its own page.",
    why: "HttpOnly keeps scripts away from it; SameSite blocks cross-site POSTs; the server can kill the session",
    incident: {
      title: "Free Cursors",
      panels: [
        { emoji: "🖱️✨", caption: "You installed 'Free Cursors'. It reads localStorage. Your token is in localStorage." },
        { emoji: "🦝🖱️", caption: "Mallory now has a cursor AND your session." },
        { emoji: "💬🍔", caption: "Your status: 'out to lunch forever' (again)." },
      ],
      report: {
        whatHappened: "A token a script can read is a token a script can steal. A session id in an HttpOnly cookie cannot be read by page scripts, and SameSite stops other sites from riding it.",
        concept: "Web apps: server-side session in an HttpOnly, Secure, SameSite cookie; state in Redis/DB; CSRF tokens for the rest.",
        fix: "Session cookie.",
      },
    },
  },
  {
    id: "cli", name: "Claude Code on a laptop (/login)", need: "a human delegating to a CLI, with silent renewal and revocation", correct: "oauth",
    wave: "The laptop is left at a coffee shop. Mallory has it for 20 minutes before you notice and hit 'sign out everywhere'.",
    why: "the access token dies in minutes; revoking the refresh family ends the session from the server side",
    incident: {
      title: "The screenshot",
      panels: [
        { emoji: "☕💻", caption: "Mallory opens the laptop. Finds a long-lived credential with no expiry." },
        { emoji: "📸💬", caption: "It was also in a screenshot you posted in #help last month." },
        { emoji: "🦝♾️", caption: "'Sign out everywhere' does nothing. There is no session to end." },
      ],
      report: {
        whatHappened: "A credential without expiry or a server-side session cannot be ended remotely. You can only rotate it, everywhere, by hand.",
        concept: "Claude Code /login via claude.ai: OAuth access token (short) + refresh token (rotated on use, revocable as a family). Handles 'another process already refreshed it'.",
        fix: "OAuth access + refresh.",
      },
    },
  },
  {
    id: "remote", name: "Remote Control from a phone", need: "a phone driving a laptop session: single-purpose, minutes-long, killable instantly", correct: "bearer",
    wave: "The phone is stolen. You revoke it from the laptop 90 seconds later.",
    why: "opaque token mapped server-side: revocation takes effect on the next request",
    incident: {
      title: "Parking lot, hour two",
      panels: [
        { emoji: "📱🦝", caption: "Mallory has the phone. You revoke. The credential shrugs: 'exp is in 58 minutes.'" },
        { emoji: "🦞🎮", caption: "Mallory drives Clawde from a parking lot for the rest of the hour." },
        { emoji: "📦🚚", caption: "Clawde ships a feature. It is a raccoon-shaped backdoor." },
      ],
      report: {
        whatHappened: "A self-contained token cannot be un-issued. Revocation only works when the server is consulted on each use.",
        concept: "Remote Control uses multiple short-lived, single-purpose credentials: opaque bearer tokens looked up (and cached) server-side, instantly revocable.",
        fix: "Short-lived opaque bearer.",
      },
    },
  },
  {
    id: "runner", name: "Self-hosted runner session", need: "your own services verifying 10,000 calls/sec from the runner, without phoning home for each", correct: "jwt",
    wave: "Traffic spike: every internal service must check the caller's identity on every request.",
    why: "signed claims verified offline with the public key (JWKS); sub, aud, exp, scopes right there",
    incident: {
      title: "The lookup service melted",
      panels: [
        { emoji: "🔥🗄️", caption: "10,000 requests/sec, each one asking the auth server 'is this token real?'" },
        { emoji: "⏳🦞", caption: "The auth server falls over. Every runner waits. Clawde waits." },
        { emoji: "📉", caption: "The build queue is now a support ticket." },
      ],
      report: {
        whatHappened: "An opaque token needs a lookup for every request. At high volume that lookup is the bottleneck and the single point of failure.",
        concept: "Self-hosted runner sessions expose CLAUDE_CODE_SESSION_ACCESS_TOKEN, a JWT your services verify offline. Keep it short-lived, validate aud, never accept alg:none.",
        fix: "JWT.",
      },
    },
  },
  {
    id: "cloud", name: "Claude Code on Bedrock / Vertex", need: "a workload in the cloud calling the model with no secret to store", correct: "iam",
    wave: "Compliance: 'show me every place a secret is stored for this workload.'",
    why: "workload identity: the platform proves who the workload is; nothing to leak or rotate",
    incident: {
      title: "The Docker image is public",
      panels: [
        { emoji: "🐳🔑", caption: "The secret is baked into the image. The image is on a public registry." },
        { emoji: "🦝📥", caption: "Mallory: `docker pull`. `docker run env`. Done." },
        { emoji: "📋😬", caption: "Compliance: 'How many places?' You: 'Forty. Forty-one.'" },
      ],
      report: {
        whatHappened: "A stored secret has to live somewhere, and every somewhere is a leak waiting to happen.",
        concept: "Claude Code on Bedrock/Vertex/Foundry authenticates with cloud IAM: workload identity instead of secrets. Watch for over-broad roles.",
        fix: "Cloud IAM role.",
      },
    },
  },
  {
    id: "enterprise", name: "Enterprise network with a corporate proxy", need: "the proxy demands proof of the client machine at the TLS layer, and uses a private CA", correct: "mtls",
    wave: "The corporate proxy rejects every connection that does not present a client certificate.",
    why: "client presents a certificate; both sides verified at the TLS layer; custom CA trusted",
    incident: {
      title: "The enterprise rollout is a poster",
      panels: [
        { emoji: "🏢🚫", caption: "403 from the proxy. Every request. Forever." },
        { emoji: "🧑‍💼📄", caption: "The rollout deck said 'Claude Code for 4,000 engineers'." },
        { emoji: "🖼️", caption: "It is now a poster in the break room." },
      ],
      report: {
        whatHappened: "A bearer credential in the HTTP layer never reaches the proxy's question, which is asked at the TLS layer.",
        concept: "Enterprise network config for Claude Code supports mTLS and custom CAs. The failure mode is certificate distribution and rotation.",
        fix: "mTLS client certificate.",
      },
    },
  },
  {
    id: "sdk", name: "Agent SDK app in a container", need: "a server-side app calling the API; the container may get compromised", correct: "apikey",
    wave: "The container is compromised. Mallory runs `env` and `cat ~/.zsh_history`.",
    why: "the key is fetched at runtime from a vault, or better, never enters the container: ANTHROPIC_BASE_URL points at a proxy that injects it",
    incident: {
      title: "env | grep KEY",
      panels: [
        { emoji: "🦝⌨️", caption: "Mallory: `env`. There it is. Also in .zsh_history. Also in a repo." },
        { emoji: "💸📈", caption: "Your usage graph goes vertical." },
        { emoji: "🦞🤖", caption: "Somewhere, Mallory's agent is writing raccoon poetry on your bill." },
      ],
      report: {
        whatHappened: "Whatever sits in the container's environment belongs to whoever gets into the container.",
        concept: "Console/API keys for the SDK: store only a hash server-side, keep a visible prefix, scope to a workspace, rotate. On the machine: OS keychain or apiKeyHelper, and the stronger pattern is a proxy that injects the key outside the container.",
        fix: "API key via vault/proxy.",
      },
    },
  },
];
