export interface AIModel {
  id: string;
  name: string;
  version: string;
  provider: string;
  avatarColor: string;
  style: string;
  avgPredictedGoals: number;
  upsetPropensity: string; // HIGH, MEDIUM, LOW
  drawPropensity: string;  // HIGH, MEDIUM, LOW
  accuracy: number;        // dynamic based on outcomes
  exactScores: number;     // dynamic
  correctOutcomes: number; // dynamic
  points: number;          // dynamic
}

export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
  group: string;
}

export interface Match {
  id: string;
  group: string;
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  venue: string;
  actualScore: {
    teamA: number;
    teamB: number;
  } | null; // null if unplayed/unsimulated
  predictions: Record<string, {
    teamAScore: number;
    teamBScore: number;
    reason: string;
  }>;
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goal difference
  pts: number; // points
}
