import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Match, AIModel, Team } from "../types";
import { 
  Calendar, MapPin, ChevronDown, ChevronUp, Sparkles, Check, 
  RotateCcw, Info, MessageSquare, AlertTriangle, Swords, Edit2
} from "lucide-react";

interface MatchesTabProps {
  matches: Match[];
  models: AIModel[];
  onUpdateScore: (matchId: string, teamAScore: number, teamBScore: number) => void;
  onClearScore: (matchId: string) => void;
}

export default function MatchesTab({ matches, models, onUpdateScore, onClearScore }: MatchesTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Match result simulation editing state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState<number>(0);
  const [editScoreB, setEditScoreB] = useState<number>(0);

  // Gemini specific match briefing state
  const [briefingLoading, setBriefingLoading] = useState<string | null>(null);
  const [matchBriefings, setMatchBriefings] = useState<Record<string, string>>({});
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const groups = ["All", "Group A", "Group B", "Group C", "Group D"];
  const statuses = ["All", "Completed", "Upcoming"];

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const groupMatches = selectedGroup === "All" || match.group === selectedGroup;
    const statusMatches = 
      selectedStatus === "All" || 
      (selectedStatus === "Completed" && match.actualScore !== null) ||
      (selectedStatus === "Upcoming" && match.actualScore === null);
    return groupMatches && statusMatches;
  });

  const handleStartEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setEditScoreA(match.actualScore?.teamA ?? 0);
    setEditScoreB(match.actualScore?.teamB ?? 0);
  };

  const handleSaveEdit = (matchId: string) => {
    onUpdateScore(matchId, editScoreA, editScoreB);
    setEditingMatchId(null);
  };

  const handleFetchBriefing = async (match: Match) => {
    setBriefingLoading(match.id);
    setBriefingError(null);
    try {
      // Build a neat prompt package
      const matchDetails = {
        group: match.group,
        teamA: match.teamA.name,
        teamB: match.teamB.name,
        predictions: Object.entries(match.predictions).map(([modelId, pred]) => {
          const modelName = models.find(m => m.id === modelId)?.name || modelId;
          return {
            modelName,
            predictedScore: `${pred.teamAScore}-${pred.teamBScore}`,
            justification: pred.reason
          };
        })
      };

      const response = await fetch("/api/gemini/explain-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchDetails })
      });

      if (!response.ok) {
        throw new Error("Unable to retrieve tactical briefing from the Gemini service.");
      }

      const data = await response.json();
      setMatchBriefings(prev => ({ ...prev, [match.id]: data.text }));
    } catch (err: any) {
      console.error(err);
      setBriefingError(err.message || "Failed to contact analysis server.");
    } finally {
      setBriefingLoading(null);
    }
  };

  // Helper to get scoring class and label
  const getPredictionEvaluation = (match: Match, modelId: string) => {
    if (!match.actualScore) return null;
    const pred = match.predictions[modelId];
    if (!pred) return null;

    const actScore = match.actualScore;
    const actDiff = actScore.teamA - actScore.teamB;
    const predDiff = pred.teamAScore - pred.teamBScore;

    const actOutcome = actDiff > 0 ? "A" : actDiff < 0 ? "B" : "D";
    const predOutcome = predDiff > 0 ? "A" : predDiff < 0 ? "B" : "D";

    const isExact = actScore.teamA === pred.teamAScore && actScore.teamB === pred.teamBScore;
    const isOutcome = actOutcome === predOutcome;

    if (isExact) {
      return { label: "Exact Score! (+3 PTS)", bg: "bg-emerald-500/10 border-emerald-500 text-emerald-400" };
    } else if (isOutcome) {
      return { label: "Outcome Only (+1 PT)", bg: "bg-yellow-500/10 border-yellow-500 text-yellow-400" };
    } else {
      return { label: "Incorrect (0 PTS)", bg: "bg-zinc-950 border-zinc-850 text-zinc-600" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters HUD */}
      <div className="bg-zinc-90 w-full border-4 border-zinc-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Groups */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">Group Filter</span>
            <div className="flex items-center gap-1 bg-black p-1 border border-zinc-800">
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                    selectedGroup === group 
                      ? "bg-white text-black font-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {group === "All" ? "All Groups" : group}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">Status Filter</span>
            <div className="flex items-center gap-1 bg-black p-1 border border-zinc-800">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                    selectedStatus === status 
                      ? "bg-white text-black font-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-405 flex items-center gap-2 bg-zinc-950 p-4 border border-zinc-800 max-w-sm rounded-none">
          <Info className="h-4 w-4 text-yellow-400 shrink-0" />
          <span className="font-mono text-[10px] tracking-wider uppercase font-bold">
            <strong className="text-white">Simulator Deck:</strong> override scores under the steppers to see prediction results alter in real-time!
          </span>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-6">
        {filteredMatches.length === 0 ? (
          <div className="bg-zinc-900 border-4 border-zinc-800 p-12 text-center rounded-none">
            <AlertTriangle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
            <span className="text-white font-display text-2xl uppercase tracking-wider block">No Matches Found</span>
            <span className="text-xs text-zinc-500 mt-1 block uppercase font-mono tracking-widest">Adjust filters to reveal matchups</span>
          </div>
        ) : (
          filteredMatches.map(match => {
            const isExpanded = expandedMatchId === match.id;
            const isEditing = editingMatchId === match.id;
            const hasBriefing = matchBriefings[match.id] !== undefined;

            return (
              <div 
                key={match.id}
                id={`match-card-${match.id}`}
                className={`bg-zinc-900 border-4 transition-all duration-300 rounded-none overflow-hidden ${
                  isExpanded ? "border-yellow-400 shadow-2xl bg-zinc-900" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Match Header Info */}
                <div className="px-5 py-3 border-b-2 border-zinc-800 bg-black flex items-center justify-between text-[11px] text-zinc-450 font-mono font-bold">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-zinc-800 text-yellow-400 border border-zinc-700 text-[10px] uppercase font-black">
                      {match.group}
                    </span>
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5" /> {match.date} • {match.time}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 uppercase tracking-wider text-zinc-500">
                    <MapPin className="h-3.5 w-3.5 text-zinc-650" /> {match.venue}
                  </span>
                </div>

                {/* Match Body: Versus HUD */}
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                  <div className="flex items-center justify-center gap-6 md:gap-12 w-full md:w-auto">
                    {/* Team A */}
                    <div className="flex flex-col md:flex-row items-center gap-3 w-32 md:w-44 text-center md:text-left">
                      <span className="text-5xl filter drop-shadow select-none shrink-0">{match.teamA.flag}</span>
                      <div>
                        <span className="font-display text-2xl uppercase tracking-tight text-white block truncate leading-none">{match.teamA.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mt-0.5">{match.teamA.code} • GROUP SEED</span>
                      </div>
                    </div>

                    {/* SCORE & SIMULATOR CONTROL */}
                    <div className="flex items-center justify-center gap-3 min-w-[140px]">
                      {isEditing ? (
                        <div className="flex items-center gap-3 bg-black p-2 border-2 border-zinc-800">
                          {/* Score A Stepper */}
                          <div className="flex flex-col items-center">
                            <button 
                              onClick={() => setEditScoreA(s => Math.min(15, s + 1))}
                              className="text-zinc-500 hover:text-white px-2 font-black text-xs h-6 hover:bg-zinc-800"
                            >
                              ▲
                            </button>
                            <span className="font-mono text-xl font-black text-white px-2 tabular-nums">{editScoreA}</span>
                            <button 
                              onClick={() => setEditScoreA(s => Math.max(0, s - 1))}
                              className="text-zinc-500 hover:text-white px-2 font-black text-xs h-6 hover:bg-zinc-800"
                            >
                              ▼
                            </button>
                          </div>

                          <span className="text-yellow-400 font-black text-lg">:</span>

                          {/* Score B Stepper */}
                          <div className="flex flex-col items-center">
                            <button 
                              onClick={() => setEditScoreB(s => Math.min(15, s + 1))}
                              className="text-zinc-500 hover:text-white px-2 font-black text-xs h-6 hover:bg-zinc-800"
                            >
                              ▲
                            </button>
                            <span className="font-mono text-xl font-black text-white px-2 tabular-nums">{editScoreB}</span>
                            <button 
                              onClick={() => setEditScoreB(s => Math.max(0, s - 1))}
                              className="text-zinc-500 hover:text-white px-2 font-black text-xs h-6 hover:bg-zinc-800"
                            >
                              ▼
                            </button>
                          </div>

                          <div className="flex flex-col gap-1.5 ml-1">
                            <button
                              onClick={() => handleSaveEdit(match.id)}
                              className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-wider"
                              title="Commit score"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingMatchId(null)}
                              className="p-1 text-zinc-500 hover:text-white text-[9px] uppercase font-mono underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {match.actualScore ? (
                            <div className="flex items-center gap-3">
                              <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                {match.actualScore.teamA}
                              </span>
                              <span className="text-yellow-400 font-extrabold text-2xl">-</span>
                              <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                {match.actualScore.teamB}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] uppercase font-mono bg-black px-3.5 py-2 border-2 border-zinc-800 text-zinc-500 font-black tracking-widest">
                              Upcoming
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleStartEdit(match)}
                              className="p-2 bg-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all font-mono text-[9px] uppercase tracking-wider flex items-center gap-1"
                              title="Override score / simulate outcome"
                            >
                              <Edit2 className="h-3 w-3" /> INT
                            </button>
                            {match.actualScore && (
                              <button
                                onClick={() => onClearScore(match.id)}
                                className="p-2 bg-black hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-800 transition-all"
                                title="Reset score to Upcoming"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-3 w-32 md:w-44 text-center md:text-right">
                      <span className="text-5xl filter drop-shadow select-none shrink-0">{match.teamB.flag}</span>
                      <div>
                        <span className="font-display text-2xl uppercase tracking-tight text-white block truncate leading-none">{match.teamB.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono selector uppercase tracking-widest block mt-0.5">{match.teamB.code} • GROUP SEED</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Compare Forecasts button */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-zinc-800 md:border-t-0 pt-4 md:pt-0">
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                      className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 font-display text-sm uppercase tracking-wider transition-all border-2 ${
                        isExpanded 
                          ? "bg-white text-black border-white hover:bg-zinc-200" 
                          : "bg-black text-white border-zinc-800 hover:border-white"
                      }`}
                    >
                      <span>{isExpanded ? "Collapse Predictions" : "Compare Predictions"}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Compare AI Predictions Strip in collapsed state */}
                {!isExpanded && (
                  <div className="px-5 py-3 bg-zinc-950 border-t-2 border-zinc-800 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[11px] text-zinc-400">
                    <span className="font-mono text-[9px] uppercase font-black tracking-widest text-yellow-400">AI predictions:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {models.map(model => {
                        const pred = match.predictions[model.id];
                        if (!pred) return null;
                        const evalStats = getPredictionEvaluation(match, model.id);
                        
                        return (
                          <div 
                            key={model.id} 
                            style={{ contentVisibility: "auto" }}
                            className={`px-2.5 py-1 font-mono border-2 ${
                              evalStats 
                                ? evalStats.bg.replace("text-", "border-").replace("bg-", "bg-opacity-5 ") 
                                : "bg-black border-zinc-850"
                            }`}
                          >
                            <span className="text-zinc-500 font-sans mr-1 text-[10px] uppercase font-bold">{model.name.split(" ")[0]}:</span>
                            <span className="font-extrabold text-white text-[12px]">{pred.teamAScore}-{pred.teamBScore}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded Panel Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t-2 border-zinc-800 bg-zinc-950"
                    >
                      <div className="p-6 space-y-6">
                        {/* Models Predictions List */}
                        <div>
                          <h3 className="text-xs uppercase font-mono tracking-widest font-black text-zinc-400 mb-4 flex items-center gap-2">
                            <Swords className="h-4 w-4 text-yellow-400" />
                            Model Prediction Ledger & Assertions
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            {models.map(model => {
                              const pred = match.predictions[model.id];
                              if (!pred) return null;
                              const evalStats = getPredictionEvaluation(match, model.id);

                              return (
                                <div 
                                  key={model.id}
                                  className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`w-2.5 h-2.5 bg-gradient-to-r ${model.avatarColor}`}></div>
                                      <span className="font-black text-xs text-white uppercase block truncate tracking-wider">{model.name}</span>
                                    </div>

                                    {/* Predicted Score Bubble */}
                                    <div className="text-center bg-black border border-zinc-800 p-2 font-mono mb-3">
                                      <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Predicted</div>
                                      <div className="font-display text-2xl text-yellow-400">
                                        {pred.teamAScore} <span className="text-zinc-700">:</span> {pred.teamBScore}
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-zinc-400 leading-relaxed italic mb-4">
                                      "{pred.reason}"
                                    </p>
                                  </div>

                                  {/* Result Scoring Evaluator */}
                                  {evalStats && (
                                    <div className={`text-center py-2 px-2 text-[10px] uppercase font-mono font-black border-2 ${evalStats.bg}`}>
                                      {evalStats.label}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Ask Gemini Tactical Insight Section */}
                        <div className="border-t border-zinc-800 pt-6">
                          <div className="bg-zinc-900 border-2 border-zinc-800 p-5 relative overflow-hidden">
                            
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                                <div>
                                  <h4 className="font-display text-lg uppercase tracking-wider text-white">Gemini Tactician Commentary</h4>
                                  <p className="text-[11px] font-mono text-zinc-450 uppercase mt-0.5 tracking-wider">
                                    Compare divergent model metrics using server-side Gemini 3.5 Flash logic!
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleFetchBriefing(match)}
                                disabled={briefingLoading === match.id}
                                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-800 text-black font-extrabold uppercase text-[11px] tracking-widest transition-all"
                              >
                                {briefingLoading === match.id ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-black/50 border-t-black rounded-full animate-spin"></span>
                                    Synthesizing forecast data...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="h-4 w-4" />
                                    Generate Tactical Breakdown
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Briefing Response Display */}
                            {briefingError && (
                              <div className="bg-rose-950/20 text-rose-450 p-4 rounded-none border-2 border-rose-900 text-xs flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{briefingError}</span>
                              </div>
                            )}

                            {hasBriefing ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="prose prose-invert prose-xs max-w-none text-zinc-300 bg-black p-4 border border-zinc-800 leading-relaxed font-sans space-y-3"
                              >
                                {matchBriefings[match.id].split("\n\n").map((para, pIdx) => (
                                  <p key={pIdx} className="text-xs">
                                    {para.split("\n").map((line, lIdx) => {
                                      // Minimal bold formatting highlight
                                      if (line.startsWith("**") && line.indexOf("**: ") !== -1) {
                                        const endIdx = line.indexOf("**: ") + 4;
                                        return (
                                          <span key={lIdx} className="block mb-1">
                                            <span className="text-yellow-400 font-bold uppercase tracking-wider">{line.substring(0, endIdx)}</span>
                                            {line.substring(endIdx)}
                                          </span>
                                        );
                                      }
                                      return <span key={lIdx} className="block">{line}</span>;
                                    })}
                                  </p>
                                ))}
                              </motion.div>
                            ) : (
                              !briefingLoading && !briefingError && (
                                <div className="text-center py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                  No briefs generated. Click above to let Gemini synthesize technical variables.
                                </div>
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
