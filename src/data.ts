import { Team, Match, AIModel, ModelJSON, ModelPlayoffPrediction, PlayoffMatch, Goal } from "./types";

const WORLDCUP_JSON_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json";

// Hardcoded model registry with metadata — add new entries when you drop a new JSON
const MODEL_FILES: { id: string; name: string; provider: string; avatarColor: string; persona: string }[] = [
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    avatarColor: "from-blue-500 to-indigo-600",
    persona: "The veteran tactician. Gemini 3.1 Pro brings Google DeepMind's deepest multimodal reasoning — parsing text, video, and stats simultaneously with a 1M-token memory. It doubled its predecessor's ARC-AGI score and excels at nuanced, long-context analysis. A methodical strategist that leaves no data point unexamined.",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    avatarColor: "from-cyan-400 to-blue-500",
    persona: "The speed merchant. Gemini 3.5 Flash is Google's agent-first model — built not just to answer, but to act. It outperforms the larger 3.1 Pro on coding and agentic benchmarks at 4× the speed and half the cost. A fast, decisive predictor that trusts rapid pattern recognition over lengthy deliberation.",
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    avatarColor: "from-emerald-500 to-teal-600",
    persona: "The autonomous operator. Codenamed 'Spud,' GPT-5.5 is OpenAI's most agentic model yet — engineered for sustained, multi-step work with tool calling, error recovery, and coherent state over long interactions. A relentless executor that plans deep, adapts mid-task, and never loses the thread.",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    avatarColor: "from-amber-500 to-orange-600",
    persona: "The heavyweight craftsman. Claude Opus 4.8 is Anthropic's flagship for complex, long-running work — combining elite coding precision with careful planning and sustained agentic focus. It handles multi-hour tasks with unwavering consistency, making it the model that grinds the hardest when the stakes are highest.",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    avatarColor: "from-amber-500 to-orange-600",
    persona: "The balanced strategist. Sonnet 4.6 delivers Opus-tier intelligence at production scale — a 1M-token context window, top-tier coding, and efficient cost-performance. Recommended for high-volume tasks where you need frontier reasoning without the flagship price tag. Clinical and reliable under pressure.",
  },
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "Anthropic",
    avatarColor: "from-amber-500 to-orange-600",
    persona: "The long-horizon architect. Fable 5 is Anthropic's longest-running autonomous agent — capable of sustained work across millions of tokens without losing focus. It tops FrontierBench for coding and generalizes to unfamiliar tools out of the box. A patient builder that thinks in endgames, not just moves.",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    avatarColor: "from-sky-500 to-blue-700",
    persona: "The efficiency maximizer. DeepSeek V4 Pro is a 1.6T-parameter Mixture-of-Experts that activates only 49B per token — frontier-class coding (80.6% SWE-bench) at a fraction of the cost. Open-weight under MIT license with a 1M context window. A ruthless optimizer that delivers premium results on a budget.",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    avatarColor: "from-sky-400 to-cyan-500",
    persona: "The production workhorse. DeepSeek V4 Flash is a 284B MoE model hitting 79% on SWE-bench at just $0.28/M output tokens — the default for cost-sensitive production workloads. Open-weight, blazingly fast at 83.6 tokens/sec, and surprisingly capable for its weight class. Punches well above its price.",
  },
  {
    id: "mistral-medium-3.5",
    name: "Mistral Medium 3.5",
    provider: "Mistral",
    avatarColor: "from-orange-500 to-red-600",
    persona: "The European challenger. Mistral Medium 3.5 is a dense 128B-parameter model — no MoE tricks, every parameter fires on every pass for predictable, consistent inference. Open-weight under Modified MIT, excelling at instruction-following, reasoning, and coding. A straightforward, no-nonsense predictor.",
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    provider: "Moonshot",
    avatarColor: "from-violet-500 to-purple-700",
    persona: "The swarm coordinator. Kimi K2.6 is Moonshot AI's 1T-parameter MoE flagship (32B active) — a native multimodal agent that orchestrates sub-agent swarms across long-horizon tasks. Open-weight and built for tool-using, coding-driven design, and distributed reasoning. A creative wildcard that sees patterns others miss.",
  },
  {
    id: "nemotron-3-super",
    name: "Nemotron 3 Super",
    provider: "NVIDIA",
    avatarColor: "from-lime-500 to-green-600",
    persona: "The hybrid innovator. Nemotron 3 Super is NVIDIA's 120B-parameter hybrid Mamba-Transformer MoE — a novel architecture that merges linear recurrence with attention for efficient long-context reasoning. The first model to use latent MoE and multi-token prediction, purpose-built for agentic planning and tool calling.",
  },
  {
    "id": "glm-5.2",
    "name": "GLM 5.2",
    "provider": "Zhipu AI",
    "avatarColor": "from-gray-500 to-gray-700",
    "persona": "The multilingual generalist. GLM 5.2 Z.ai latest model, released on the first days of the World Cup.",
  }
];

