import React, { useMemo, useState } from "react";
import { Team, AIModel, Match, ModelPlayoffPrediction, PlayoffMatch } from "../types";
import { BRACKET_ORDER, ROUND_ORDER, ROUND_META, ROUND_COUNTS, buildTeamByCodeMap } from "../constants";
import { Trophy, Users } from "lucide-react";

interface PlayoffsTabProps {
  matches: Match[];
  teams: Team[];
  models: AIModel[];
  playoffMatches: PlayoffMatch[];
  isActive: boolean;
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}

interface BracketMatch {
  id: string;
  roundKey: string;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: Team | null;
}

interface ModelBracket {
  modelId: string;
  modelName: string;
  avatarColor: string;
  champion: Team | null;
  runnerUp: Team | null;
  bronzeWinner: Team | null;
  finalScore: string | null;
  matches: BracketMatch[];
}

function buildModelBrackets(
  allTeams: Team[],
  models: AIModel[],
  modelPlayoffPredictions: ModelPlayoffPrediction[]
): ModelBracket[] {
  const codeToTeam = buildTeamByCodeMap(allTeams);
  const modelMap = new Map(models.map(m => [m.id, m]));

  return modelPlayoffPredictions.map((mpp) => {
    const model = modelMap.get(mpp.modelId);
    const matches: BracketMatch[] = [];

    for (const roundKey of ROUND_ORDER) {
      const roundData = mpp.rounds[roundKey];
      if (!roundData) continue;

      const order = BRACKET_ORDER[roundKey] ?? [];
      const sortedMatchIds = Object.keys(roundData).sort(
        (a, b) => order.indexOf(a) - order.indexOf(b)
      );

      for (const matchId of sortedMatchIds) {
        const m = roundData[matchId];
        const teamA = codeToTeam.get(m.teamA) ?? null;
        const teamB = codeToTeam.get(m.teamB) ?? null;
        const scoreA = m.teamAScore;
        const scoreB = m.teamBScore;
        let winner: Team | null = null;
        if (scoreA > scoreB) winner = teamA;
        else if (scoreB > scoreA) winner = teamB;

        matches.push({ id: matchId, roundKey, teamA, teamB, scoreA, scoreB, winner });
      }
    }

    let champion: Team | null = null;
    let runnerUp: Team | null = null;
    if (mpp.champion) champion = codeToTeam.get(mpp.champion) ?? null;
    if (mpp.runnerUp) runnerUp = codeToTeam.get(mpp.runnerUp) ?? null;

    let bronzeWinner: Team | null = null;
    const bronzeData = mpp.rounds["bronze"];
    if (bronzeData) {
      for (const m of Object.values(bronzeData)) {
        if (m.teamAScore > m.teamBScore) bronzeWinner = codeToTeam.get(m.teamA) ?? null;
        else if (m.teamBScore > m.teamAScore) bronzeWinner = codeToTeam.get(m.teamB) ?? null;
      }
    }

    let finalScore: string | null = null;
    const finalData = mpp.rounds["final"];
    if (finalData) {
      for (const m of Object.values(finalData)) {
        finalScore = `${m.teamAScore} - ${m.teamBScore}`;
      }
    }

    return {
      modelId: mpp.modelId,
      modelName: model?.name ?? mpp.modelId,
      avatarColor: model?.avatarColor ?? "#888",
      champion,
      runnerUp,
      bronzeWinner,
      finalScore,
      matches,
    };
  });
}

