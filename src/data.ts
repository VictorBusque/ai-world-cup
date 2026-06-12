import { Team, Match, AIModel, ModelJSON, ModelPlayoffPrediction } from "./types";

const API_URL = "https://n8n.stack.victorbusque.com/webhook/get-wc-data";

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

/** API match shape from the n8n webhook */
interface ApiMatch {
  team_a: string | null;
  team_b: string | null;
  score: string;
  status: string; // "FINISHED" | "TIMED" | "IN_PLAY" | etc.
  stage: string;  // "GROUP_STAGE" | "GROUP_STAGE GROUP_A"
  started_at: string | null; // ISO datetime
  referee_from: string | null;
  match_id: string;
  group?: string; // "GROUP_A" (newer API responses)
  id: number;
}

/**
 * Fetch teams from static JSON + all match data from the live API,
 * then hydrate into internal Match[] / AIModel[] shapes.
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

  // Parallel fetch: teams + API matches + all models
  const [teamsRes, apiRes, ...modelReses] = await Promise.all([
    fetch(`${baseUrl}data/tournament.json`),
    fetch(API_URL).catch(() => null),
    ...MODEL_FILES.map(m => fetch(`${baseUrl}data/models/${m.id}.json`)),
  ]);

  if (!teamsRes.ok) throw new Error(`Failed to load tournament.json: ${teamsRes.status}`);

  const { teams }: { teams: Record<string, Team> } = await teamsRes.json();

  // Build code → Team lookup
  const codeToTeam: Record<string, Team> = {};
  for (const team of Object.values(teams)) {
    codeToTeam[team.code] = team;
  }

  // ── Parse API match data ──────────────────────────────────────────────
  let apiMatches: ApiMatch[] = [];
  if (apiRes && apiRes.ok) {
    try {
      const data = await apiRes.json();
      if (Array.isArray(data)) {
        apiMatches = data;
      } else if (data && typeof data === "object") {
        // Handle { data: [...] } wrapper
        if (Array.isArray(data.data)) {
          apiMatches = data.data;
        } else if (data.team_a !== undefined) {
          apiMatches = [data];
        }
      }
    } catch {
      console.warn("Failed to parse API response");
    }
  }

  // Filter out entries with null teams
  apiMatches = apiMatches.filter(m => m.team_a && m.team_b);

  // ── Parse model predictions ──────────────────────────────────────────
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

  // ── Build prediction lookup by team code pair ─────────────────────────
  // Key: "TEAMACODE-TEAMBCODE" (same order as model JSON entry)
  // Value: { teamAScore, teamBScore, summary? }
  const predLookup: Record<string, Record<string, { teamAScore: number; teamBScore: number; summary?: string }>> = {};

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const json = modelJsons[i];
    if (!json) continue;

    predLookup[model.id] = {};

    for (const [matchKey, pred] of Object.entries(json)) {
      // Skip playoff entries (m73–m104)
      if (/^m\d+$/.test(matchKey)) {
        const num = parseInt(matchKey.slice(1));
        if (num >= 73) continue;
      }

      const codes = Object.keys(pred).filter(k => typeof pred[k] === "number");
      if (codes.length !== 2) continue;

      // Store both orderings so lookup works regardless of API order
      const entry = {
        teamAScore: pred[codes[0]] as number,
        teamBScore: pred[codes[1]] as number,
        ...(typeof pred["summary"] === "string" ? { summary: pred["summary"] as string } : {}),
      };

      predLookup[model.id][`${codes[0]}-${codes[1]}`] = entry;

      // Reverse ordering
      predLookup[model.id][`${codes[1]}-${codes[0]}`] = {
        teamAScore: entry.teamBScore,
        teamBScore: entry.teamAScore,
        ...(entry.summary ? { summary: entry.summary } : {}),
      };
    }
  }

  // ── Build Match objects from API data ─────────────────────────────────
  const matches: Match[] = apiMatches.map(am => {
    const teamA = codeToTeam[am.team_a!];
    const teamB = codeToTeam[am.team_b!];
    if (!teamA || !teamB) return null;

    // Parse group: prefer direct "group" field, then fall back to stage
    let group = "";
    if (am.group) {
      // "GROUP_A" → "Group A"
      const g = am.group.replace(/^GROUP_/, "Group ");
      group = g;
    } else {
      const stageMatch = am.stage?.match(/GROUP_([A-Z])/);
      if (stageMatch) group = `Group ${stageMatch[1]}`;
    }

    // Parse actualScore: "2-0" → {teamA:2, teamB:0}, "-" → null
    let actualScore: { teamA: number; teamB: number } | null = null;
    if (am.score && am.score !== "-" && am.status === "FINISHED") {
      const parts = am.score.split("-");
      if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
        actualScore = { teamA: parseInt(parts[0]), teamB: parseInt(parts[1]) };
      }
    }

    // Parse date/time from started_at ISO string (API sends UTC)
    // Convert to the user's local timezone
    let date = "";
    let time = "";
    if (am.started_at) {
      const d = new Date(am.started_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      date = `${year}-${month}-${day}`;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      time = `${hours}:${minutes}`;
    }

    // Look up predictions by team code pair
    const predictions: Match["predictions"] = {};
    const predKey = `${am.team_a}-${am.team_b}`;
    for (const model of models) {
      const pred = predLookup[model.id]?.[predKey];
      if (pred) {
        predictions[model.id] = pred;
      }
    }

    // Derive a readable match ID from the API match_id
    // "GROUP_STAGE:GROUP_A:MEX-RSA" → keep as-is for uniqueness
    const id = am.match_id || String(am.id);

    return {
      id,
      group,
      teamA,
      teamB,
      date,
      time,
      venue: "", // API doesn't provide venue yet
      actualScore,
      predictions,
    };
  }).filter(Boolean) as Match[];

  // ── Parse playoff predictions (unchanged, uses model JSON keys directly) ──
  const PLAYOFF_MATCH_RANGES: Record<string, [number, number]> = {
    r32: [73, 88],
    r16: [89, 96],
    qf: [97, 100],
    sf: [101, 102],
    bronze: [103, 103],
    final: [104, 104],
  };

  const modelPlayoffPredictions: ModelPlayoffPrediction[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const json = modelJsons[i];
    if (!json) continue;

    const hasPlayoffData = Object.entries(PLAYOFF_MATCH_RANGES).some(([, range]) => {
      const [start, end] = range;
      return Array.from({ length: end - start + 1 }, (_, j) => `m${start + j}`).some(k => k in json);
    });
    if (!hasPlayoffData) continue;

    const rounds: ModelPlayoffPrediction["rounds"] = {};

    for (const [roundKey, [start, end]] of Object.entries(PLAYOFF_MATCH_RANGES)) {
      const parsedMatches: Record<string, { teamA: string; teamAScore: number; teamB: string; teamBScore: number; summary?: string }> = {};

      for (let m = start; m <= end; m++) {
        const matchId = `m${m}`;
        const scores = json[matchId];
        if (!scores) continue;

        const codes = Object.keys(scores).filter(k => typeof scores[k] === "number");
        if (codes.length !== 2) continue;

        const entry: { teamA: string; teamAScore: number; teamB: string; teamBScore: number; summary?: string } = {
          teamA: codes[0],
          teamAScore: scores[codes[0]] as number,
          teamB: codes[1],
          teamBScore: scores[codes[1]] as number,
        };

        if (typeof scores["summary"] === "string") {
          entry.summary = scores["summary"];
        }

        parsedMatches[matchId] = entry;
      }

      if (Object.keys(parsedMatches).length > 0) {
        rounds[roundKey] = parsedMatches;
      }
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
