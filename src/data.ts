import { Team, Match, AIModel, TournamentJSON, TournamentMatchJSON, ModelJSON, PlayoffMatch } from "./types";

// Hardcoded model file registry — add a new entry when you drop a new JSON
const MODEL_FILES = [
  "gemini-3.1-pro",
  "gemini-3.5-flash",
  "gpt-5.5",
  "claude-opus-4-8",
  "claude-fable-5",
  "deepseek-v4-pro",
  "deepseek-v4-flash",
  "mistral-medium-3.5",
  "glm-5.1",
  "nemotron-3-ultra",
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
  playoffMatches: PlayoffMatch[];
}> {
  const baseUrl = "/";

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

  for (let i = 0; i < modelReses.length; i++) {
    const res = modelReses[i];
    if (!res.ok) {
      console.warn(`Skipping model ${MODEL_FILES[i]}: ${res.status}`);
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
      avgPredictedGoals: 0,
    });

    rawPredictions[id] = json.predictions;
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

  return { teams, matches, models, rawPredictions, playoffMatches: [] as PlayoffMatch[] };
}
