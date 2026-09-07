import type { Incident } from "../../engine/types";
import type { Option } from "../../engine/Choice";

/** Round 1: the authorization code + PKCE flow, plus decoys Mallory would love. */
export type Step = { id: string; lane: string; text: string; decoy?: boolean };

export const STEPS: Step[] = [
  { id: "verifier", lane: "CLI", text: "generate code_verifier; challenge = S256(verifier)" },
  { id: "open", lane: "CLI → Browser", text: "open /authorize?client_id&redirect_uri=localhost:port&code_challenge&state" },
  { id: "consent", lane: "Browser → Auth", text: "user signs in and consents" },
  { id: "redirect", lane: "Auth → Browser", text: "302 redirect to localhost:port/callback?code&state" },
  { id: "callback", lane: "Browser → CLI", text: "CLI receives code (checks state; or the user pastes the code)" },
  { id: "exchange", lane: "CLI → Auth", text: "POST /token with code + code_verifier" },
  { id: "tokens", lane: "Auth → CLI", text: "access_token (short-lived) + refresh_token" },
  { id: "store", lane: "CLI", text: "store tokens in the OS keychain" },
  { id: "bearer", lane: "CLI → API", text: "Authorization: Bearer access_token" },
  { id: "verify", lane: "API", text: "verify signature, expiry, aud; check scopes" },
  // decoys
  { id: "secret", lane: "CLI → Auth", text: "send the client_secret baked into the CLI binary", decoy: true },
  { id: "plain", lane: "CLI", text: "store tokens in ~/.tokens.txt for convenience", decoy: true },
  { id: "skipverifier", lane: "CLI → Auth", text: "POST /token with just the code (the verifier is extra work)", decoy: true },
  { id: "clientcreds", lane: "CLI → Auth", text: "use the client credentials grant; the CLI is a machine after all", decoy: true },
];

export const DANCE: string[] = ["verifier", "open", "consent", "redirect", "callback", "exchange", "tokens", "store", "bearer", "verify"];

const DANCE_TEXT = "verifier → open /authorize with the challenge → user consents → 302 with code → CLI gets the code → POST /token with code + verifier → tokens → keychain → Bearer to the API → API verifies.";

export function checkDance(order: (string | null)[]): { ok: true } | { ok: false; incident: Incident } {
  if (order.every((id, i) => id === DANCE[i])) return { ok: true };
  if (order.includes("skipverifier") || !order.includes("verifier") || !order.includes("exchange")) return { ok: false, incident: DANCE_INCIDENTS.noVerifier };
  if (order.includes("plain")) return { ok: false, incident: DANCE_INCIDENTS.plaintext };
  if (order.includes("clientcreds")) return { ok: false, incident: DANCE_INCIDENTS.clientCreds };
  if (order.includes("secret")) return { ok: false, incident: DANCE_INCIDENTS.bakedSecret };
  if (order.includes(null)) return { ok: false, incident: DANCE_INCIDENTS.missingStep };
  return { ok: false, incident: DANCE_INCIDENTS.outOfStep };
}

