import { useMemo } from "react";
import { Team, AIModel, ModelPlayoffPrediction } from "../types";
import { Trophy, Medal, Crown, TrendingUp, BarChart3, Zap } from "lucide-react";

interface PredictionsTabProps {
  matches: never[];
  teams: Team[];
  models: AIModel[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}

interface ModelPrediction {
  modelId: string;
  modelName: string;
  provider: string;
  avatarColor: string;
  champion: Team | null;
  runnerUp: Team | null;
  bronzeWinner: Team | null;
  finalScore: string | null;
}

function buildTeamByCodeMap(teams: Team[]): Map<string, Team> {
  const m = new Map<string, Team>();
  for (const t of teams) m.set(t.code, t);
  return m;
}

export default function PredictionsTab({ teams, models, modelPlayoffPredictions }: PredictionsTabProps) {
  const codeToTeam = useMemo(() => buildTeamByCodeMap(teams), [teams]);

  const modelPredictions: ModelPrediction[] = useMemo(() => {
    const modelMap = new Map(models.map(m => [m.id, m]));

    return modelPlayoffPredictions.map((mpp) => {
      const model = modelMap.get(mpp.modelId);

      // Resolve champion & runner-up from the model's playoff final
      const champion = mpp.champion ? codeToTeam.get(mpp.champion) ?? null : null;
      const runnerUp = mpp.runnerUp ? codeToTeam.get(mpp.runnerUp) ?? null : null;

      // Resolve bronze winner
      let bronzeWinner: Team | null = null;
      const bronzeData = mpp.rounds["bronze"];
      if (bronzeData) {
        for (const m of Object.values(bronzeData)) {
          if (m.teamAScore > m.teamBScore) bronzeWinner = codeToTeam.get(m.teamA) ?? null;
          else if (m.teamBScore > m.teamAScore) bronzeWinner = codeToTeam.get(m.teamB) ?? null;
        }
      }

      // Final score
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
        provider: model?.provider ?? "",
        avatarColor: model?.avatarColor ?? "#888",
        champion,
        runnerUp,
        bronzeWinner,
        finalScore,
      };
    });
  }, [models, modelPlayoffPredictions, codeToTeam]);

  // Aggregate: count champion votes
  const championVotes = useMemo(() => {
    const votes: Record<string, { team: Team; count: number; models: string[] }> = {};
    for (const pred of modelPredictions) {
      if (!pred.champion) continue;
      const key = pred.champion.id;
      if (!votes[key]) votes[key] = { team: pred.champion, count: 0, models: [] };
      votes[key].count += 1;
      votes[key].models.push(pred.modelName);
    }
    return Object.values(votes).sort((a, b) => b.count - a.count);
  }, [modelPredictions]);

  // Aggregate: count finalist appearances (champion or runner-up)
  const finalistVotes = useMemo(() => {
    const votes: Record<string, { team: Team; count: number }> = {};
    for (const pred of modelPredictions) {
      for (const team of [pred.champion, pred.runnerUp]) {
        if (!team) continue;
        const key = team.id;
        if (!votes[key]) votes[key] = { team, count: 0 };
        votes[key].count += 1;
      }
    }
    return Object.values(votes).sort((a, b) => b.count - a.count);
  }, [modelPredictions]);

  const consensusChampion = championVotes[0];
  const maxVotes = championVotes[0]?.count || 1;

