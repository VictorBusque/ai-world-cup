import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Match, AIModel } from "../types";
import { scorePrediction } from "../utils";
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Swords,
  Clock,
  Goal as GoalIcon,
} from "lucide-react";

interface MatchesTabProps {
  matches: Match[];
  models: AIModel[];
}

export default React.memo(function MatchesTab({
  matches,
  models,
}: MatchesTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Derive groups dynamically from match data
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(matches.map((m) => m.group)))
      .filter(Boolean)
      .sort();
    return ["All", ...uniqueGroups];
  }, [matches]);

  const statuses = ["All", "Completed", "Live", "Upcoming"];

  // Filter & sort matches by date then time
  const filteredMatches = matches
    .filter((match) => {
      const groupMatches =
        selectedGroup === "All" || match.group === selectedGroup;
      const statusMatches =
        selectedStatus === "All" ||
        (selectedStatus === "Completed" &&
          match.status === "FINISHED" &&
          match.actualScore !== null) ||
        (selectedStatus === "Live" && match.isLive) ||
        (selectedStatus === "Upcoming" &&
          match.actualScore === null &&
          !match.isLive);
      return groupMatches && statusMatches;
    })
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  // Group filtered matches by date
  const matchesByDate: { date: string; matches: Match[] }[] = [];
  for (const match of filteredMatches) {
    const lastGroup = matchesByDate[matchesByDate.length - 1];
    if (lastGroup && lastGroup.date === match.date) {
      lastGroup.matches.push(match);
    } else {
      matchesByDate.push({ date: match.date, matches: [match] });
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to get scoring class and label based on the new points system
  // (3 pts for result, 1 pt per nailed team score → max 5/game).
  const getPredictionEvaluation = (match: Match, modelId: string) => {
    if (!match.actualScore) return null;
    const pred = match.predictions[modelId];
    if (!pred) return null;

    const { points, correctResult, teamScoresNailed, exactScoreline } = scorePrediction(pred, match.actualScore);

    if (exactScoreline) {
      return { label: "Perfect Score! (+5 PTS)", bg: "bg-emerald-500/10 border-emerald-500 text-emerald-400" };
    }
    if (correctResult && teamScoresNailed === 1) {
      return { label: "Result + Goal (+4 PTS)", bg: "bg-emerald-500/10 border-emerald-500 text-emerald-400" };
    }
    if (correctResult) {
      return { label: "Result Only (+3 PTS)", bg: "bg-yellow-500/10 border-yellow-500 text-yellow-400" };
    }
    if (teamScoresNailed === 1) {
      return { label: "Goal Only (+1 PT)", bg: "bg-sky-500/10 border-sky-500 text-sky-400" };
    }
    return { label: "Incorrect (0 PTS)", bg: "bg-zinc-950 border-zinc-800 text-zinc-600" };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters HUD */}
      <div className="w-full border-2 sm:border-4 border-zinc-800 bg-zinc-900 p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap w-full">
          {/* Groups */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">
              Group Filter
            </span>
            <div className="flex items-center gap-1 bg-black p-1 border border-zinc-800 flex-wrap overflow-x-auto">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedGroup === group
                      ? "bg-white text-black font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {group === "All" ? "All" : group}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">
              Status
            </span>
            <div className="flex items-center gap-1 bg-black p-1 border border-zinc-800">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
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
      </div>

      {/* Matches List — grouped by date */}
      <div className="space-y-6 sm:space-y-8">
        {filteredMatches.length === 0 ? (
          <div className="bg-zinc-900 border-2 sm:border-4 border-zinc-800 p-8 sm:p-12 text-center rounded-none">
            <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-3" />
            <span className="text-white font-display text-xl sm:text-2xl uppercase tracking-wider block">
              No Matches Found
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 block uppercase font-mono tracking-widest">
              Adjust filters to reveal matchups
            </span>
          </div>
        ) : (
          matchesByDate.map(({ date, matches: dateMatches }) => (
            <div key={date} className="space-y-3 sm:space-y-4">
              {/* Date header */}
              <div className="flex items-center gap-2 sm:gap-3 py-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 shrink-0" />
                <span className="font-display text-[11px] sm:text-sm uppercase tracking-widest text-yellow-400 font-black truncate">
                  {formatDate(date)}
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold shrink-0">
                  {dateMatches.length}{" "}
                  {dateMatches.length === 1 ? "match" : "matches"}
                </span>
              </div>

              {/* Matches for this date */}
              <div className="space-y-3 sm:space-y-4">
                {dateMatches.map((match) => {
                  const isExpanded = expandedMatchId === match.id;

                  return (
                    <div
                      key={match.id}
                      id={`match-card-${match.id}`}
                      className={`bg-zinc-900 border-2 sm:border-4 transition-all duration-300 rounded-none overflow-hidden ${
                        isExpanded
                          ? "border-yellow-400 shadow-2xl bg-zinc-900"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Match Header Info */}
                      <div className="px-5 py-3 border-b-2 border-zinc-800 bg-black flex items-center justify-between text-[11px] text-zinc-500 font-mono font-bold gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2 py-0.5 bg-zinc-800 text-yellow-400 border border-zinc-700 text-[10px] uppercase font-black">
                            {match.group}
                          </span>
                          {match.round && (
                            <span className="px-2 py-0.5 bg-black text-zinc-400 border border-zinc-800 text-[10px] uppercase font-bold">
                              {match.round}
                            </span>
                          )}
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            <Calendar className="h-3.5 w-3.5" /> {match.date} •{" "}
                            {match.time}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 uppercase tracking-wider text-zinc-500 shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-zinc-600" />{" "}
                          {match.venue}
                        </span>
                      </div>

                      {/* Match Body: Versus HUD */}
                      <div className="p-3 sm:p-6 flex flex-col items-center justify-between gap-4 sm:gap-6 relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-12 w-full">
                          {/* Team A */}
                          <div className="flex flex-col items-center gap-1 sm:gap-3 sm:flex-row sm:w-44 text-center sm:text-left min-w-0">
                            <span className="text-3xl sm:text-5xl filter drop-shadow select-none shrink-0">
                              {match.teamA.flag}
                            </span>
                            <div className="min-w-0">
                              <span className="font-display text-lg sm:text-2xl uppercase tracking-tight text-white block truncate leading-none">
                                {match.teamA.name}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mt-0.5">
                                {match.teamA.code}
                              </span>
                            </div>
                          </div>

                          {/* SCORE DISPLAY */}
                          <div className="flex items-center justify-center gap-2 sm:gap-3 shrink-0">
                            {match.actualScore ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                    {match.actualScore.teamA}
                                  </span>
                                  <span className="text-yellow-400 font-extrabold text-2xl">
                                    -
                                  </span>
                                  <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                    {match.actualScore.teamB}
                                  </span>
                                </div>
                                {match.halfTimeScore && (
                                  <span className="flex items-center gap-1 text-[9px] uppercase font-mono text-zinc-500 tracking-widest font-bold">
                                    <Clock className="h-2.5 w-2.5" /> HT{" "}
                                    {match.halfTimeScore.teamA}-
                                    {match.halfTimeScore.teamB}
                                  </span>
                                )}
                                <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 tracking-widest font-black">
                                  FT
                                </span>
                              </div>
                            ) : match.isLive ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                    0
                                  </span>
                                  <span className="text-red-500 font-extrabold text-2xl">
                                    -
                                  </span>
                                  <span className="text-4xl md:text-5xl font-display text-white tracking-widest leading-none">
                                    0
                                  </span>
                                </div>
                                <span className="flex items-center gap-1 text-[9px] uppercase font-mono bg-red-500/10 text-red-400 border border-red-500/40 px-1.5 py-0.5 tracking-widest font-black">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  LIVE
                                </span>
                              </div>
                            ) : (
                              <div className="text-[9px] sm:text-[10px] uppercase font-mono bg-black px-3 sm:px-3.5 py-1.5 sm:py-2 border-2 border-zinc-800 text-zinc-500 font-black tracking-widest whitespace-nowrap">
                                Upcoming
                              </div>
                            )}
                          </div>

                          {/* Team B */}
                          <div className="flex flex-col items-center gap-1 sm:gap-3 sm:flex-row-reverse sm:w-44 text-center sm:text-right min-w-0">
                            <span className="text-3xl sm:text-5xl filter drop-shadow select-none shrink-0">
                              {match.teamB.flag}
                            </span>
                            <div className="min-w-0">
                              <span className="font-display text-lg sm:text-2xl uppercase tracking-tight text-white block truncate leading-none">
                                {match.teamB.name}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest block mt-0.5">
                                {match.teamB.code}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Compare Forecasts button */}
                        <div className="flex items-center gap-3 w-full justify-center sm:justify-end border-t border-zinc-800 sm:border-t-0 pt-3 sm:pt-0">
                          <button
                            onClick={() =>
                              setExpandedMatchId(isExpanded ? null : match.id)
                            }
                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 font-display text-[11px] sm:text-sm uppercase tracking-wider transition-all border-2 ${
                              isExpanded
                                ? "bg-white text-black border-white hover:bg-zinc-200"
                                : "bg-black text-white border-zinc-800 hover:border-white"
                            }`}
                          >
                            <span>{isExpanded ? "Collapse" : "Compare"}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Goals Match Report — goal scorers timeline (completed matches only) */}
                      {match.actualScore && match.goals.length > 0 && (
                        <div className="px-5 py-4 bg-black border-t-2 border-zinc-800">
                          <div className="text-[9px] uppercase font-mono tracking-widest font-black text-zinc-500 mb-3 flex items-center gap-1.5">
                            <GoalIcon className="h-3 w-3 text-yellow-400" />{" "}
                            Goal Scorers
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
                            {/* Team A goals — right aligned toward center */}
                            <div className="flex flex-col items-end gap-1.5">
                              {match.goals
                                .filter((g) => g.team === "A")
                                .map((g, i) => (
                                  <span
                                    key={`a-${i}`}
                                    className="flex items-center gap-1.5 text-zinc-300"
                                  >
                                    <span className="text-zinc-500 font-mono text-[10px]">
                                      {g.ownGoal ? "OG " : ""}
                                      {g.penalty ? "(pen) " : ""}
                                      {g.minute}'
                                    </span>
                                    <span className="font-semibold text-right">
                                      {g.name}
                                      {g.ownGoal && (
                                        <span className="text-red-400/70 text-[10px] ml-0.5">
                                          (og)
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                ))}
                            </div>
                            {/* Team B goals — left aligned toward center */}
                            <div className="flex flex-col items-start gap-1.5">
                              {match.goals
                                .filter((g) => g.team === "B")
                                .map((g, i) => (
                                  <span
                                    key={`b-${i}`}
                                    className="flex items-center gap-1.5 text-zinc-300"
                                  >
                                    <span className="font-semibold text-left">
                                      {g.name}
                                      {g.ownGoal && (
                                        <span className="text-red-400/70 text-[10px] ml-0.5">
                                          (og)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-zinc-500 font-mono text-[10px]">
                                      {g.ownGoal ? "OG " : ""}
                                      {g.penalty ? "(pen) " : ""}
                                      {g.minute}'
                                    </span>
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Compare AI Predictions Strip in collapsed mode */}
                      {!isExpanded && (
                        <div className="px-3 sm:px-5 py-2 sm:py-3 bg-zinc-950 border-t-2 border-zinc-800 overflow-x-auto">
                          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2 sm:gap-x-4 text-[10px] sm:text-[11px] text-zinc-400">
                            <span className="font-mono text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-yellow-400 shrink-0">
                              AI:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {models.map((model) => {
                                const pred = match.predictions[model.id];
                                if (!pred) return null;
                                const evalStats = getPredictionEvaluation(
                                  match,
                                  model.id,
                                );

                                return (
                                  <div
                                    key={model.id}
                                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 font-mono border whitespace-nowrap ${
                                      evalStats
                                        ? evalStats.bg
                                        : "bg-black border-zinc-800"
                                    }`}
                                  >
                                    <span className="text-zinc-500 font-sans mr-1 text-[9px] sm:text-[10px] uppercase font-bold">
                                      {model.name}:
                                    </span>
                                    <span className="font-extrabold text-white text-[11px] sm:text-[12px]">
                                      {pred.teamAScore}-{pred.teamBScore}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
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
                            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                              {/* Models Predictions List */}
                              <div>
                                <h3 className="text-[10px] sm:text-xs uppercase font-mono tracking-widest font-black text-zinc-400 mb-3 sm:mb-4 flex items-center gap-2">
                                  <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
                                  Model Prediction Ledger
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                                  {models.map((model) => {
                                    const pred = match.predictions[model.id];
                                    if (!pred) return null;
                                    const evalStats = getPredictionEvaluation(
                                      match,
                                      model.id,
                                    );

                                    return (
                                      <div
                                        key={model.id}
                                        className="bg-zinc-900 border-2 border-zinc-800 p-3 sm:p-4 rounded-none flex flex-col justify-between"
                                      >
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <div
                                              className={`w-2 sm:w-2.5 h-2 sm:h-2.5 bg-gradient-to-r ${model.avatarColor}`}
                                            ></div>
                                            <span className="font-black text-[11px] sm:text-xs text-white uppercase block truncate tracking-wider">
                                              {model.name}
                                            </span>
                                          </div>

                                          {/* Predicted Score Bubble */}
                                          <div className="text-center bg-black border border-zinc-800 p-2 font-mono mb-3">
                                            <div className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                                              Predicted
                                            </div>
                                            <div className="font-display text-xl sm:text-2xl text-yellow-400">
                                              {pred.teamAScore}{" "}
                                              <span className="text-zinc-700">
                                                :
                                              </span>{" "}
                                              {pred.teamBScore}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Result Scoring Evaluator */}
                                        {evalStats && (
                                          <div
                                            className={`text-center py-1.5 sm:py-2 px-2 text-[9px] sm:text-[10px] uppercase font-mono font-black border-2 ${evalStats.bg}`}
                                          >
                                            {evalStats.label}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