export default React.memo(function PlayoffsTab({ teams, models, modelPlayoffPredictions }: PlayoffsTabProps) {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  const modelBrackets = useMemo(
    () => buildModelBrackets(teams, models, modelPlayoffPredictions),
    [teams, models, modelPlayoffPredictions]
  );

  const selected = modelBrackets[selectedModelIndex] || null;

  // Aggregate champion votes across all models
  const championVotes = useMemo(() => {
    const votes: Record<string, { team: Team; count: number; modelNames: string[] }> = {};
    for (const mb of modelBrackets) {
      if (!mb.champion) continue;
      const key = mb.champion.id;
      if (!votes[key]) votes[key] = { team: mb.champion, count: 0, modelNames: [] };
      votes[key].count += 1;
      votes[key].modelNames.push(mb.modelName);
    }
    return Object.values(votes).sort((a, b) => b.count - a.count);
  }, [modelBrackets]);

  if (modelBrackets.length === 0) {
    return (
      <div className="bg-zinc-900 border-4 border-zinc-800 p-12 text-center">
        <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
        <span className="text-white font-display text-2xl uppercase tracking-wider block">No Playoff Predictions</span>
        <span className="text-xs text-zinc-500 mt-1 block uppercase font-mono tracking-widest">Model files don't contain playoff data yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border-l-4 border-yellow-400 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 text-yellow-400">
          <Trophy className="h-4 w-4" />
          <h3 className="text-[11px] sm:text-xs uppercase tracking-widest font-black">Predicted Playoff Brackets</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
          Each model provided explicit playoff predictions with scores for every knockout round.
          These are the <span className="text-white font-bold">actual predicted matchups and results</span> from each AI model,
          not derived from group stage standings.
        </p>
      </div>

      {/* Consensus Champion Strip */}
      {championVotes.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-400/10 via-zinc-900 to-zinc-900 border-2 border-yellow-400/30 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-[10px] sm:text-xs uppercase font-black text-yellow-400 tracking-widest">AI Consensus Playoff Champion</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {championVotes.slice(0, 3).map((entry, i) => (
              <div key={entry.team.id} className={`flex items-center gap-2 sm:gap-3 ${i === 0 ? "bg-zinc-950 border-2 border-yellow-400/40 p-2 sm:p-3" : "bg-zinc-950 border border-zinc-800 p-2"}`}>
                <span className="text-2xl sm:text-3xl">{entry.team.flag}</span>
                <div>
                  <div className={`font-display text-base sm:text-lg uppercase tracking-tight ${i === 0 ? "text-yellow-400" : "text-zinc-300"}`}>
                    {entry.team.name}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {entry.count}/{models.length} {i === 0 ? "• Consensus" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Vote bar */}
          {championVotes.length > 1 && (
            <div className="mt-4 space-y-1.5">
              {championVotes.map((entry) => (
                <div key={entry.team.id} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center">{entry.team.flag}</span>
                  <span className="text-[10px] font-bold text-zinc-400 w-20 truncate">{entry.team.code}</span>
                  <div className="flex-1 bg-zinc-800 h-3 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400/40"
                      style={{ width: `${(entry.count / championVotes[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-yellow-400 w-6 text-right">{entry.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Model Selector */}
      <div className="bg-zinc-900 border-2 border-zinc-800 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="text-[10px] sm:text-xs uppercase font-black text-zinc-400 tracking-widest">Select Model</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {modelBrackets.map((mb, i) => (
            <button
              key={mb.modelId}
              onClick={() => setSelectedModelIndex(i)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 transition-all ${
                i === selectedModelIndex
                  ? "bg-white text-black border-white"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mb.avatarColor }} />
              <span className="truncate max-w-[80px] sm:max-w-none">{mb.modelName}</span>
              {mb.champion && (
                <span className="text-sm">{mb.champion.flag}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Model's Champion */}
      {selected && selected.champion && (
        <div className="bg-zinc-900 border-2 border-yellow-400/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-4xl sm:text-6xl">{selected.champion.flag}</span>
            <div>
              <div className="text-[9px] sm:text-[10px] font-mono text-yellow-400 uppercase tracking-widest mb-1">
                {selected.modelName}'s Champion
              </div>
              <div className="font-display text-xl sm:text-3xl uppercase tracking-tight text-white">
                {selected.champion.name}
              </div>
            </div>
          </div>
          {selected.runnerUp && (
            <>
              <div className="text-xl sm:text-2xl text-zinc-600 font-display">VS</div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-3xl sm:text-5xl opacity-60">{selected.runnerUp.flag}</span>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Runner-Up</div>
                  <div className="font-display text-base sm:text-xl uppercase tracking-tight text-zinc-400">
                    {selected.runnerUp.name}
                  </div>
                </div>
              </div>
            </>
          )}
          {selected.bronzeWinner && (
            <>
              <div className="text-xl sm:text-2xl text-zinc-700 font-display">🥉</div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-4xl opacity-50">{selected.bronzeWinner.flag}</span>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Bronze</div>
                  <div className="font-display text-sm sm:text-lg uppercase tracking-tight text-zinc-500">
                    {selected.bronzeWinner.name}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bracket Display */}
      {selected && (
        <div className="overflow-x-auto pb-4 -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[700px] sm:min-w-[900px]">
            <div className="flex items-stretch gap-0">
              {ROUND_ORDER.map((roundKey, ri) => {
                const count = ROUND_COUNTS[roundKey];
                const roundMatches = selected.matches.filter(m => m.roundKey === roundKey);
                const meta = ROUND_META[roundKey];
                const gapClass = ri === 0 ? "gap-2" : ri === 1 ? "gap-4" : ri === 2 ? "gap-8" : ri === 3 ? "gap-16" : "gap-0";

                return (
                  <div key={roundKey} className="flex flex-col" style={{ flex: "0 0 200px" }}>
                    {/* Round Header */}
                    <div className="text-center py-3 border-b-2 border-zinc-800 mb-2">
                      <span className="font-display text-sm uppercase tracking-wider text-white">{meta.label}</span>
                    </div>

                    {/* Matches */}
                    <div className={`flex flex-col justify-around flex-1 ${gapClass}`}>
                      {Array.from({ length: count }, (_, i) => {
                        const match = roundMatches[i];
                        return (
                          <div key={match?.id ?? `${roundKey}_${i}`} className="flex items-center">
                            {ri > 0 && (
                              <div className="w-4 flex-shrink-0 flex items-center">
                                <div className="w-full h-px bg-zinc-700" />
                              </div>
                            )}
                            <PredictedBracketMatch match={match} isFinal={roundKey === "final"} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Models Summary Table */}
      <div className="bg-zinc-900 border-2 border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-xs uppercase font-black tracking-widest text-zinc-300">All Models — Playoff Predictions Summary</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Model</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Predicted Champion</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Predicted Runner-Up</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Bronze</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Final Score</th>
              </tr>
            </thead>
            <tbody>
              {modelBrackets.map((mb, i) => (
                <tr
                  key={mb.modelId}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                    i === selectedModelIndex ? "bg-yellow-400/5" : ""
                  }`}
                  onClick={() => setSelectedModelIndex(i)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mb.avatarColor }} />
                      <span className="font-bold text-zinc-200">{mb.modelName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {mb.champion && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mb.champion.flag}</span>
                        <span className="font-bold text-yellow-400">{mb.champion.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {mb.runnerUp && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mb.runnerUp.flag}</span>
                        <span className="font-bold text-zinc-300">{mb.runnerUp.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {mb.bronzeWinner && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{mb.bronzeWinner.flag}</span>
                        <span className="font-bold text-zinc-400">{mb.bronzeWinner.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {mb.finalScore && (
                      <span className="font-mono font-bold text-white text-sm">{mb.finalScore}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border-4 border-zinc-800 p-5">
        <h4 className="font-display text-lg uppercase tracking-wider text-yellow-400 mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0" />
          About these predictions
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Each AI model was asked to predict the entire tournament including all knockout rounds. These brackets show the
          <span className="text-white font-bold"> actual predicted matchups, scores, and winners</span> from each model — not simulated
          or derived from group stage results. Switch between models to see how each AI envisions the tournament unfolding.
        </p>
      </div>
    </div>
  );
});

function PredictedBracketMatch({
  match,
  isFinal,
}: {
  match: BracketMatch | undefined;
  isFinal: boolean;
}) {
  if (!match || (!match.teamA && !match.teamB)) {
    return (
      <div className="flex-1 border-2 bg-zinc-950 border-zinc-800/50 opacity-40 min-h-[48px]">
        <div className="px-2.5 py-1.5 border-b border-zinc-800/40 text-[11px] text-zinc-600 font-black uppercase">TBD</div>
        <div className="px-2.5 py-1.5 text-[11px] text-zinc-600 font-black uppercase">TBD</div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 border-2 transition-all ${
        isFinal
          ? "bg-zinc-900 border-yellow-400"
          : "bg-zinc-900 border-zinc-600"
      }`}
    >
      {/* Team A */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800/40 ${match.winner?.id === match.teamA?.id ? "bg-emerald-400/5" : ""}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none shrink-0">{match.teamA?.flag ?? "🏳️"}</span>
          <span className={`text-[11px] font-black uppercase tracking-wider truncate ${match.winner?.id === match.teamA?.id ? "text-emerald-400" : "text-white"}`}>
            {match.teamA?.code ?? "TBD"}
          </span>
          {match.winner?.id === match.teamA?.id && (
            <span className="text-[8px] text-emerald-400 font-mono">✓</span>
          )}
        </div>
        <span className="font-mono font-bold text-xs text-white shrink-0 ml-2">
          {match.scoreA ?? "–"}
        </span>
      </div>
      {/* Team B */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 ${match.winner?.id === match.teamB?.id ? "bg-emerald-400/5" : ""}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none shrink-0">{match.teamB?.flag ?? "🏳️"}</span>
          <span className={`text-[11px] font-black uppercase tracking-wider truncate ${match.winner?.id === match.teamB?.id ? "text-emerald-400" : "text-white"}`}>
            {match.teamB?.code ?? "TBD"}
          </span>
          {match.winner?.id === match.teamB?.id && (
            <span className="text-[8px] text-emerald-400 font-mono">✓</span>
          )}
        </div>
        <span className="font-mono font-bold text-xs text-white shrink-0 ml-2">
          {match.scoreB ?? "–"}
        </span>
      </div>
    </div>
  );
}
