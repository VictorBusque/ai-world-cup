import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Match, AIModel, Team, ModelPlayoffPrediction, BRACKET_ORDER } from "../types";
import { X, Award, Target, Sparkles, BookOpen, Clock, Activity, AlertCircle, Trophy } from "lucide-react";

const ROUND_META: Record<string, { label: string; short: string }> = {
  r32: { label: "ROUND OF 32", short: "R32" },
  r16: { label: "ROUND OF 16", short: "R16" },
  qf: { label: "QUARTER-FINALS", short: "QF" },
  sf: { label: "SEMI-FINALS", short: "SF" },
  bronze: { label: "BRONZE MATCH", short: "BR" },
  final: { label: "FINAL", short: "F" },
};

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "bronze", "final"] as const;

interface ModelDetailModalProps {
  model: AIModel;
  matches: Match[];
  teams: Team[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
  onClose: () => void;
}

export default function ModelDetailModal({ model, matches, teams, modelPlayoffPredictions, onClose }: ModelDetailModalProps) {
  // Show ALL matches, with or without predictions. Completed matches first.
  const modelMatches = matches.map(match => ({
    match,
    pred: match.predictions[model.id],
  })).sort((a, b) => {
    // Completed matches (with actual scores) first, then by date
    const aCompleted = a.match.actualScore !== null ? 0 : 1;
    const bCompleted = b.match.actualScore !== null ? 0 : 1;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return (a.match.date + a.match.time).localeCompare(b.match.date + b.match.time);
  });

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
              {model.persona || "Model predictions loaded from JSON data."}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

            {/* Goal Deviation */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Goal Dev</span>
              <span className={`text-2xl font-black font-mono mt-1 ${model.avgGoalDeviation <= 1 ? "text-emerald-400" : model.avgGoalDeviation <= 2 ? "text-yellow-400" : "text-rose-400"}`}>{model.avgGoalDeviation.toFixed(2)}</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Avg Off (↓ better)</span>
            </div>

            {/* Outcomes Only */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 text-center flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Outcome (1pt)</span>
              <span className="text-2xl font-black font-mono text-zinc-400 mt-1">{model.correctOutcomes - model.exactScores}</span>
              <span className="text-[9px] text-zinc-650 font-mono uppercase mt-1">Outcome only</span>
            </div>
          </div>

          {/* Group Stage Predictions History */}
          <div>
            <h3 className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-yellow-400" />
              Group Stage Predictions ({modelMatches.filter(m => m.match.actualScore !== null).length} Played / {modelMatches.length} Total)
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {modelMatches.map(({ match, pred }) => {
                const isCompleted = match.actualScore !== null;
                
                // Determine evaluation indicators
                let evaluationBadge = null;
                if (!pred) {
                  evaluationBadge = (
                    <span className="ml-auto px-2 py-1 text-[9px] uppercase font-black font-mono bg-zinc-800 text-zinc-600 border border-zinc-700">
                      No Prediction
                    </span>
                  );
                } else if (isCompleted) {
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
                    className="bg-zinc-900 p-3 rounded-none border border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-4 text-xs font-sans">
                      <div className="flex flex-col gap-0.5 min-w-[100px]">
                        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wide">{match.group} {isCompleted ? "• Completed" : "• Upcoming"}</span>
                        <div className="font-bold text-white uppercase text-xs">
                          {match.teamA.flag} {match.teamA.code} vs {match.teamB.flag} {match.teamB.code}
                        </div>
                      </div>

                      {/* Scores Comparison Block */}
                      <div className="flex items-center gap-4">
                        {/* Prediction score bubble */}
                        <div className="text-center">
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Forecast</span>
                          {pred ? (
                            <span className="font-mono font-bold text-yellow-450 bg-black border border-zinc-800 px-2.5 py-0.5 rounded-none block">
                              {pred.teamAScore} - {pred.teamBScore}
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-zinc-600 bg-black border border-zinc-800 px-2.5 py-0.5 rounded-none block">
                              —
                            </span>
                          )}
                        </div>

                        {/* Actual Score bubble */}
                        <div className="text-center">
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Actual</span>
                          <span className={`font-mono font-black bg-black/60 border px-2.5 py-0.5 rounded-none block ${isCompleted ? "text-emerald-400 border-emerald-400/30" : "text-zinc-400 border-zinc-850"}`}>
                            {isCompleted ? `${match.actualScore!.teamA}-${match.actualScore!.teamB}` : "—"}
                          </span>
                        </div>
                      </div>

                      {evaluationBadge}
                    </div>
                    {pred.summary && (
                      <div className="mt-2 text-[10px] text-zinc-400 leading-relaxed italic border-t border-zinc-800 pt-2 font-sans">
                        {pred.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playoff Predictions */}
          <PlayoffPredictionsSection modelId={model.id} teams={teams} modelPlayoffPredictions={modelPlayoffPredictions} />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-zinc-800 bg-zinc-900 flex justify-end text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-black">
          <span>AI WORLD CUP PREDICTOR PLAYGROUND</span>
        </div>
      </motion.div>
    </div>
  );
}

function PlayoffPredictionsSection({
  modelId,
  teams,
  modelPlayoffPredictions,
}: {
  modelId: string;
  teams: Team[];
  modelPlayoffPredictions: ModelPlayoffPrediction[];
}) {
  const codeToTeam = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.code, t);
    return m;
  }, [teams]);

  const mpp = modelPlayoffPredictions.find(p => p.modelId === modelId);

  if (!mpp || Object.keys(mpp.rounds).length === 0) {
    return (
      <div className="bg-zinc-900 border-2 border-zinc-800 p-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Trophy className="h-4 w-4" />
          <span className="text-[11px] uppercase font-mono tracking-wider font-extrabold">No Playoff Predictions Available</span>
        </div>
      </div>
    );
  }

  // Derive champion and runner-up
  let champion: Team | null = null;
  let runnerUp: Team | null = null;
  if (mpp.champion) champion = codeToTeam.get(mpp.champion) ?? null;
  if (mpp.runnerUp) runnerUp = codeToTeam.get(mpp.runnerUp) ?? null;

  // Count total playoff matches
  let totalPlayoffMatches = 0;
  for (const roundKey of ROUND_ORDER) {
    const roundData = mpp.rounds[roundKey];
    if (roundData) totalPlayoffMatches += Object.keys(roundData).length;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-yellow-400" />
        Playoff Bracket ({totalPlayoffMatches} Matches)
      </h3>

      {/* Champion / Runner-Up strip */}
      {champion && (
        <div className="bg-gradient-to-br from-yellow-400/10 via-zinc-900 to-zinc-900 border-2 border-yellow-400/30 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{champion.flag}</span>
            <div>
              <div className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest">Predicted Champion</div>
              <div className="font-display text-xl uppercase tracking-tight text-white">{champion.name}</div>
            </div>
          </div>
          {runnerUp && (
            <>
              <div className="text-lg text-zinc-600 font-display">VS</div>
              <div className="flex items-center gap-3">
                <span className="text-3xl opacity-60">{runnerUp.flag}</span>
                <div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Runner-Up</div>
                  <div className="font-display text-base uppercase tracking-tight text-zinc-400">{runnerUp.name}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Playoff rounds */}
      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
        {ROUND_ORDER.map(roundKey => {
          const roundData = mpp.rounds[roundKey];
          if (!roundData || Object.keys(roundData).length === 0) return null;
          const meta = ROUND_META[roundKey];

          const order = BRACKET_ORDER[roundKey] ?? [];
          const sortedMatchIds = Object.keys(roundData).sort(
            (a, b) => order.indexOf(a) - order.indexOf(b)
          );

          return (
            <div key={roundKey}>
              <div className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest font-black mb-2 border-b border-zinc-800 pb-1">
                {meta.label}
              </div>
              <div className="space-y-1.5">
                {sortedMatchIds.map(matchId => {
                  const m = roundData[matchId];
                  const teamA = codeToTeam.get(m.teamA);
                  const teamB = codeToTeam.get(m.teamB);
                  const winnerIsA = m.teamAScore > m.teamBScore;

                  return (
                    <div
                      key={matchId}
                      className="bg-zinc-900 p-2.5 border border-zinc-800"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs font-sans">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Team A */}
                          <div className={`flex items-center gap-1.5 ${winnerIsA ? "text-emerald-400" : "text-white"}`}>
                            <span className="text-sm">{teamA?.flag ?? "🏳️"}</span>
                            <span className="font-bold uppercase text-[11px] tracking-wider">{teamA?.code ?? m.teamA}</span>
                            {winnerIsA && <span className="text-[8px] font-mono">✓</span>}
                          </div>

                          {/* Score */}
                          <span className="font-mono font-bold text-yellow-450 bg-black border border-zinc-800 px-2 py-0.5 text-[11px]">
                            {m.teamAScore} - {m.teamBScore}
                          </span>

                          {/* Team B */}
                          <div className={`flex items-center gap-1.5 ${!winnerIsA ? "text-emerald-400" : "text-white"}`}>
                            <span className="text-sm">{teamB?.flag ?? "🏳️"}</span>
                            <span className="font-bold uppercase text-[11px] tracking-wider">{teamB?.code ?? m.teamB}</span>
                            {!winnerIsA && <span className="text-[8px] font-mono">✓</span>}
                          </div>
                        </div>

                        <span className="px-2 py-1 text-[9px] uppercase font-black font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                          Predicted
                        </span>
                      </div>
                      {m.summary && (
                        <div className="mt-1.5 text-[10px] text-zinc-500 leading-relaxed italic border-t border-zinc-800 pt-1.5 font-sans">
                          {m.summary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
