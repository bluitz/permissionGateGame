/** One comic panel in an incident cutscene. */
export type Panel = { emoji: string; caption: string };

/** What the player sees after a wrong move: three panels, then the lesson. */
export type Incident = {
  title: string;
  panels: [Panel, Panel, Panel];
  report: {
    youDid: string;
    whatHappened: string;
    concept: string;
    fix: string;
  };
};

/** One line in the transcript. Every decision, right or wrong, writes one. */
export type AuditEntry = { who: string; what: string; why: string; bad?: boolean };

export type ShiftId = "rope" | "closet" | "pkce" | "zoning" | "gate" | "villains" | "boss";

export type ShiftInfo = { id: ShiftId; number: string; name: string; teaches: string; emoji: string };

export const SHIFTS: ShiftInfo[] = [
  { id: "rope", number: "Shift 1", name: "The Velvet Rope", teaches: "Authentication vs authorization vs delegation", emoji: "🚪" },
  { id: "closet", number: "Shift 2", name: "The Credential Closet", teaches: "Which credential, and how it fails", emoji: "🗄️" },
  { id: "pkce", number: "Shift 3", name: "The PKCE Dance", teaches: "OAuth 2.1 auth code + PKCE, device code, refresh", emoji: "🕺" },
  { id: "zoning", number: "Shift 4", name: "The Zoning Office", teaches: "RBAC, ABAC, ReBAC, capabilities, allow/deny lists", emoji: "🏙️" },
  { id: "gate", number: "Shift 5", name: "THE GATE", teaches: "The layered permission gate and its precedence", emoji: "🛡️" },
  { id: "villains", number: "Shift 6", name: "The Villain Lineup", teaches: "Threats specific to agents", emoji: "🦝" },
  { id: "boss", number: "Boss", name: "The Two-Minute Interview", teaches: "Worksheet 2, spoken under pressure", emoji: "🗣️" },
];
