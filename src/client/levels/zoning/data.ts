import type { Incident } from "../../engine/types";
import type { Option } from "../../engine/Choice";

export type ModelId = "rbac" | "abac" | "rebac" | "cap" | "rules";

export const MODELS: Record<ModelId, { name: string; idea: string }> = {
  rbac: { name: "RBAC", idea: "users have roles; roles have permissions. Simple, auditable, coarse." },
  abac: { name: "ABAC", idea: "policy over attributes of subject, resource, action, environment. Flexible, harder to audit." },
  rebac: { name: "ReBAC (Zanzibar-style)", idea: "permissions derived from a relation graph: user ∈ team, team owns project, project contains session." },
  cap: { name: "Capability-based", idea: "holding an unforgeable token IS the permission; grants are specific, delegable (attenuated), revocable." },
  rules: { name: "Allow/deny rule list", idea: "ordered patterns on (tool, argument); deny wins." },
};

export type Permit = { id: string; building: string; text: string; correct: ModelId; why: string; incident: Incident };

export function judgePermit(p: Permit, chosen: ModelId) {
  return chosen === p.correct;
}

export const PERMITS: Permit[] = [
  {
    id: "org", building: "🏢 Org HQ", text: "Owners can delete the org. Admins can manage billing. Members can do neither. That is the whole policy.",
    correct: "rbac", why: "three roles, a handful of permissions, easy to audit",
    incident: {
      title: "A policy engine to say 'admin'",
      panels: [
        { emoji: "🏢📜", caption: "Three roles. You deployed an attribute policy engine with 40 rules and a DSL." },
        { emoji: "🧑‍💼❓", caption: "Dana: 'Can I manage billing?' The engine: 'Evaluating 40 policies… depends on the time zone.'" },
        { emoji: "🧾🔥", caption: "The billing page is now a philosophy seminar." },
      ],
      report: {
        youDid: "Used a flexible model for a coarse, static policy.",
        whatHappened: "Flexibility you do not need is auditability you lose.",
        concept: "RBAC: users have roles, roles have permissions. Org owner vs admin vs member. Simple and auditable.",
        fix: "RBAC.",
      },
    },
  },
  {
    id: "hours", building: "☁️ Cloud Sessions", text: "Members may run cloud sessions on repos tagged 'internal', but only during business hours, and only from managed devices.",
    correct: "abac", why: "the decision depends on attributes of subject (member), resource (tag), and environment (time, device)",
    incident: {
      title: "The role avalanche",
      panels: [
        { emoji: "🏷️🕘", caption: "You made a role for every combination: member-internal-weekday-9to5-managed…" },
        { emoji: "🏔️📋", caption: "4,000 roles. Then daylight saving time happened." },
        { emoji: "🧑‍💼⛏️", caption: "The admin is buried under roles. Send help, and a smaller model." },
      ],
      report: {
        youDid: "Encoded attributes (time, tag, device) as roles.",
        whatHappened: "Roles multiply with every attribute. The policy was three sentences; the roles became a mountain.",
        concept: "ABAC: a policy over attributes of subject, resource, action, and environment. Flexible, harder to audit.",
        fix: "ABAC.",
      },
    },
  },
  {
    id: "share", building: "🤝 Shared Sessions", text: "Justin is in team Platform. Platform owns project Bench. Anyone in a team can view sessions in that team's projects, and artifacts published to the org are visible org-wide.",
    correct: "rebac", why: "permission follows a chain of relations: user ∈ team, team owns project, project contains session",
    incident: {
      title: "Ninety thousand roles",
      panels: [
        { emoji: "🧑‍🤝‍🧑📁", caption: "A role per (team, project) pair. Then per (team, project, session)." },
        { emoji: "🔢😵", caption: "90,000 roles. Someone joins a team. 300 role assignments. Someone leaves. Nobody remembers which 300." },
        { emoji: "🦝👀", caption: "Mallory still has view on Bench from a team she left in March." },
      ],
      report: {
        youDid: "Modeled a relation graph as a flat list of roles.",
        whatHappened: "Sharing and hierarchies are relationships. Flattening them loses the structure you need to revoke correctly.",
        concept: "ReBAC (Zanzibar-style): permissions derived from a relation graph. Right for sharing, hierarchies, org-wide publishing.",
        fix: "ReBAC.",
      },
    },
  },
  {
    id: "session", building: "🦞 Agent Session", text: "This session may read folder X and reach host Y. Any sub-agent it spawns inherits at most that. A grant can be revoked mid-session.",
    correct: "cap", why: "the session holds a capability table; delegation attenuates; revocation is per grant",
    incident: {
      title: "Clawde Jr. inherits 'admin'",
      panels: [
        { emoji: "🦞🎖️", caption: "You gave the session a role: 'admin'. Roles are not delegable in pieces." },
        { emoji: "👶🎖️", caption: "Clawde Jr. inherits… 'admin'. All of it." },
        { emoji: "⛵💳", caption: "The boat again. He named it 'RBAC'." },
      ],
      report: {
        youDid: "Gave the agent a role when it needed a specific, attenuable set of grants.",
        whatHappened: "A role is all-or-nothing; you cannot hand a child half a role. A capability table can be subsetted.",
        concept: "Capability-based: the right mental model for agent permission gates. A session holds a capability table (folders, hosts, connectors); spawned agents inherit a subset; a grant can be revoked mid-session.",
        fix: "Capability-based.",
      },
    },
  },
  {
    id: "tools", building: "🔧 Tool Rules", text: "Bash(npm test:*) is allowed. Read(./.env) is denied. If both match, deny wins.",
    correct: "rules", why: "ordered patterns on (tool, argument), deny wins: exactly Claude Code's permission rules",
    incident: {
      title: "A graph database for npm test",
      panels: [
        { emoji: "🔧🕸️", caption: "'Is npm test allowed?' You: 'Let me traverse the relation graph.'" },
        { emoji: "🐢💾", caption: "Zanzibar boots up. It needs a cluster. For a laptop." },
        { emoji: "🦞⏳", caption: "Clawde is still waiting to run the tests. It is Thursday." },
      ],
      report: {
        youDid: "Used a heavy model for two pattern rules.",
        whatHappened: "Pattern rules are deterministic and instant. That is the point of them.",
        concept: "Allow/deny rule lists: ordered patterns on (tool, argument); deny wins. Claude Code permission rules like Bash(npm test:*) and Read(./.env) deny.",
        fix: "Allow/deny rule list.",
      },
    },
  },
  {
    id: "laptop", building: "💻 One Laptop", text: "A single-user local tool on Justin's laptop. Nobody shares anything. Which tool decides what may run?",
    correct: "rules", why: "one user, one machine: rule lists (and capabilities for the session) are enough; graphs and roles are overkill",
    incident: {
      title: "You built Zanzibar for one guy",
      panels: [
        { emoji: "🧑‍💻🏗️", caption: "A globally consistent relation store. Three replicas. One user." },
        { emoji: "💻🔥", caption: "The laptop fan sounds like a jet." },
        { emoji: "🧑‍💻🤷", caption: "Justin: 'I just wanted to run npm test.'" },
      ],
      report: {
        youDid: "Chose a sharing-and-hierarchy model for a single-user tool.",
        whatHappened: "ReBAC and heavy RBAC solve multi-user problems. A local tool has one user.",
        concept: "ReBAC is overkill for a single-user local tool. Rule lists plus a session capability table cover it.",
        fix: "Allow/deny rule list.",
      },
    },
  },
];

