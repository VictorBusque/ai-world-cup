import { Team, Match, AIModel } from "./types";

export const INITIAL_MODELS: AIModel[] = [
  {
    id: "gemini-3-pro",
    name: "Gemini 3.1 Pro",
    version: "v3.1-previewed",
    provider: "Google",
    avatarColor: "from-blue-500 to-indigo-600",
    style: "Tactical structure, spatial transitions, physical conditioning, and comprehensive squad-depth modeling.",
    avgPredictedGoals: 2.15,
    upsetPropensity: "MEDIUM",
    drawPropensity: "MEDIUM",
    accuracy: 0,
    exactScores: 0,
    correctOutcomes: 0,
    points: 0
  },
  {
    id: "gpt-5-5",
    name: "GPT-5.5 Omni",
    version: "v5.5-alpha",
    provider: "OpenAI",
    avatarColor: "from-emerald-500 to-teal-600",
    style: "Historical powerhouses weight, high-scoring projections, star-player metrics, and legacy coach influence.",
    avgPredictedGoals: 2.50,
    upsetPropensity: "LOW",
    drawPropensity: "LOW",
    accuracy: 0,
    exactScores: 0,
    correctOutcomes: 0,
    points: 0
  },
  {
    id: "opus-4",
    name: "Opus 4.8",
    version: "v4.8-claude",
    provider: "Anthropic",
    avatarColor: "from-amber-600 to-orange-700",
    style: "Conservative projections, high draw rate, low-scoring tactical stalemates, and set-piece focus.",
    avgPredictedGoals: 1.85,
    upsetPropensity: "LOW",
    drawPropensity: "HIGH",
    accuracy: 0,
    exactScores: 0,
    correctOutcomes: 0,
    points: 0
  },
  {
    id: "deepseek-v4",
    name: "DeepSeek v4 Pro",
    version: "v4-deep",
    provider: "DeepSeek",
    avatarColor: "from-sky-500 to-blue-700",
    style: "Pure statistics, Monte Carlo iterations, weather/travel factor weight, and high underdog potential.",
    avgPredictedGoals: 2.22,
    upsetPropensity: "HIGH",
    drawPropensity: "LOW",
    accuracy: 0,
    exactScores: 0,
    correctOutcomes: 0,
    points: 0
  },
  {
    id: "fable-5",
    name: "Fable 5",
    version: "v5-creative",
    provider: "Saga",
    avatarColor: "from-fuchsia-500 to-purple-600",
    style: "Narrative-driven, psychological pressure modeling, squad harmony/discord indexes, and heavy emotional bias.",
    avgPredictedGoals: 2.65,
    upsetPropensity: "HIGH",
    drawPropensity: "MEDIUM",
    accuracy: 0,
    exactScores: 0,
    correctOutcomes: 0,
    points: 0
  }
];

export const TEAMS: Record<string, Team> = {
  usa: { id: "usa", name: "United States", code: "USA", flag: "🇺🇸", group: "Group A" },
  germany: { id: "germany", name: "Germany", code: "GER", flag: "🇩🇪", group: "Group A" },
  nigeria: { id: "nigeria", name: "Nigeria", code: "NGA", flag: "🇳🇬", group: "Group A" },
  japan: { id: "japan", name: "Japan", code: "JPN", flag: "🇯🇵", group: "Group A" },

  france: { id: "france", name: "France", code: "FRA", flag: "🇫🇷", group: "Group B" },
  argentina: { id: "argentina", name: "Argentina", code: "ARG", flag: "🇦🇷", group: "Group B" },
  skorea: { id: "skorea", name: "South Korea", code: "KOR", flag: "🇰🇷", group: "Group B" },
  morocco: { id: "morocco", name: "Morocco", code: "MAR", flag: "🇲🇦", group: "Group B" },

  brazil: { id: "brazil", name: "Brazil", code: "BRA", flag: "🇧🇷", group: "Group C" },
  spain: { id: "spain", name: "Spain", code: "ESP", flag: "🇪🇸", group: "Group C" },
  australia: { id: "australia", name: "Australia", code: "AUS", flag: "🇦🇺", group: "Group C" },
  senegal: { id: "senegal", name: "Senegal", code: "SEN", flag: "🇸🇳", group: "Group C" },

  england: { id: "england", name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "Group D" },
  italy: { id: "italy", name: "Italy", code: "ITA", flag: "🇮🇹", group: "Group D" },
  mexico: { id: "mexico", name: "Mexico", code: "MEX", flag: "🇲🇽", group: "Group D" },
  safrica: { id: "safrica", name: "South Africa", code: "RSA", flag: "🇿🇦", group: "Group D" }
};