  if (modelPredictions.length === 0) {
    return (
      <div className="bg-zinc-900 border-4 border-zinc-800 p-12 text-center">
        <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
        <span className="text-white font-display text-2xl uppercase tracking-wider block">No Playoff Predictions</span>
        <span className="text-xs text-zinc-500 mt-1 block uppercase font-mono tracking-widest">Model files don't contain playoff data yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border-l-4 border-yellow-400 p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-yellow-400">
          <Trophy className="h-4 w-4" />
          <h3 className="text-xs uppercase tracking-widest font-black">Predicted Champion & Final</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Each model provided explicit playoff predictions. The champion and runner-up shown here come from each model's
          predicted <span className="text-white font-bold">final match result</span>, not derived from group stage standings.
        </p>
      </div>

      {/* Consensus Champion Card */}
      {consensusChampion && (
        <div className="bg-gradient-to-br from-yellow-400/10 via-zinc-900 to-zinc-900 border-2 border-yellow-400/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] leading-none opacity-5 font-display select-none">
            🏆
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="text-xs uppercase font-black text-yellow-400 tracking-widest">AI Consensus Champion</span>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <span className="text-6xl">{consensusChampion.team.flag}</span>
            <div>
              <div className="font-display text-4xl sm:text-5xl uppercase tracking-tight">
                {consensusChampion.team.name}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                {consensusChampion.count} of {models.length} models predict this champion
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {consensusChampion.models.map((name) => (
              <span key={name} className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider">
                {name}
              </span>
            ))}
          </div>

          {/* Vote bar */}
          <div className="mt-4 bg-zinc-950 border border-zinc-800 p-3">
            <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-2">Champion Vote Distribution</div>
            <div className="space-y-2">
              {championVotes.slice(0, 5).map((entry) => (
                <div key={entry.team.id} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{entry.team.flag}</span>
                  <span className="text-xs font-bold text-zinc-300 w-24 truncate">{entry.team.name}</span>
                  <div className="flex-1 bg-zinc-800 h-4 relative overflow-hidden">
                    <div
                      className="h-full bg-yellow-400/40 transition-all"
                      style={{ width: `${(entry.count / maxVotes) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-yellow-400 w-8 text-right">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Consensus Finalists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border-2 border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs uppercase font-black text-emerald-400 tracking-widest">Most Predicted Finalists</span>
          </div>
          <p className="text-[10px] text-zinc-500 mb-4">Teams appearing most often as champion or runner-up across all models</p>
          <div className="space-y-2">
            {finalistVotes.slice(0, 8).map((entry, i) => (
              <div key={entry.team.id} className="flex items-center gap-3 bg-zinc-950 p-2 border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-600 w-4 text-right">{i + 1}</span>
                <span className="text-lg">{entry.team.flag}</span>
                <span className="text-xs font-bold text-zinc-300 flex-1 truncate">{entry.team.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{entry.count}/{models.length}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border-2 border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span className="text-xs uppercase font-black text-indigo-400 tracking-widest">Champion Vote Breakdown</span>
          </div>
          <p className="text-[10px] text-zinc-500 mb-4">Which team each model predicts as champion</p>
          <div className="space-y-2">
            {championVotes.map((entry) => {
              const pct = Math.round((entry.count / models.length) * 100);
              return (
                <div key={entry.team.id} className="flex items-center gap-3">
                  <span className="text-lg">{entry.team.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-zinc-300">{entry.team.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-400/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-Model Predictions Table */}
      <div className="bg-zinc-900 border-2 border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-xs uppercase font-black tracking-widest text-zinc-300">Model-by-Model Playoff Predictions</span>
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
              {modelPredictions.map((pred, i) => (
                <tr
                  key={pred.modelId}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    i === 0 ? "bg-yellow-400/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pred.avatarColor }}
                      />
                      <span className="font-bold text-zinc-200">{pred.modelName}</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono">{pred.provider}</div>
                  </td>
                  <td className="px-4 py-3">
                    {pred.champion && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{pred.champion.flag}</span>
                        <span className="font-bold text-yellow-400">{pred.champion.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pred.runnerUp && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{pred.runnerUp.flag}</span>
                        <span className="font-bold text-zinc-300">{pred.runnerUp.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pred.bronzeWinner && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pred.bronzeWinner.flag}</span>
                        <span className="font-bold text-zinc-400">{pred.bronzeWinner.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pred.finalScore && (
                      <span className="font-mono font-bold text-white text-sm">{pred.finalScore}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predicted Final Visualization */}
      {consensusChampion && finalistVotes[1] && (
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-yellow-400/5 border-2 border-zinc-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <span className="text-xs uppercase font-black text-yellow-400 tracking-widest">Most Predicted Final</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <span className="text-6xl block mb-2">{consensusChampion.team.flag}</span>
              <div className="font-display text-2xl uppercase tracking-tight text-white">
                {consensusChampion.team.name}
              </div>
              <div className="text-[10px] uppercase font-mono text-yellow-400 tracking-widest mt-1">Champion ({consensusChampion.count} votes)</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-4xl text-zinc-600">VS</span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Predicted Final</span>
            </div>
            <div className="text-center">
              <span className="text-6xl block mb-2">{finalistVotes[1] ? finalistVotes[1].team.flag : "⚽"}</span>
              <div className="font-display text-2xl uppercase tracking-tight text-zinc-300">
                {finalistVotes[1] ? finalistVotes[1].team.name : "TBD"}
              </div>
              <div className="text-[10px] uppercase font-mono text-zinc-400 tracking-widest mt-1">
                Finalist ({finalistVotes[1]?.count || 0} finalist appearances)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