const DANCE_INCIDENTS = {
  noVerifier: {
    title: "Mallory caught the code on the redirect",
    panels: [
      { emoji: "🦝👀", caption: "The redirect flies past: /callback?code=abc123. Mallory: 'Don't mind if I do.'" },
      { emoji: "🦝📮", caption: "She POSTs the code to /token. No verifier needed. Tokens arrive." },
      { emoji: "💬🍔", caption: "Mallory, logged in as you, sets your Slack status to 'out to lunch forever'." },
    ],
    report: {
      youDid: "Redeemed the authorization code without the code_verifier.",
      whatHappened: "Anyone who sees the code can redeem it. The code travels through a browser and a localhost redirect, which are not private.",
      concept: "PKCE: the CLI hashes a secret (code_challenge) up front and reveals the secret (code_verifier) at the token exchange. It proves the party redeeming the code is the one that started the flow, so a public client needs no client secret. OAuth 2.1 makes it mandatory.",
      fix: DANCE_TEXT,
    },
  },
  plaintext: {
    title: "Mallory reads ~/.tokens.txt out loud",
    panels: [
      { emoji: "📄🔑", caption: "~/.tokens.txt: access=eyJ... refresh=rt_... (chmod 644)" },
      { emoji: "🦝🎤", caption: "Mallory, at open mic night, reads your refresh token to a crowd." },
      { emoji: "👏😭", caption: "It gets a standing ovation. Your session lasts forever, for everyone." },
    ],
    report: {
      youDid: "Stored tokens in a plaintext file.",
      whatHappened: "Refresh tokens are long-lived. A readable file is a permanent session for whoever reads it, including every npm package you ever installed.",
      concept: "Secret storage on a developer machine: prefer the OS keychain; fall back to a 0600 file; never the shell history or a repo. Stronger: keep the key out of the environment and let a proxy inject it.",
      fix: DANCE_TEXT,
    },
  },
  clientCreds: {
    title: "A robot with no owner",
    panels: [
      { emoji: "🤖🪪", caption: "The CLI logs in as itself. No user anywhere in the flow." },
      { emoji: "🍴🍴🍴", caption: "It forks 400 repos. Whose? The audit log says: 'the CLI'." },
      { emoji: "🕵️🤷", caption: "Nobody can tell who did what. Everyone did everything." },
    ],
    report: {
      youDid: "Used the client credentials grant for a human login.",
      whatHappened: "Client credentials are machine identity. There is no resource owner, so nothing can be scoped to a person and nothing can be attributed to one.",
      concept: "OAuth is delegation: a client gets limited access on a user's behalf. A CLI acting for a user uses authorization code + PKCE. Client credentials are for service-to-service with no user.",
      fix: DANCE_TEXT,
    },
  },
  bakedSecret: {
    title: "Everyone's secret",
    panels: [
      { emoji: "📦🔍", caption: "Mallory runs `strings gatekeeper-cli | grep secret`. Takes four seconds." },
      { emoji: "🌍🔑", caption: "Every copy of the CLI shares one secret. Now Mallory's copy is 'official' too." },
      { emoji: "🦝🎭", caption: "She registers a fake CLI. Users log into it. It looks identical." },
    ],
    report: {
      youDid: "Shipped a client_secret inside a public client.",
      whatHappened: "A CLI or desktop app cannot keep a secret. Anything in the binary belongs to everyone who has the binary.",
      concept: "Public clients have no secret. PKCE replaces the secret with a per-flow proof.",
      fix: DANCE_TEXT,
    },
  },
  missingStep: {
    title: "A step is missing",
    panels: [
      { emoji: "🕺❓", caption: "The dance stops halfway. Everyone stares." },
      { emoji: "🔑💨", caption: "Tokens never arrive, or arrive and are never verified." },
      { emoji: "🦝📸", caption: "Mallory takes notes." },
    ],
    report: {
      youDid: "Left a slot empty.",
      whatHappened: "Each step protects a specific handoff: state against CSRF, verifier against code theft, verification against forged tokens.",
      concept: "Authorization code + PKCE, all ten steps.",
      fix: DANCE_TEXT,
    },
  },
  outOfStep: {
    title: "The dance is out of step",
    panels: [
      { emoji: "🕺🩰", caption: "Right steps, wrong order. The browser trips over the API." },
      { emoji: "🔑⏰", caption: "The CLI presents a token it has not received yet." },
      { emoji: "🦝🤔", caption: "Mallory: 'I didn't even have to do anything.'" },
    ],
    report: {
      youDid: "Arranged the steps in the wrong order.",
      whatHappened: "Each message depends on the one before: the challenge must be sent before the code is issued, the verifier before the tokens.",
      concept: "Authorization code + PKCE, in order.",
      fix: DANCE_TEXT,
    },
  },
} satisfies Record<string, Incident>;

