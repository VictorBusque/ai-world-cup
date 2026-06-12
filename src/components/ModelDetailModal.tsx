import { motion } from "motion/react";
import { Match, AIModel } from "../types";
import { X, Award, Target, Sparkles, BookOpen, Clock, Activity, AlertCircle } from "lucide-react";

interface ModelDetailModalProps {
  model: AIModel;
  matches: Match[];
  onClose: () => void;
}

export default function ModelDetailModal({ model, matches, onClose }: ModelDetailModalProps) {
  // Get all predictions of this model
  const modelMatches = matches.map(match => {
    const pred = match.predictions[model.id];
    return {
      match,
      pred
    };
  }).filter(item => item.pred !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      ></motion.div>

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-black border-4 border-zinc-400 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 rounded-none"
      >
        {/* Modal Header */}
        <div className="p-5 border-b-2 border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 shrink-0 bg-gradient-to-r ${model.avatarColor}`}></div>
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white italic">{model.name} Playbook</h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {model.provider}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-zinc-800 hover:bg-yellow-400 hover:text-black text-white font-mono uppercase text-xs font-black tracking-widest border border-zinc-700 transition-colors"
          >
            CLOSE [X]
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Identity & Strategic Vibe */}
          <div className="bg-zinc-900 p-4 border-2 border-zinc-800 rounded-none space-y-1.5">
            <div className="flex items-center gap-1.5 text-yellow-405 text-xs font-black uppercase tracking-widest font-mono">
              <Sparkles className="h-4 w-4" />
              Strategic Persona
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium italic">
              Model predictions loaded from JSON data.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Points Card */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Points</span>
              <span className="text-2xl font-black font-mono text-yellow-400 mt-1">{model.points}</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Recalculated</span>
            </div>

            {/* Accuracy Card */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Accuracy</span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-1">{model.accuracy}%</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Outcome %</span>
            </div>

            {/* Exact Scores */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Exact (3pts)</span>
              <span className="text-2xl font-black font-mono text-white mt-1">{model.exactScores}</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Gamed Scores</span>
            </div>

            {/* Outcomes Only */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Outcome (1pt)</span>
              <span className="text-2xl font-black font-mono text-zinc-400 mt-1">{model.correctOutcomes - model.exactScores}</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Outcome only</span>
            </div>
          </div>

          {/* Forecast Predictions History */}
          <div>
            <h3 className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-yellow-400" />
              Full Predictions ledger ({modelMatches.length} Matches)
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {modelMatches.map(({ match, pred }) => {
                if (!pred) return null;

                const isCompleted = match.actualScore !== null;
                
                // Determine evaluation indicators
                let evaluationBadge = null;
                if (isCompleted) {
                  const actScore = match.actualScore!;
                  const actDiff = actScore.teamA - actScore.teamB;
                  const predDiff = pred.teamAScore - pred.teamBScore;

                  const actOutcome = actDiff > 0 ? "A" : actDiff < 0 ? "B" : "D";
                  const predOutcome = predDiff > 0 ? "A" : predDiff < 0 ? "B" : "D";

                  const isExact = actScore.teamA === pred.teamAScore && actScore.teamB === pred.teamBScore;
                  const isOutcome = actOutcome === predOutcome;

                  if (isExact) {
                    evaluationBadge = (
                      <span className="ml-auto px-2 py-1 text-[9px] uppercase font-black font-mono bg-emerald-400 text-black">
                        Exact Score (+3 pts)
                      </span>
                    );
                  } else if (isOutcome) {
                    evaluationBadge = (
                      <span className="ml-auto px-2 py-1 text-[9px] uppercase font-black font-mono bg-yellow-405 text-black">
                        Outcome (+1 pt)
                      </span>
                    );
                  } else {
                    evaluationBadge = (
                      <span className="ml-auto px-2 py-1 text-[9px] uppercase font-black font-mono bg-zinc-800 text-zinc-500">
                        Miss (0 pts)
                      </span>
                    );
                  }
                } else {
                  evaluationBadge = (
                    <span className="ml-auto px-2 py-1 text-[9px] uppercase font-black font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Pending
                    </span>
                  );
                }

                return (
                  <div
                    key={match.id}
                    className="bg-zinc-900 p-3 rounded-none border border-zinc-800 flex items-center justify-between gap-4 text-xs font-sans"
                  >
                    <div className="flex flex-col gap-0.5 min-w-[100px]">
                      <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wide">{match.group} {isCompleted ? "" : "• Upcoming"}</span>
                      <div className="font-bold text-white uppercase text-xs">
                        {match.teamA.flag} {match.teamA.code} vs {match.teamB.flag} {match.teamB.code}
                      </div>
                    </div>

                    {/* Scores Comparison Block */}
                    <div className="flex items-center gap-4">
                      {/* Prediction score bubble */}
                      <div className="text-center">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Forecast</span>
                        <span className="font-mono font-bold text-yellow-450 bg-black border border-zinc-800 px-2.5 py-0.5 rounded-none block">
                          {pred.teamAScore} - {pred.teamBScore}
                        </span>
                      </div>

                      {/* Actual Score bubble */}
                      <div className="text-center">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Actual</span>
                        <span className="font-mono font-black text-zinc-400 bg-black/60 border border-zinc-850 px-2.5 py-0.5 rounded-none block">
                          {isCompleted ? `${match.actualScore!.teamA}-${match.actualScore!.teamB}` : "—"}
                        </span>
                      </div>
                    </div>

                    {evaluationBadge}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-zinc-800 bg-zinc-900 flex justify-end text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-black">
          <span>AI WORLD CUP PREDICTOR PLAYGROUND</span>
        </div>
      </motion.div>
    </div>
  );
}
