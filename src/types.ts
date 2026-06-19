// ── JSON file schema types (match what's on disk) ──

/** New flat format: matchId → { teamCode: score, ..., "summary": "..." } */
export type ModelJSON = Record<string, Record<string, number | string>>;

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
  persona: string;
  points: number;
  exactScores: number;          // perfect scorelines (both team scores nailed)
  correctOutcomes: number;       // correct result (winner/draw nailed)
  correctTeamScores: number;     // individual team scores nailed (0-2 per match)
  accuracy: number;
  avgGoalDeviation: number;
  avgPredictedGoals: number;
}

export interface Goal {
  team: "A" | "B"; // which side scored
  name: string;
  minute: string;
  penalty?: boolean;
  ownGoal?: boolean;
}

export interface Match {
  id: string;
  group: string;
  round: string; // "Matchday 1", "Round of 32", etc.
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  venue: string;
  status: "FINISHED" | "IN_PLAY" | "PAUSED" | "TIMED" | string;
  isLive: boolean;
  actualScore: { teamA: number; teamB: number } | null;
  halfTimeScore: { teamA: number; teamB: number } | null;
  goals: Goal[];
  predictions: Record<string, { teamAScore: number; teamBScore: number; summary?: string }>;
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

export const PLAYOFF_ROUNDS: PlayoffRound[] = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

/** Bracket topology — correct match ordering within each round so adjacent pairs feed into the next round */
export const BRACKET_ORDER: Record<string, string[]> = {
  r32: ["m74", "m77", "m73", "m75", "m83", "m84", "m81", "m82", "m76", "m78", "m79", "m80", "m86", "m88", "m85", "m87"],
  r16: ["m89", "m90", "m93", "m94", "m91", "m92", "m95", "m96"],
  qf: ["m97", "m98", "m99", "m100"],
  sf: ["m101", "m102"],
  bronze: ["m103"],
  final: ["m104"],
};

/** Parsed playoff predictions for a single model */
export interface ModelPlayoffPrediction {
  modelId: string;
  rounds: Record<string, Record<string, { teamA: string; teamAScore: number; teamB: string; teamBScore: number; summary?: string }>>;
  champion: string | null; // team code
  runnerUp: string | null; // team code
}