export const INITIAL_MATCHES: Match[] = [
  // ==================== GROUP A ====================
  {
    id: "g_a_1",
    group: "Group A",
    teamA: TEAMS.usa,
    teamB: TEAMS.germany,
    date: "2026-06-15",
    time: "14:00",
    venue: "Los Angeles Stadium",
    actualScore: { teamA: 1, teamB: 2 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 2, reason: "Germany's superior transition defense intercepts the USA's high-press counters, finding space in the half-spaces." },
      "gpt-5-5": { teamAScore: 1, teamBScore: 3, reason: "Germany controls the tempo. Musiala dominates the midfield, while USA struggles with individual errors." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "USA plays a very intense low block, and Germany struggles to unlock deep-lying defenses on opening night." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 1, reason: "A high-intensity home advantage for USA coupled with tactical fatigue in Germany's defensive rebuild favors an upset." },
      "fable-5": { teamAScore: 2, teamBScore: 2, reason: "A theatrical battle where USA rises to the legendary home atmosphere, matching Germany's technical masterclass with pure spirit." }
    }
  },
  {
    id: "g_a_2",
    group: "Group A",
    teamA: TEAMS.nigeria,
    teamB: TEAMS.japan,
    date: "2026-06-16",
    time: "17:00",
    venue: "Miami Stadium",
    actualScore: { teamA: 0, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 1, reason: "Japan's tactical discipline and coordinate moves offset Nigeria's intense physicality and individual pace." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "Osimhen exploits Japan's physical mismatch on set pieces, leading Nigeria to a narrow offensive victory." },
      "opus-4": { teamAScore: 0, teamBScore: 1, reason: "Japan controls 65% possession, slowly suffocating Nigeria's distribution lines and scoring on a late cutback." },
      "deepseek-v4": { teamAScore: 0, teamBScore: 2, reason: "Japan's spatial coordination metrics are elite; Nigeria's low defensive shape leaves too many open crossing zones." },
      "fable-5": { teamAScore: 3, teamBScore: 2, reason: "A chaotic, thrill-seeking game. Nigeria's forwards break free of Japan's rigid patterns with creative flair." }
    }
  },
  {
    id: "g_a_3",
    group: "Group A",
    teamA: TEAMS.usa,
    teamB: TEAMS.nigeria,
    date: "2026-06-21",
    time: "15:00",
    venue: "New York New Jersey Stadium",
    actualScore: { teamA: 2, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "USA's tactical pivots outpace Nigeria's flat mid-block. Pulisic finds space on the overlaps." },
      "gpt-5-5": { teamAScore: 1, teamBScore: 2, reason: "Osimhen and Chukwueze overwhelm the USA's central defense on direct counter-offensive maneuvers." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "A gritty and cagey encounter. Both teams adjust into double-pivots to secure a safety point." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 1, reason: "Home climate modeling and resting-day delta strongly favor a physical recovery and win for the USA squad." },
      "fable-5": { teamAScore: 3, teamBScore: 1, reason: "USA channels local media expectation into an offensive spectacle, scoring two rapid goals after the break." }
    }
  },
  {
    id: "g_a_4",
    group: "Group A",
    teamA: TEAMS.germany,
    teamB: TEAMS.japan,
    date: "2026-06-22",
    time: "18:00",
    venue: "Boston Stadium",
    actualScore: { teamA: 1, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Germany learns from historic upsets, matching Japan's wingbacks with inverted wingers to lock down wide avenues." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "An overwhelming show of force. Germany's inside forwards overload JPN's box via swift combinations." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "Tactical paralysis. Both coaches adopt cautious mid-blocks to minimize tournament knockout danger." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 2, reason: "Japan's rapid transition speed triggers high disruption ratios against Germany's aging center-halves." },
      "fable-5": { teamAScore: 0, teamBScore: 1, reason: "The rematch narrative! Japan's defensive loyalty and heroic blocks stun Germany once again via sub-counters." }
    }
  },
  {
    id: "g_a_5",
    group: "Group A",
    teamA: TEAMS.usa,
    teamB: TEAMS.japan,
    date: "2026-06-27",
    time: "13:00",
    venue: "Dallas Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 2, reason: "Japan's superior press-resistance neutralizes the USA's emotional home drive, executing a technical masterpiece." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "The crowd carries USA over the line. A controversial penalty settles a high-tempo, intense showdown." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "An incredibly disciplined structure from both. Neither wants to concede, as a draw sends both through." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 2, reason: "Simulation indicates a 58% probability for Japan due to higher midfield recycling rates and passing accuracy." },
      "fable-5": { teamAScore: 2, teamBScore: 3, reason: "A wild back-and-forth thriller! Japan steals it in the 94th minute, causing dramatic shockwaves in Dallas." }
    }
  },
  {
    id: "g_a_6",
    group: "Group A",
    teamA: TEAMS.germany,
    teamB: TEAMS.nigeria,
    date: "2026-06-27",
    time: "13:00",
    venue: "Atlanta Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 0, reason: "Germany’s double pivot restrains Nigeria's direct play style. Full control of the progression phases." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "Germany exploits Nigeria's defensive disorganization. Heavy pressure results in comfortable dominance." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "Germany secures a narrow knockout entry by dominating possession and starving Nigeria's wingers of service." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Nigeria's physical robust dueling limits Germany's box entries. A low block secures a hard-fought draw." },
      "fable-5": { teamAScore: 4, teamBScore: 2, reason: "A goal fest! Germany is clinical, but Nigeria's dynamic attackers strike fear with raw acceleration." }
    }
  },

  // ==================== GROUP B ====================
  {
    id: "g_b_1",
    group: "Group B",
    teamA: TEAMS.france,
    teamB: TEAMS.argentina,
    date: "2026-06-17",
    time: "15:00",
    venue: "Atlanta Stadium",
    actualScore: { teamA: 1, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 1, reason: "World-class tactical stalemate. Mbappe's speed matches Argentina's stubborn defensive rotation." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "France's athletic superiority in modern wings takes over in the final quarter, sealing a narrow win." },
      "opus-4": { teamAScore: 0, teamBScore: 0, reason: "An exhaustingly defensive game. Both setups focus entirely on security over creativity on day one." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 2, reason: "Stochastic odds peak on dynamic goal-exchange. Elite strikers on both sides score on localized defensive mistakes." },
      "fable-5": { teamAScore: 3, teamBScore: 3, reason: "The ultimate grudge match! Explosive offensive genius, passionate tackles, and dramatic VAR review decisions." }
    }
  },
  {
    id: "g_b_2",
    group: "Group B",
    teamA: TEAMS.skorea,
    teamB: TEAMS.morocco,
    date: "2026-06-18",
    time: "19:00",
    venue: "San Francisco Stadium",
    actualScore: { teamA: 1, teamB: 2 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 2, reason: "Morocco's compact low block and stellar wingback transitions nullify Son's inside runs." },
      "gpt-5-5": { teamAScore: 1, teamBScore: 1, reason: "Son scoring absolute worldies offsets Morocco's cohesive unit play, resulting in a tense draw." },
      "opus-4": { teamAScore: 0, teamBScore: 1, reason: "Classic Morocco blueprint: secure 1-0 edge from a corner header then sustain a perfect defensive structure." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 1, reason: "Korea's extreme endurance ratings drag Moroccan defenders out of position in late game phases." },
      "fable-5": { teamAScore: 1, teamBScore: 2, reason: "Morocco's legendary fans create a red cauldron. The emotional wave fuels an intense, aggressive victory." }
    }
  },
  {
    id: "g_b_3",
    group: "Group B",
    teamA: TEAMS.france,
    teamB: TEAMS.skorea,
    date: "2026-06-23",
    time: "16:00",
    venue: "Houston Stadium",
    actualScore: { teamA: 3, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 0, reason: "France commands midfield progression, isolating South Korea's forwards completely." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "Mbappe grabs a brace. France treats South Korea's high defensive line with explosive counter-attacks." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "France scores early via Griezmann, then plays keeping-on possession to neutralize Korea's weapons." },
      "deepseek-v4": { teamAScore: 3, teamBScore: 0, reason: "Massive differential in box entries. South Korea struggles with high crosses against French size." },
      "fable-5": { teamAScore: 4, teamBScore: 1, reason: "France turns on the style! A dazzling demonstration of speed and fluid artistry that can't be stopped." }
    }
  },
  {
    id: "g_b_4",
    group: "Group B",
    teamA: TEAMS.argentina,
    teamB: TEAMS.morocco,
    date: "2026-06-24",
    time: "20:00",
    venue: "Seattle Stadium",
    actualScore: { teamA: 1, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 0, reason: "Argentina's fluid central rotations drag Morocco's mid-block enough to slide an assist to Lautaro." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 0, reason: "Argentina dominates possession, outclassing Morocco's defensive attempts via stellar linkups." },
      "opus-4": { teamAScore: 0, teamBScore: 0, reason: "A tactical chess battle with zero breathing space. Both managers shut down any central channels." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Morocco's pressing intensity forces central errors, capitalizing on a quick rebound for a draw." },
      "fable-5": { teamAScore: 2, teamBScore: 1, reason: "Argentina secures victory via sheer experience and grittiness, overcoming Morocco's emotional resilience." }
    }
  },
  {
    id: "g_b_5",
    group: "Group B",
    teamA: TEAMS.france,
    teamB: TEAMS.morocco,
    date: "2026-06-28",
    time: "16:00",
    venue: "Los Angeles Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Morocco makes it incredibly difficult, but France's elite bench depth scores the winner in the 80th." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 0, reason: "An statement victory. Morocco's overextended defense gets punished repeatedly on transitions." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "France manages a hard-earned 1-0 win, relying on defensive control to prevent a historic upset." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Predicts a classic low-turnover stalemate. Morocco's high defensive blocks trigger fatigue in Mbappe's runs." },
      "fable-5": { teamAScore: 1, teamBScore: 2, reason: "The monumental upset! Inspired by historical rivalry, Morocco delivers the absolute match of their lives." }
    }
  },
  {
    id: "g_b_6",
    group: "Group B",
    teamA: TEAMS.argentina,
    teamB: TEAMS.skorea,
    date: "2026-06-28",
    time: "16:00",
    venue: "Miami Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Argentina's control of local half-spaces and quick passing triangles splits Korea's backline." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 0, reason: "Argentina puts on a show. Korea's struggles on off-ball defensive transitions are fully punished." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "Argentina gets ahead early, and then squeezes the life out of the football to protect their ranking." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 2, reason: "Korea's high forward press catches Argentina's defenders sleepwalking, forcing a major shock draw." },
      "fable-5": { teamAScore: 3, teamBScore: 1, reason: "A spectacular Messi-led masterclass, leaving Korean defenders chasing ghosts under the Miami lights." }
    }
  },

  // ==================== GROUP C ====================
  {
    id: "g_c_1",
    group: "Group C",
    teamA: TEAMS.brazil,
    teamB: TEAMS.spain,
    date: "2026-06-19",
    time: "13:00",
    venue: "Dallas Stadium",
    actualScore: { teamA: 2, teamB: 2 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 2, reason: "Brazil's individual Samba dribbling balances Spain's strict positional tik-taka dominance." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "Vinicius Jr. breaks past Spain's high-line trap. Brazil takes the elite matchup with counter-attacks." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "Spain passes Brazil to exhaustion, holding 70% share but unable to fully suppress Vinicius' threat." },
      "deepseek-v4": { teamAScore: 3, teamBScore: 2, reason: "Brazil's attacking metrics match favorably against Spain's backup keeper. Expect highly explosive scoreline." },
      "fable-5": { teamAScore: 3, teamBScore: 3, reason: "A breathtaking parade of absolute football luxury. Masterful skills, brilliant goals, and extreme emotion." }
    }
  },
  {
    id: "g_c_2",
    group: "Group C",
    teamA: TEAMS.australia,
    teamB: TEAMS.senegal,
    date: "2026-06-20",
    time: "16:00",
    venue: "Boston Stadium",
    actualScore: { teamA: 0, teamB: 2 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 0, teamBScore: 1, reason: "Senegal's physically imposing spine (Koulibaly, Jackson) dominates aerial duels and physical contests." },
      "gpt-5-5": { teamAScore: 1, teamBScore: 2, reason: "Senegal plays with intense athletic transition speed. Australia's center halves lack the recovery speed." },
      "opus-4": { teamAScore: 0, teamBScore: 0, reason: "Australia digs in with high discipline. Senegal struggles to generate dynamic play without space." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 3, reason: "Statistical mismatch: Senegal's creative progressive passes outweigh Australia's by a factor of 2.1." },
      "fable-5": { teamAScore: 2, teamBScore: 2, reason: "Australia battles with incredible heart, matching Senegal's star power with relentless physical endurance." }
    }
  },
  {
    id: "g_c_3",
    group: "Group C",
    teamA: TEAMS.brazil,
    teamB: TEAMS.australia,
    date: "2026-06-25",
    time: "14:00",
    venue: "New York New Jersey Stadium",
    actualScore: { teamA: 3, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 3, teamBScore: 0, reason: "Brazil's overload-to-isolate on the left flank systematically dismantles Australia's low block." },
      "gpt-5-5": { teamAScore: 4, teamBScore: 1, reason: "A massive statement. Vinicius and Rodrygo execute a fluid display of attacking ingenuity." },
      "opus-4": { teamAScore: 2, teamBScore: 0, reason: "Brazil breaks through with a corner header, then controls the central tempo comfortably." },
      "deepseek-v4": { teamAScore: 3, teamBScore: 1, reason: "Modeling shows low risk for Brazil, with Australia scoring a consolation prize on a late direct free-kick." },
      "fable-5": { teamAScore: 5, teamBScore: 1, reason: "A joyous celebration of beach football on the pitch! A masterclass exhibition of skills, tricks and flair." }
    }
  },
  {
    id: "g_c_4",
    group: "Group C",
    teamA: TEAMS.spain,
    teamB: TEAMS.senegal,
    date: "2026-06-26",
    time: "17:00",
    venue: "Miami Stadium",
    actualScore: { teamA: 1, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Spain's counter-pressing (Yamal, Pedri) forces rapid Senegal turnovers before they can launch counters." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 0, reason: "Yamal terrorizes the wing. Spain isolates Senegal's midfield via quick triangles." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "Spain scores early through a brilliant build-up, and restricts Senegal to only 2 shots all match." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Senegal's extreme physical presence disrupts Spain's passing tempo, resulting in a physical draw." },
      "fable-5": { teamAScore: 1, teamBScore: 2, reason: "Senegal unleashes a tactical masterclass. A stunning header shocks Spain, sparking scenes of pure joy." }
    }
  },
  {
    id: "g_c_5",
    group: "Group C",
    teamA: TEAMS.brazil,
    teamB: TEAMS.senegal,
    date: "2026-06-30",
    time: "19:00",
    venue: "Dallas Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Brazil's individual technical superiority works wonders, but Senegal's physical dueling makes it an absolute battle." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "Brazil turns up the pressure. Clinical finishing by their dynamic frontline secures an easy win." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "A stubborn Senegal defensive layout frustrates Brazil's central attackers, forcing a tactical stalemate." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 2, reason: "Upset risk modeled at 41%. Senegal's robust mid-block intercepts Brazil's build-up transitions for counters." },
      "fable-5": { teamAScore: 3, teamBScore: 2, reason: "A thriller with magical Brazilian skills countered by highly passionate African spirit. Epic final moments." }
    }
  },
  {
    id: "g_c_6",
    group: "Group C",
    teamA: TEAMS.spain,
    teamB: TEAMS.australia,
    date: "2026-06-30",
    time: "19:00",
    venue: "San Francisco Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 3, teamBScore: 0, reason: "Spain's tiki-taka works flawlessly against Australia's low blocks. Yamal and Nico Williams overload the flanks." },
      "gpt-5-5": { teamAScore: 4, teamBScore: 0, reason: "A complete routing. Spain dominates possession at 78% and executes with extreme precision." },
      "opus-4": { teamAScore: 2, teamBScore: 0, reason: "A routine victory. Spain scoring once per half while maintaining complete midfield suffocation." },
      "deepseek-v4": { teamAScore: 3, teamBScore: 0, reason: "Stochastic probability favors Spain at 84% based on massive discrepancy in progressive box passes." },
      "fable-5": { teamAScore: 2, teamBScore: 1, reason: "Australia scores a shocking opening goal, forcing a frantic Spanish turnaround fueled by young superstars." }
    }
  },

  // ==================== GROUP D ====================
  {
    id: "g_d_1",
    group: "Group D",
    teamA: TEAMS.england,
    teamB: TEAMS.italy,
    date: "2026-06-13",
    time: "16:00",
    venue: "Seattle Stadium",
    actualScore: { teamA: 0, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 1, reason: "A tactical masterclass where Bellingham's creative forward surges are nullified by Italy's double pivot." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "Kane breaks through. England's star-studded forward talent edges past Italy's defensive line." },
      "opus-4": { teamAScore: 0, teamBScore: 0, reason: "Classic opening day cagey affair. Neither manager will gamble, resulting in a defensive masterwork." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Low expected goals (xG: 0.85 to 0.92) strongly points to a structured, low-risk draw." },
      "fable-5": { teamAScore: 2, teamBScore: 2, reason: "A classic rivalry renewed. Emotional swings, heavy crunching challenges and stadium-shaking goals." }
    }
  },
  {
    id: "g_d_2",
    group: "Group D",
    teamA: TEAMS.mexico,
    teamB: TEAMS.safrica,
    date: "2026-06-14",
    time: "18:00",
    venue: "Houston Stadium",
    actualScore: { teamA: 2, teamB: 1 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 1, reason: "Mexico's high energy on the flanks stretches South Africa's deep block, scoring on low crosses." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "An energetic display in front of a heavily pro-Mexico crowd. Rapid first-half goals settle the state early." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "Mexico gets a gritty set-piece goal, then defends tenaciously to secure vital opening group points." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "South Africa's extreme speed on counters poses severe trouble, securing an unexpected draw." },
      "fable-5": { teamAScore: 3, teamBScore: 2, reason: "A festive, incredibly loud performance! Dynamic and dramatic attacking with a late Mexican winner." }
    }
  },
  {
    id: "g_d_3",
    group: "Group D",
    teamA: TEAMS.england,
    teamB: TEAMS.mexico,
    date: "2026-06-25",
    time: "18:00",
    venue: "San Francisco Stadium",
    actualScore: { teamA: 2, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 0, reason: "England's technical midfielders control central transition lanes, starving Mexico's wingers." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 1, reason: "Powerhouses triumph. Kane, Saka, and Foden overwhelm Mexico's aging deep block." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "England absorbs early Mexican emotional pressure, scoring on a disciplined corner." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 1, reason: "Mexico's intense high press catches England off-guard, forcing an errors and securing a massive point." },
      "fable-5": { teamAScore: 3, teamBScore: 2, reason: "A classic battle where England fights off a volcanic Latino crowd, pulling off a frantic victory." }
    }
  },
  {
    id: "g_d_4",
    group: "Group D",
    teamA: TEAMS.italy,
    teamB: TEAMS.safrica,
    date: "2026-06-26",
    time: "20:00",
    venue: "Los Angeles Stadium",
    actualScore: { teamA: 2, teamB: 0 }, // Completed
    predictions: {
      "gemini-3-pro": { teamAScore: 2, teamBScore: 0, reason: "Italy's tactical discipline and coordinate defense isolates South Africa's solitary striker." },
      "gpt-5-5": { teamAScore: 3, teamBScore: 0, reason: "A comfortable day for the Azzurri. Clinical clinical conversion keeps them completely in command." },
      "opus-4": { teamAScore: 1, teamBScore: 0, reason: "Classic Italian 1-0 block. Score early, shut the gates, restrict the game to absolute safety." },
      "deepseek-v4": { teamAScore: 2, teamBScore: 0, reason: "Low upset risk modeled at 12%. Italy controls spatial progress and cleans up direct counters." },
      "fable-5": { teamAScore: 3, teamBScore: 1, reason: "Italy combines stylish defense with stellar forward volleys to seal a clean and fashionable win." }
    }
  },
  {
    id: "g_d_5",
    group: "Group D",
    teamA: TEAMS.england,
    teamB: TEAMS.safrica,
    date: "2026-07-01",
    time: "15:00",
    venue: "Boston Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 3, teamBScore: 0, reason: "England's size on set-pieces combined with elite midfield service results in a highly academic win." },
      "gpt-5-5": { teamAScore: 4, teamBScore: 0, reason: "An Absolute clinical display. England sweeps South Africa aside with extreme technical superiority." },
      "opus-4": { teamAScore: 2, teamBScore: 0, reason: "England controls the game with 72% possession, passing lazily in the second half to preserve energy." },
      "deepseek-v4": { teamAScore: 3, teamBScore: 1, reason: "England wins handily, but South Africa's lightning transition forces a single defensive error." },
      "fable-5": { teamAScore: 4, teamBScore: 1, reason: "Saka waves magic! England treats fans to a festival of goals, cruising into the round of 16." }
    }
  },
  {
    id: "g_d_6",
    group: "Group D",
    teamA: TEAMS.italy,
    teamB: TEAMS.mexico,
    date: "2026-07-01",
    time: "15:00",
    venue: "Seattle Stadium",
    actualScore: null, // Upcoming
    predictions: {
      "gemini-3-pro": { teamAScore: 1, teamBScore: 1, reason: "A fierce physical struggle. Italy holds structure, but Mexico's rapid counterpress triggers a high draw potential." },
      "gpt-5-5": { teamAScore: 2, teamBScore: 1, reason: "Italy edges it. A late penalty awards Italy the victory over a frantic and aggressive Mexican squad." },
      "opus-4": { teamAScore: 1, teamBScore: 1, reason: "Very dense midfields on both sides. High discipline limits shot volumes; a point satisfies both." },
      "deepseek-v4": { teamAScore: 1, teamBScore: 2, reason: "Mexico's extreme altitude conditioning models a late physical collapse for Italy. A major upset victory!" },
      "fable-5": { teamAScore: 2, teamBScore: 2, reason: "Fierce national pride clashes! Dramatic blocks, cards, and a chaotic goal in the final seconds of play." }
    }
  }
];
