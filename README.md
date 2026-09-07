# Gatekeeper

A browser game for learning authentication, authorization, and the agent permission gate: the material in "Auth, identity, and authorization models" from the Claude Code / Claude Science systems-design notes.

You are the gatekeeper at Lobster Labs. Clawde the AI intern does exactly what the gate lets him do. Mallory the raccoon wants his keys. Get a sequence or a choice wrong and something hilarious happens; each incident ends with a one-paragraph report naming the concept and the real fix. Three incidents in a shift and the pager fires.

Play it: https://gatekeeper-production-70e6.up.railway.app

## Shifts

| Shift | Teaches | Mechanic |
| --- | --- | --- |
| 1. The Velvet Rope | authentication vs authorization vs delegation | stamp visitors through three gates, one question each |
| 2. The Credential Closet | which credential, its failure mode, where it belongs | equip seven services, then Mallory attacks each door |
| 3. The PKCE Dance | OAuth 2.1 auth code + PKCE, device code, refresh rotation | order the flow with decoy cards; pick the grant; handle a replay |
| 4. The Zoning Office | RBAC, ABAC, ReBAC, capabilities, allow/deny lists | permit buildings by policy shape; delegate and revoke capabilities |
| 5. THE GATE | the layered permission gate and its precedence | assemble the eight layers, then route tool calls through them |
| 6. The Villain Lineup | prompt injection, confused deputy, exfiltration, SSRF, replay, localhost CSRF | play the mitigation card before the attack lands |
| Boss | Worksheet 2, spoken in under two minutes | assemble five answers from fragments against a timer |

## Run it

```
bun install
bun run dev        # builds the client, serves on http://localhost:3000
bun test           # the rules of every shift are pure functions with tests
bun run typecheck
```

## How it is built

Bun, React, Hono. No game engine, no drag-and-drop library, no assets: emoji and CSS keyframes.

- `src/client/engine/` is shared by every shift: a hook for lives, score, transcript, and incidents; the comic-strip incident overlay; a queue that releases items over time; a click-to-place sequencer; a multiple-choice panel.
- `src/client/levels/<shift>/data.ts` holds the rules and every line of incident copy. `Board.tsx` next to it is the thin React view.
- `src/server/index.ts` serves the static files and a health check. There is no API and no secret.
- Progress lives in the browser's localStorage.

Deploys to Railway from `main` using the Dockerfile.
