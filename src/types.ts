// ── JSON file schema types (match what's on disk) ──

/** What each model JSON looks like on disk */
export interface ModelJSON {
  name: string;
  provider: string;
  color: string;
  predictions: Record<string, Record<string, number>>; // matchId → { "USA": 1, "GER": 2 }
  playoffs: {
    r32?: Record<string, Record<string, number>>;
    r16?: Record<string, Record<string, number>>;
    qf?: Record<string, Record<string, number>>;
    sf?: Record<string, Record<string, number>>;
    bronze?: Record<string, Record<string, number>>;
    final?: Record<string, Record<string, number>>;
  };
}

/** What tournament.json matches look like on disk */
export interface TournamentMatchJSON {
  id: string;
  group: string;
  teamA: string; // team id
  teamB: string;
  date: string;
  time: string;
  venue: string;
  actualScore: { teamA: number; teamB: number } | null;
}

/** What tournament.json looks like on disk */
export interface TournamentJSON {
  teams: Record<string, Team>;
  matches: TournamentMatchJSON[];
}

// ── Internal hydrated types (used by components) ──

export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
  group: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  avatarColor: string;
  points: number;
  exactScores: number;
  correctOutcomes: number;
  accuracy: number;
  avgGoalDeviation: number;
  avgPredictedGoals: number;
}

export interface Match {
  id: string;
  group: string;
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  venue: string;
  actualScore: { teamA: number; teamB: number } | null;
  predictions: Record<string, { teamAScore: number; teamBScore: number }>;
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

// ── Playoff / Knockout types ──

export type PlayoffRound =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-finals"
  | "Semi-finals"
  | "Final";

/** A single knockout match (same shape as group Match but keyed by round) */
export interface PlayoffMatch {
  id: string;
  round: PlayoffRound;
  slot: number; // position within the round (1-indexed)
  teamA: Team | null; // null = TBD
  teamB: Team | null;
  date: string;
  time: string;
  venue: string;
  actualScore: { teamA: number; teamB: number } | null;
  predictions: Record<string, { teamAScore: number; teamBScore: number }>;
}

/** Parsed playoff predictions for a single model */
export interface ModelPlayoffPrediction {
  modelId: string;
  rounds: Record<string, Record<string, { teamA: string; teamAScore: number; teamB: string; teamBScore: number }>>;
  champion: string | null; // team code
  runnerUp: string | null; // team code
}

export const PLAYOFF_ROUNDS: PlayoffRound[] = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];
