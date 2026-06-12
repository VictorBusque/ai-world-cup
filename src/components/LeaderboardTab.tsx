import { motion } from "motion/react";
import { AIModel, Match } from "../types";
import { Award, Target, Hash, Sparkles, BookOpen, AlertCircle } from "lucide-react";

interface LeaderboardTabProps {
  models: AIModel[];
  matches: Match[];
  onSelectModel: (model: AIModel) => void;
}

export default function LeaderboardTab({ models, matches, onSelectModel }: LeaderboardTabProps) {
  const completedCount = matches.filter(m => m.actualScore !== null).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Points System Summary */}
        <div id="points-system-card" className="bg-zinc-900 border-l-4 border-yellow-400 p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-yellow-400 font-display">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-xs uppercase tracking-widest font-bold">Forecasting Rules</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              AI models predict the exact final scoreline. High accuracy is rewarded through a professional points pool.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-3 border border-zinc-800">
            <div>
              <div className="text-yellow-400 font-bold font-mono uppercase tracking-wider text-[11px]">3 Points</div>
              <div className="text-[10px] text-zinc-500 uppercase">Exact Score (e.g. 2-1)</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold font-mono uppercase tracking-wider text-[11px]">1 Point</div>
              <div className="text-[10px] text-zinc-500 uppercase">Winner/Draw Outcome</div>
            </div>
          </div>
        </div>

        {/* Tournament Info */}
        <div id="tournament-info-card" className="bg-zinc-900 border-2 border-zinc-800 p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-display">
              <Target className="h-4 w-4" />
              <h3 className="text-xs uppercase tracking-widest font-black">Tournament Status</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Active tracking of group-stage fixtures. Current calculations update immediately upon any score update.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-zinc-550 text-[10px] block uppercase font-bold tracking-wider">Completed</span>
              <span className="text-white text-lg font-black">{completedCount} <span className="text-xs text-zinc-500">/ 24</span></span>
            </div>
            <div className="text-right">
              <span className="text-zinc-550 text-[10px] block uppercase font-bold tracking-wider">Live Status</span>
              <span className="text-emerald-400 text-xs font-black flex items-center gap-1 justify-end uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SIMULATOR ENGAGED
              </span>
            </div>
          </div>
        </div>

        {/* Prediction Insights - Highly styled white panel */}
        <div id="prediction-insights-card" className="bg-white text-black p-5 relative flex flex-col justify-between border-t-4 border-black shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                Bracket Leader
              </span>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                Forecast Peak
              </span>
            </div>
            <h3 className="font-display text-4xl uppercase tracking-tight leading-none mt-2 text-zinc-900">
              {models[0]?.name || "None"}
            </h3>
            <p className="text-[11px] text-zinc-700 leading-normal font-sans font-bold mt-1 max-w-xs">
              Demonstrating perfect tactical alignment based on simulated tournament data.
            </p>
          </div>
          <div className="text-xs flex items-center justify-between text-zinc-900 font-mono border-t border-zinc-200 pt-3 mt-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-650">Peak Accuracy:</span>
            <span className="font-display text-2xl text-emerald-600 font-black">{models[0]?.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Section - Striking and Heavy */}
      <div id="leaderboard-table-container" className="border-4 border-zinc-800 bg-zinc-950 p-6 rounded-none shadow-2xl">
        <div className="border-b-4 border-white pb-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-4xl uppercase tracking-tighter text-white italic">
              Model Leaderboard
            </h2>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">
              COMPILING MULTI-MODEL PREDICTION RATINGS
            </p>
          </div>
          <div className="text-xs text-zinc-300 bg-zinc-900 px-3 py-2 border border-zinc-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0" />
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              Click model to inspect full playbook & predict ledger
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-[10px] uppercase font-mono tracking-widest border-b-2 border-zinc-800">
                <th className="py-4 px-5 text-center w-16 font-black">Rank</th>
                <th className="py-4 px-4 font-black">AI Model</th>
                <th className="py-4 px-4 text-center font-black">PTS</th>
                <th className="py-4 px-4 text-center font-black">Outcome Acc %</th>
                <th className="py-4 px-4 text-center font-black">Exact (3pt)</th>
                <th className="py-4 px-4 text-center font-black">Outcome (1pt)</th>
                <th className="py-4 px-4 text-center font-black">Avg Goals</th>
                <th className="py-4 px-4 text-center font-black">Goal Dev</th>
                <th className="py-4 px-5 font-black">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {models.map((model, index) => {
                const isLeader = index === 0;
                return (
                  <motion.tr
                    key={model.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => onSelectModel(model)}
                    className={`group cursor-pointer hover:bg-zinc-900 transition-all ${
                      isLeader 
                        ? "bg-zinc-900/60 border-l-4 border-yellow-400" 
                        : "border-l-4 border-zinc-800 opacity-90 hover:opacity-100"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`font-display text-3xl leading-none ${
                          isLeader ? "text-yellow-400" : index === 1 ? "text-zinc-400" : index === 2 ? "text-amber-600" : "text-zinc-600"
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </td>

                    {/* Model Details */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-none bg-gradient-to-r ${model.avatarColor}`}></div>
                        <div>
                          <span className="font-extrabold text-sm sm:text-base text-white group-hover:text-yellow-400 transition-colors uppercase block leading-tight">
                            {model.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 block font-mono uppercase tracking-wider">
                            {model.provider}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-4 text-center">
                      <span className="text-lg font-black text-white font-mono bg-black px-3 py-1 border border-zinc-800 group-hover:border-yellow-400 transition-all">
                        {model.points}
                      </span>
                    </td>

                    {/* Accuracy Percentage */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {model.accuracy}%
                        </span>
                        <div className="w-16 h-1 bg-zinc-800 overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${model.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Exact Scores */}
                    <td className="py-4 px-4 text-center font-mono text-sm text-yellow-500 font-bold">
                      {model.exactScores}
                    </td>

                    {/* Correct Outcomes */}
                    <td className="py-4 px-4 text-center font-mono text-sm text-zinc-300">
                      {model.correctOutcomes - model.exactScores}
                    </td>

                    {/* Avg Goals */}
                    <td className="py-4 px-4 text-center font-mono text-sm text-zinc-500">
                      {model.avgPredictedGoals}
                    </td>

                    {/* Goal Deviation */}
                    <td className="py-4 px-4 text-center font-mono text-sm">
                      <span className={model.avgGoalDeviation <= 1 ? "text-emerald-400" : model.avgGoalDeviation <= 2 ? "text-yellow-400" : "text-rose-400"}>
                        {model.avgGoalDeviation.toFixed(2)}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="py-4 px-5">
                      <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider group-hover:text-zinc-200 transition-colors">
                        {model.provider}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