/** Raw match shape from openfootball worldcup.json */
interface OFMatch {
  round: string; // "Matchday 1" | "Round of 32" | "Round of 16" | "Quarter-final" | "Semi-final" | "Match for third place" | "Final"
  num?: number; // only present for knockout matches (73–104)
  date: string; // "2026-06-11"
  time: string; // "13:00 UTC-6"
  team1: string; // full name ("Mexico") or placeholder ("2A", "W74") for knockouts
  team2: string;
  score?: { ft: [number, number]; ht?: [number, number] };
  goals1?: { name: string; minute: string; penalty?: boolean; owngoal?: boolean }[];
  goals2?: { name: string; minute: string; penalty?: boolean; owngoal?: boolean }[];
  group?: string; // "Group A"
  ground?: string; // "Mexico City"
}

// The API now sends full team names that match tournament.json exactly, so the
// only "translation" needed is normalizing case + diacritics (e.g. Curaçao → curacao).
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (Curaçao → Curacao)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch teams from static JSON + match data from openfootball worldcup.json,
 * then hydrate into internal Match[] / AIModel[] shapes.
 */
export async function loadData(): Promise<{
  teams: Record<string, Team>;
  matches: Match[];
  models: AIModel[];
  rawPredictions: Record<string, Record<string, Record<string, number | string>>>;
  playoffMatches: PlayoffMatch[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}> {
  const baseUrl = import.meta.env.BASE_URL;

  // Parallel fetch: teams + worldcup.json + all models
  const [teamsRes, wcRes, ...modelReses] = await Promise.all([
    fetch(`${baseUrl}data/tournament.json`),
    fetch(WORLDCUP_JSON_URL).catch(() => null),
    ...MODEL_FILES.map(m => fetch(`${baseUrl}data/models/${m.id}.json`)),
  ]);

  if (!teamsRes.ok) throw new Error(`Failed to load tournament.json: ${teamsRes.status}`);

  const { teams }: { teams: Record<string, Team> } = await teamsRes.json();

  // The openfootball worldcup.json uses full team names that match
  // tournament.json exactly, so a normalized-name lookup is all that's needed
  // to resolve a team string to a Team.
  const nameToTeam: Record<string, Team> = {};
  for (const team of Object.values(teams)) {
    nameToTeam[normalizeTeamName(team.name)] = team;
  }
  const resolveTeam = (raw: string | null | undefined): Team | undefined =>
    raw ? nameToTeam[normalizeTeamName(raw)] : undefined;

  // ── Parse worldcup.json match data ───────────────────────────────────
  let ofMatches: OFMatch[] = [];
  if (wcRes && wcRes.ok) {
    try {
      const data = await wcRes.json();
      if (data && Array.isArray(data.matches)) {
        ofMatches = data.matches;
      }
    } catch {
      console.warn("Failed to parse worldcup.json");
    }
  }

  // Keep only matches where BOTH teams resolve to real teams.
  // Knockout placeholders (e.g. "2A", "W74") are dropped from the group view.
  const resolvedMatches = ofMatches.filter(
    m => resolveTeam(m.team1) && resolveTeam(m.team2)
  );

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
      persona: meta.persona,
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

  // ── Build prediction lookup by team code pair ────────────────────────
  // Key: "TEAMACODE-TEAMBCODE". Store both orderings (A-B and B-A) so the
  // lookup works regardless of the order worldcup.json lists the teams in.
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

      const entry = {
        teamAScore: pred[codes[0]] as number,
        teamBScore: pred[codes[1]] as number,
        ...(typeof pred["summary"] === "string" ? { summary: pred["summary"] as string } : {}),
      };

      predLookup[model.id][`${codes[0]}-${codes[1]}`] = entry;
      predLookup[model.id][`${codes[1]}-${codes[0]}`] = {
        teamAScore: entry.teamBScore,
        teamBScore: entry.teamAScore,
        ...(entry.summary ? { summary: entry.summary } : {}),
      };
    }
  }

  // ── Build Match objects from worldcup.json ───────────────────────────
  // Parse a kickoff instant from "2026-06-11" + "13:00 UTC-6" into the user's
  // local timezone, returning local {date, time} plus the UTC instant.
  const parseKickoff = (
    dateStr: string,
    timeStr: string
  ): { date: string; time: string; instant: Date | null } => {
    const m = timeStr.match(/^(\d{2}):(\d{2})\s*UTC\s*([+-]?\d+)/i);
    if (!m) return { date: dateStr || "", time: timeStr || "", instant: null };
    const offsetNum = parseInt(m[3], 10);
    const sign = offsetNum >= 0 ? "+" : "-";
    const offsetStr = `${sign}${String(Math.abs(offsetNum)).padStart(2, "0")}:00`;
    const iso = `${dateStr}T${m[1]}:${m[2]}:00${offsetStr}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: dateStr || "", time: timeStr || "", instant: null };
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}`, instant: d };
  };

  // worldcup.json carries no explicit live/in-progress flag, but it gives us
  // precise, timezone-aware kickoff times. Derive match status from those: a
  // match is "live" while we're inside its play window and it has no full-time
  // score yet. (Matches shown as live are best-effort; the source only records
  // final scores.)
  const now = Date.now();
  const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000; // ~2h covers 90' + HT + stoppage

  const matches: Match[] = resolvedMatches.map((om) => {
    const teamA = resolveTeam(om.team1)!;
    const teamB = resolveTeam(om.team2)!;

    // Full-time + half-time scores (presence of score.ft means finished)
    let actualScore: { teamA: number; teamB: number } | null = null;
    let halfTimeScore: { teamA: number; teamB: number } | null = null;
    if (om.score && Array.isArray(om.score.ft)) {
      actualScore = { teamA: om.score.ft[0], teamB: om.score.ft[1] };
      if (Array.isArray(om.score.ht)) {
        halfTimeScore = { teamA: om.score.ht[0], teamB: om.score.ht[1] };
      }
    }

    // Goal scorers: merge goals1 (team A) + goals2 (team B) into one timeline
    const goals: Goal[] = [];
    for (const g of om.goals1 ?? []) {
      goals.push({ team: "A", name: g.name, minute: g.minute, penalty: g.penalty, ownGoal: g.owngoal });
    }
    for (const g of om.goals2 ?? []) {
      goals.push({ team: "B", name: g.name, minute: g.minute, penalty: g.penalty, ownGoal: g.owngoal });
    }

    const { date, time, instant } = parseKickoff(om.date, om.time);

    // Derive live/finished/scheduled status from the kickoff instant.
    const isLive =
      actualScore === null &&
      instant !== null &&
      now >= instant.getTime() &&
      now < instant.getTime() + LIVE_WINDOW_MS;
    const status: Match["status"] = actualScore
      ? "FINISHED"
      : isLive
        ? "IN_PLAY"
        : "TIMED";

    // Look up predictions by team code pair
    const predictions: Match["predictions"] = {};
    const predKey = `${teamA.code}-${teamB.code}`;
    for (const model of models) {
      const pred = predLookup[model.id]?.[predKey];
      if (pred) {
        predictions[model.id] = pred;
      }
    }

    const id = `${om.date}-${teamA.code}-${teamB.code}`;

    return {
      id,
      group: om.group || "",
      round: om.round || "",
      teamA,
      teamB,
      date,
      time,
      venue: om.ground || "",
      status,
      isLive,
      actualScore,
      halfTimeScore,
      goals,
      predictions,
    };
  });

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

  return { teams, matches, models, rawPredictions, playoffMatches: [] as PlayoffMatch[], modelPlayoffPredictions };
}
