import { Team, BRACKET_ORDER } from "./types";

// Re-export BRACKET_ORDER for convenience
export { BRACKET_ORDER };

// ── Playoff round constants ──

export const ROUND_ORDER = ["r32", "r16", "qf", "sf", "bronze", "final"] as const;

export const ROUND_META: Record<string, { label: string; short: string }> = {
  r32: { label: "ROUND OF 32", short: "R32" },
  r16: { label: "ROUND OF 16", short: "R16" },
  qf: { label: "QUARTER-FINALS", short: "QF" },
  sf: { label: "SEMI-FINALS", short: "SF" },
  bronze: { label: "BRONZE MATCH", short: "3RD" },
  final: { label: "FINAL", short: "F" },
};

export const ROUND_COUNTS: Record<string, number> = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  bronze: 1,
  final: 1,
};

// ── Color mapping for SVG charts (keyed by model id) ──

export const MODEL_COLORS: Record<string, string> = {
  "gemini-3.1-pro": "#3b82f6",
  "gemini-3.5-flash": "#22d3ee",
  "gpt-5.5": "#10b981",
  "claude-opus-4-8": "#f59e0b",
  "claude-sonnet-4-6": "#fb923c",
  "claude-fable-5": "#d97706",
  "deepseek-v4-pro": "#0ea5e9",
  "deepseek-v4-flash": "#38bdf8",
  "mistral-medium-3.5": "#f97316",
  "kimi-k2.6": "#8b5cf6",
  "nemotron-3-super": "#84cc16",
};

// ── Shared team helpers ──

export function buildTeamByCodeMap(teams: Team[]): Map<string, Team> {
  const m = new Map<string, Team>();
  for (const t of teams) m.set(t.code, t);
  return m;
}