/** Round 2: the capability sub-mechanic. Delegation attenuates; revocation propagates. */
export const SPAWN_OPTIONS: Option[] = [
  { id: "subset", label: "Read(src/**) + Bash(npm test:*)", detail: "A subset of what Clawde holds, enough to run tests.", correct: true, why: "sub-agents inherit a subset, never a superset" },
  { id: "asked", label: "Exactly what Junior asked for", detail: "Bash(*) + Read(**). He knows what he needs.", why: "a superset of the parent",
    incident: {
      title: "Junior knows what he needs",
      panels: [
        { emoji: "👶📋", caption: "Junior asks for Bash(*). Clawde only has Bash(npm test:*). You: 'Sure.'" },
        { emoji: "👶💪🦞", caption: "The child now outranks the parent." },
        { emoji: "⛵", caption: "Boat." },
      ],
      report: {
        youDid: "Granted a spawned agent more than its parent holds.",
        whatHappened: "Delegation that can escalate is not delegation, it is a privilege-escalation feature.",
        concept: "Capabilities attenuate on delegation: a child receives at most the parent's set, and its calls flow through the same gate.",
        fix: "Grant a subset.",
      },
    } },
  { id: "plus", label: "Everything Clawde has, plus network", detail: "He'll probably need to fetch something.", why: "a superset of the parent",
    incident: {
      title: "'He'll probably need it'",
      panels: [
        { emoji: "🌐👶", caption: "Junior gets network access his parent never had." },
        { emoji: "📮🔑", caption: "Junior: 'Uploading the test results!' (and the .env, for context)" },
        { emoji: "🦝📬", caption: "Mallory receives the context." },
      ],
      report: {
        youDid: "Added a capability to the child that the parent did not hold.",
        whatHappened: "Anything the child has that the parent lacks is an escalation path for anyone who can influence the child.",
        concept: "Never a superset. If the parent needs network, grant it to the parent through the gate, with a human deciding.",
        fix: "Grant a subset.",
      },
    } },
  { id: "none", label: "Nothing. Sub-agents are dangerous.", detail: "Clawde can run the tests himself.", why: "attenuation, not prohibition",
    incident: {
      title: "Clawde runs the tests himself, one at a time",
      panels: [
        { emoji: "🦞🧪", caption: "3,000 tests. One agent. Sequentially." },
        { emoji: "🕰️🕰️", caption: "It is now the weekend." },
        { emoji: "🧑‍💻😑", caption: "Justin: 'The whole point was parallelism.'" },
      ],
      report: {
        youDid: "Refused delegation entirely.",
        whatHappened: "The capability model makes delegation safe; refusing it throws away the benefit without adding safety.",
        concept: "Capabilities are delegable with attenuation. A subset is the safe, useful answer.",
        fix: "Grant a subset.",
      },
    } },
];