/** Round 2: the laptop is in a datacenter. No browser. Which grant? */
export const GRANT_OPTIONS: Option[] = [
  { id: "device", label: "Device code", detail: "CLI shows a URL and a short code; the user enters it on their phone; CLI polls /token.", correct: true, why: "headless box, user present elsewhere: device code" },
  { id: "authcode", label: "Authorization code + PKCE", detail: "Open the browser… which does not exist here.", why: "no browser on this box",
    incident: {
      title: "xdg-open: command not found",
      panels: [
        { emoji: "🖥️🚫🌐", caption: "The CLI tries to open a browser on a rack in Virginia." },
        { emoji: "⏳⏳", caption: "It waits for a redirect that will never come." },
        { emoji: "🦞😴", caption: "Clawde waits with it. Solidarity." },
      ],
      report: {
        youDid: "Picked a browser-redirect flow on a machine with no browser.",
        whatHappened: "Auth code + PKCE needs somewhere to render the login page and somewhere to catch the redirect.",
        concept: "Device code grant: the user visits a URL on another device and enters a short code. Claude Code's 'paste the OAuth code' fallback is the same idea.",
        fix: "Pick device code.",
      },
    } },
  { id: "creds", label: "Client credentials", detail: "The server is a machine. Machines use client credentials, right?", why: "there is a human here; this is delegation",
    incident: {
      title: "The rack has a personality now",
      panels: [
        { emoji: "🖥️🪪", caption: "The server logs in as 'the server'." },
        { emoji: "🧑‍💻❓", caption: "You SSH in and run a command. The audit log credits… the server." },
        { emoji: "🦝🖥️", caption: "So does Mallory, when she SSHes in. Same identity. Same everything." },
      ],
      report: {
        youDid: "Used machine identity for a session with a human at the keyboard.",
        whatHappened: "Client credentials have no resource owner, so every human sharing the box becomes the same principal.",
        concept: "Delegation needs a user in the loop. Headless plus a user equals device code.",
        fix: "Pick device code.",
      },
    } },
  { id: "password", label: "Ask for the password", detail: "Just type your claude.ai password into the SSH session.", why: "handing passwords to clients is what OAuth exists to avoid",
    incident: {
      title: "Password in the shell history",
      panels: [
        { emoji: "⌨️🔑", caption: "`login --password hunter2`. It works! It is also in ~/.bash_history." },
        { emoji: "🦝📜", caption: "Mallory: `cat ~/.bash_history`. Also works." },
        { emoji: "🔓🌍", caption: "That password was reused on the bank." },
      ],
      report: {
        youDid: "Collected the user's password in a client.",
        whatHappened: "The client now holds the master credential instead of a scoped, revocable token.",
        concept: "OAuth is delegation so clients never see passwords. Tokens are scoped, short-lived, and revocable; passwords are none of those.",
        fix: "Pick device code.",
      },
    } },
];

/** Round 3: refresh token R1 was just used a second time. */
export const REPLAY_OPTIONS: Option[] = [
  { id: "revoke", label: "Revoke the whole token family", detail: "Invalidate every token descended from this login. Force re-login.", correct: true, why: "a replayed refresh token means theft; revoke the family" },
  { id: "reissue", label: "Issue fresh tokens again", detail: "It's still a valid refresh token, technically.", why: "reuse is the theft signal",
    incident: {
      title: "Two of you, forever",
      panels: [
        { emoji: "🔄🔄", caption: "R1 used twice. You mint new tokens both times. Everyone's happy!" },
        { emoji: "🦝📝", caption: "Mallory has a refresh token that never dies. She renames every repo to mallory-was-here." },
        { emoji: "🧑‍💻🤝🦝", caption: "You and Mallory, sharing an account, indefinitely." },
      ],
      report: {
        youDid: "Honored a refresh token that had already been rotated.",
        whatHappened: "Rotation means each refresh token is single-use. A second use means two parties hold it, and one of them is not you.",
        concept: "Rotate refresh tokens on use; detect reuse; a replayed refresh token means theft, so revoke the entire family.",
        fix: "Revoke the family. The real user logs in again; Mallory does not.",
      },
    } },
  { id: "ignore", label: "Ignore it", detail: "Probably a retry. Networks are flaky.", why: "reuse detection exists to catch exactly this",
    incident: {
      title: "'Probably a retry'",
      panels: [
        { emoji: "🤷📡", caption: "'Networks are flaky.' Second use approved." },
        { emoji: "🦝🌴", caption: "Mallory refreshes daily from a beach for eleven months." },
        { emoji: "📊📉", caption: "The breach report has a chart. The chart is a straight line up." },
      ],
      report: {
        youDid: "Dismissed a reuse signal.",
        whatHappened: "Refresh token reuse is the one moment the server can tell a thief from a user.",
        concept: "Detect reuse and revoke the family. Short access tokens (5–15 min) limit what the thief keeps in the meantime.",
        fix: "Revoke the family.",
      },
    } },
  { id: "extend", label: "Extend the access token to 30 days", detail: "Fewer refreshes, fewer problems.", why: "longer tokens widen the theft window",
    incident: {
      title: "Thirty-day tokens",
      panels: [
        { emoji: "📜📅", caption: "exp: next month. No refresh needed. So relaxing." },
        { emoji: "🧑‍💻🚪", caption: "Kevin is offboarded on day 2." },
        { emoji: "🦞🎨", caption: "Kevin's token deploys Comic Sans to prod on day 29. Nobody can revoke a JWT early." },
      ],
      report: {
        youDid: "Made access tokens long-lived to avoid dealing with refresh.",
        whatHappened: "A JWT cannot be revoked before exp without a deny-list. Long tokens turn every leak and every offboarding into a month-long problem.",
        concept: "Keep access tokens short (5–15 min), pair with a rotated refresh token, keep a short deny-list for emergencies.",
        fix: "Revoke the family; keep tokens short.",
      },
    } },
];
