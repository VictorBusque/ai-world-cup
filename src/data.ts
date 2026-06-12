import { Team, Match, AIModel, TournamentJSON, TournamentMatchJSON, ModelJSON, ModelPlayoffPrediction } from "./types";

// Hardcoded model registry with metadata — add new entries when you drop a new JSON
const MODEL_FILES: { id: string; name: string; provider: string; avatarColor: string }[] = [
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google", avatarColor: "from-blue-500 to-indigo-600" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google", avatarColor: "from-cyan-400 to-blue-500" },
  { id: "gpt-5.5", name: "GPT-5.5", provider: "OpenAI", avatarColor: "from-emerald-500 to-teal-600" },
  { id: "claude-opus-4-8", name: "Claude Opus 4.8", provider: "Anthropic", avatarColor: "from-amber-500 to-orange-600" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", avatarColor: "from-amber-500 to-orange-600" },
  { id: "claude-fable-5", name: "Claude Fable 5", provider: "Anthropic", avatarColor: "from-amber-500 to-orange-600" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", provider: "DeepSeek", avatarColor: "from-sky-500 to-blue-700" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "DeepSeek", avatarColor: "from-sky-400 to-cyan-500" },
  { id: "mistral-medium-3.5", name: "Mistral Medium 3.5", provider: "Mistral", avatarColor: "from-orange-500 to-red-600" },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "Moonshot", avatarColor: "from-violet-500 to-purple-700" },
  { id: "nemotron-3-super", name: "Nemotron 3 Super", provider: "NVIDIA", avatarColor: "from-lime-500 to-green-600" },
];

/**
 * Fetch tournament.json + all model JSON files in parallel,
 * then hydrate into the internal Match[] / AIModel[] shapes.
 */
export async function loadData(): Promise<{
  teams: Record<string, Team>;
  matches: Match[];
  models: AIModel[];
  rawPredictions: Record<string, Record<string, Record<string, number | string>>>;
  playoffMatches: never[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}> {
  const baseUrl = import.meta.env.BASE_URL;

  // Parallel fetch: tournament + all models
  const [tournamentRes, ...modelReses] = await Promise.all([
    fetch(`${baseUrl}data/tournament.json`),
    ...MODEL_FILES.map(m => fetch(`${baseUrl}data/models/${m.id}.json`)),
  ]);

  if (!tournamentRes.ok) throw new Error(`Failed to load tournament.json: ${tournamentRes.status}`);

  const tournament: TournamentJSON = await tournamentRes.json();
  const teams = tournament.teams;

  // Parse models using hardcoded metadata
  const models: AIModel[] = [];
  const rawPredictions: Record<string, Record<string, Record<string, number | string>>> = {};
  const modelJsons: ModelJSON[] = [];

  for (let i = 0; i < modelReses.length; i++) {
    const res = modelReses[i];
    const meta = MODEL_FILES[i];

    if (!res.ok) {
      console.warn(`Skipping model ${meta.id}: ${res.status}`);
      modelJsons.push(null as unknown as ModelJSON);
      continue;
    }
    const json: ModelJSON = await res.json();

    models.push({
      id: meta.id,
      name: meta.name,
      provider: meta.provider,
      avatarColor: meta.avatarColor,
      points: 0,
      exactScores: 0,
      correctOutcomes: 0,
      accuracy: 0,
      avgGoalDeviation: 0,
      avgPredictedGoals: 0,
    });

    rawPredictions[meta.id] = json;
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

    // Convert each model's { "MEX": 2, "RSA": 0, "summary": "..." } → { teamAScore, teamBScore }
    const predictions: Match["predictions"] = {};
    for (const meta of MODEL_FILES) {
      const pred = rawPredictions[meta.id]?.[m.id];
      if (!pred) continue;

      // Filter out non-numeric keys like "summary" to get team codes
      const codes = Object.keys(pred).filter(k => typeof pred[k] === "number");
      if (codes.length !== 2) {
        console.warn(`Model ${meta.id} match ${m.id}: expected 2 team codes, got ${codes.length}`);
        continue;
      }

      const scoreA = pred[teamA.code];
      const scoreB = pred[teamB.code];

      if (scoreA === undefined || scoreB === undefined) {
        console.warn(`Model ${meta.id} match ${m.id}: codes ${codes.join(",")} don't match ${teamA.code}/${teamB.code}`);
        continue;
      }

      const entry: { teamAScore: number; teamBScore: number; summary?: string } = {
        teamAScore: scoreA as number,
        teamBScore: scoreB as number,
      };

      if (typeof pred["summary"] === "string") {
        entry.summary = pred["summary"];
      }

      predictions[meta.id] = entry;
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
    if (!json?.["playoffs"]) continue;

    const playoffData = json["playoffs"] as Record<string, Record<string, Record<string, number | string>>>;
    const rounds: ModelPlayoffPrediction["rounds"] = {};

    for (const roundKey of ROUND_KEYS) {
      const roundData = playoffData[roundKey];
      if (!roundData) continue;

      const parsedMatches: Record<string, { teamA: string; teamAScore: number; teamB: string; teamBScore: number }> = {};
      for (const [matchId, scores] of Object.entries(roundData)) {
        const codes = Object.keys(scores).filter(k => typeof scores[k] === "number");
        if (codes.length !== 2) continue;
        parsedMatches[matchId] = {
          teamA: codes[0],
          teamAScore: scores[codes[0]] as number,
          teamB: codes[1],
          teamBScore: scores[codes[1]] as number,
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