export const REVOKE_OPTIONS: Option[] = [
  { id: "propagate", label: "Junior loses it immediately", detail: "His next npm test call is denied at the gate.", correct: true, why: "a revoked grant is gone for every holder; the gate checks the live table" },
  { id: "finish", label: "Junior keeps it until his task ends", detail: "It would be rude to interrupt.", why: "revocation that waits is not revocation",
    incident: {
      title: "'It would be rude to interrupt'",
      panels: [
        { emoji: "🧑‍💼🛑", caption: "Dana revokes Bash(npm test:*). 'Those tests are hitting prod!'" },
        { emoji: "👶🧪🔥", caption: "Junior: 'Almost done! 2,900 to go.' Each one hits prod." },
        { emoji: "🧑‍💼☎️", caption: "Dana: 'I revoked it.' You: 'Yes, but he was in the middle of something.'" },
      ],
      report: {
        youDid: "Let a revoked capability linger in a child.",
        whatHappened: "A grant that outlives its revocation is a token nobody can take back.",
        concept: "Grants are revocable mid-session, and revocation applies to every agent holding the grant. The gate checks the live table on every call.",
        fix: "Junior loses it immediately.",
      },
    } },
  { id: "ask", label: "Ask Junior to please stop", detail: "Add 'stop running tests' to his prompt.", why: "enforced in the prompt, not the harness",
    incident: {
      title: "Please stop",
      panels: [
        { emoji: "💬🙏", caption: "System prompt: 'Please stop running tests.'" },
        { emoji: "👶🤔", caption: "Junior: 'But the README says the tests are IMPORTANT.'" },
        { emoji: "🧪🔥", caption: "Tests continue. The prompt was very polite." },
      ],
      report: {
        youDid: "Tried to revoke a permission by talking to the model.",
        whatHappened: "The model proposes; the gate decides. Changing the prompt changes proposals, not permissions.",
        concept: "Enforced in the harness, not the prompt. Revoke the capability; the gate denies the next call.",
        fix: "Junior loses it immediately.",
      },
    } },
];
