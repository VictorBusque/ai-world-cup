import { Team, Match, AIModel, TournamentJSON, TournamentMatchJSON, ModelJSON, ModelPlayoffPrediction } from "./types";

// Hardcoded model file registry — add a new entry when you drop a new JSON
const MODEL_FILES = [
  "gemini-3.1-pro",
  "gemini-3.5-flash",
  "gpt-5.5",
  "claude-sonnet-4-6",
  "claude-opus-4-8",
  "claude-fable-5",
  // "deepseek-v4-pro",
  "deepseek-v4-flash",
  "mistral-medium-3.5",
  "glm-5.1",
  // "nemotron-3-ultra",
  "kimi-k2.6",
];

/**
 * Fetch tournament.json + all model JSON files in parallel,
 * then hydrate into the internal Match[] / AIModel[] shapes.
 */
export async function loadData(): Promise<{
  teams: Record<string, Team>;
  matches: Match[];
  models: AIModel[];
  rawPredictions: Record<string, Record<string, Record<string, number>>>;
  playoffMatches: never[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}> {
  const baseUrl = import.meta.env.BASE_URL;

  // Parallel fetch: tournament + all models
  const [tournamentRes, ...modelReses] = await Promise.all([
    fetch(`${baseUrl}data/tournament.json`),
    ...MODEL_FILES.map(id => fetch(`${baseUrl}data/models/${id}.json`)),
  ]);

  if (!tournamentRes.ok) throw new Error(`Failed to load tournament.json: ${tournamentRes.status}`);

  const tournament: TournamentJSON = await tournamentRes.json();
  const teams = tournament.teams;

  // Parse models, collect raw predictions
  const models: AIModel[] = [];
  const rawPredictions: Record<string, Record<string, Record<string, number>>> = {};
  const modelJsons: ModelJSON[] = [];

  for (let i = 0; i < modelReses.length; i++) {
    const res = modelReses[i];
    if (!res.ok) {
      console.warn(`Skipping model ${MODEL_FILES[i]}: ${res.status}`);
      modelJsons.push(null as unknown as ModelJSON);
      continue;
    }
    const json: ModelJSON = await res.json();
    const id = MODEL_FILES[i];

    models.push({
      id,
      name: json.name,
      provider: json.provider,
      avatarColor: json.color,
      points: 0,
      exactScores: 0,
      correctOutcomes: 0,
      accuracy: 0,
      avgGoalDeviation: 0,
      avgPredictedGoals: 0,
    });

    rawPredictions[id] = json.predictions;
    modelJsons.push(json);
  }

  // Build a reverse map: teamCode → teamId for resolving predictions
  const codeToId: Record<string, string> = {};
  for (const [id, team] of Object.entries(teams)) {
    codeToId[team.code] = id;
  }

  // Hydrate matches: resolve team IDs to full objects + convert predictions
  const matches: Match[] = tournament.matches.map((m: TournamentMatchJSON) => {
    const teamA = teams[m.teamA];
    const teamB = teams[m.teamB];

    if (!teamA || !teamB) {
      throw new Error(`Match ${m.id} references unknown team: ${m.teamA} or ${m.teamB}`);
    }

    // Convert each model's { "USA": 1, "GER": 2 } → { teamAScore, teamBScore }
    const predictions: Match["predictions"] = {};
    for (const modelId of MODEL_FILES) {
      const pred = rawPredictions[modelId]?.[m.id];
      if (!pred) continue;

      const codes = Object.keys(pred);
      if (codes.length !== 2) {
        console.warn(`Model ${modelId} match ${m.id}: expected 2 team codes, got ${codes.length}`);
        continue;
      }

      const scoreA = pred[teamA.code];
      const scoreB = pred[teamB.code];

      if (scoreA === undefined || scoreB === undefined) {
        console.warn(`Model ${modelId} match ${m.id}: codes ${codes.join(",")} don't match ${teamA.code}/${teamB.code}`);
        continue;
      }

      predictions[modelId] = { teamAScore: scoreA, teamBScore: scoreB };
    }

    return {
      id: m.id,
      group: m.group,
      teamA,
      teamB,
      date: m.date,
      time: m.time,
      venue: m.venue,
      actualScore: m.actualScore,
      predictions,
    };
  });

  // Parse playoff predictions from model JSONs
  const ROUND_KEYS = ["r32", "r16", "qf", "sf", "bronze", "final"] as const;
  const modelPlayoffPredictions: ModelPlayoffPrediction[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const json = modelJsons[i];
    if (!json?.playoffs) continue;

    const rounds: ModelPlayoffPrediction["rounds"] = {};

    for (const roundKey of ROUND_KEYS) {
      const roundData = json.playoffs[roundKey];
      if (!roundData) continue;

      const parsedMatches: Record<string, { teamA: string; teamAScore: number; teamB: string; teamBScore: number }> = {};
      for (const [matchId, scores] of Object.entries(roundData)) {
        const codes = Object.keys(scores);
        if (codes.length !== 2) continue;
        parsedMatches[matchId] = {
          teamA: codes[0],
          teamAScore: scores[codes[0]],
          teamB: codes[1],
          teamBScore: scores[codes[1]],
        };
      }
      rounds[roundKey] = parsedMatches;
    }

    // Derive champion and runner-up from the final
    let champion: string | null = null;
    let runnerUp: string | null = null;
    const finalMatches = rounds["final"];
    if (finalMatches) {
      for (const m of Object.values(finalMatches)) {
        if (m.teamAScore > m.teamBScore) {
          champion = m.teamA;
          runnerUp = m.teamB;
        } else {
          champion = m.teamB;
          runnerUp = m.teamA;
        }
      }
    }

    modelPlayoffPredictions.push({
      modelId: model.id,
      rounds,
      champion,
      runnerUp,
    });
  }

  return { teams, matches, models, rawPredictions, playoffMatches: [] as never[], modelPlayoffPredictions };
}
