import React, { useState, useMemo } from "react";
import { Match, Team, AIModel } from "../types";
import {
  calculateActualStandings,
  calculatePredictedStandings,
} from "../utils";
import { Flame, Star, CheckCircle, TrendingUp, HelpCircle } from "lucide-react";

interface StandingsTabProps {
  matches: Match[];
  teams: Team[];
  models: AIModel[];
  rawPredictions: Record<string, Record<string, Record<string, number | string>>>;
}

export default React.memo(function StandingsTab({
  matches,
  teams,
  models,
  rawPredictions,
}: StandingsTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("Group A");
  const [selectedModelId, setSelectedModelId] = useState<string>(
    models[0]?.id || "",
  );

  // Derive groups dynamically from team data
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(teams.map(t => t.group))).filter(Boolean).sort();
    return uniqueGroups;
  }, [teams]);

  // Team list as array
  const teamArray = Object.values(teams);

  // Standings
  const actualStandings = calculateActualStandings(
    selectedGroup,
    teamArray,
    matches,
  );
  const predictedStandings = calculatePredictedStandings(
    selectedGroup,
    teamArray,
    matches,
    selectedModelId,
    rawPredictions[selectedModelId],
  );

  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Check if model's predicted qualifying teams (top 2) match the absolute/actual qualifying teams (top 2)
  const actualQualifiers = actualStandings.slice(0, 2).map((s) => s.teamId);
  const predictedQualifiers = predictedStandings
    .slice(0, 2)
    .map((s) => s.teamId);

  const correctQualifierCount = predictedQualifiers.filter((tId) =>
    actualQualifiers.includes(tId),
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Controls Bar */}
      <div className="w-full border-2 sm:border-4 border-zinc-400 bg-zinc-900 p-3 sm:p-5 flex flex-col gap-3 sm:flex-row md:items-center justify-between sm:gap-4">
        {/* Group Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">
            Select Group
          </span>
          <div className="flex bg-black p-1 border border-zinc-800 self-start flex-wrap gap-0">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                  selectedGroup === group
                    ? "bg-white text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-widest">
            Select Forecast Model
          </span>
          <div className="flex bg-black border border-zinc-800">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 sm:py-2 border-none outline-none cursor-pointer font-mono w-full sm:w-auto"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Standings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Actual Standings */}
        <div className="border-2 sm:border-4 border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl rounded-none">
          <div className="p-3 sm:p-4 bg-black border-b-2 border-zinc-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-xl uppercase tracking-tight text-white flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                Actual Standings
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-500 mt-0.5">
                Based on submitted results
              </p>
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-black bg-zinc-800 border border-zinc-700 text-yellow-400 uppercase tracking-widest shrink-0">
              {selectedGroup} LIVE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest border-b-2 border-zinc-800">
                  <th className="py-2 sm:py-3 px-2 sm:px-4 w-10 sm:w-12 text-center font-black">#</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 font-black">Team</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 text-center font-black">P</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">W</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">D</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">L</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 text-center font-black">GD</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-white font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {actualStandings.map((row, idx) => {
                  const isQualifying = idx < 2;
                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isQualifying
                          ? "bg-emerald-950/10 border-l-4 border-emerald-400"
                          : "border-l-4 border-transparent"
                      }`}
                    >
                      <td className="py-2 sm:py-3.5 px-2 sm:px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 font-mono text-[10px] sm:text-xs font-black ${
                            isQualifying
                              ? "bg-emerald-400 text-black"
                              : "bg-black text-zinc-500 border border-zinc-800"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 font-extrabold text-white text-[11px] sm:text-[13px] uppercase tracking-wide">
                        <span className="mr-1 sm:mr-2 text-base sm:text-xl select-none">
                          {row.flag}
                        </span>
                        <span>{row.teamName}</span>
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-center font-mono font-bold text-zinc-300">
                        {row.played}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.won}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.drawn}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.lost}
                      </td>
                      <td
                        className={`py-2 sm:py-3.5 px-2 sm:px-3 text-center font-mono font-black ${
                          row.gd > 0
                            ? "text-emerald-400"
                            : row.gd < 0
                              ? "text-red-400"
                              : "text-zinc-400"
                        }`}
                      >
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-4 text-center font-mono font-black text-xs sm:text-sm text-white">
                        {row.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-2 sm:p-3 bg-black text-[8px] sm:text-[9px] font-mono text-zinc-500 border-t-2 border-zinc-800 text-center uppercase tracking-widest font-bold">
            🟢 TOP TWO qualify for knockout rounds
          </div>
        </div>

        {/* Predicted Standings */}
        <div className="border-2 sm:border-4 border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl rounded-none">
          <div className="p-3 sm:p-4 bg-black border-b-2 border-zinc-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-xl uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 shrink-0" />
                Forecast: {selectedModel?.name}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-500 mt-0.5">
                derived from model predictions
              </p>
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-black bg-zinc-800 border border-zinc-700 text-emerald-400 uppercase tracking-widest shrink-0">
              MODEL FORECAST
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest border-b-2 border-zinc-800">
                  <th className="py-2 sm:py-3 px-2 sm:px-4 w-10 sm:w-12 text-center font-black">#</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 font-black">Team</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 text-center font-black">P</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">W</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">D</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-2 text-center text-zinc-400 font-black">L</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-3 text-center font-black">GD</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-yellow-400 font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {predictedStandings.map((row, idx) => {
                  const isQualifying = idx < 2;
                  const correctlyPredictedQualifying =
                    actualQualifiers.includes(row.teamId);

                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isQualifying
                          ? "bg-yellow-950/10 border-l-4 border-yellow-400"
                          : "border-l-4 border-transparent"
                      }`}
                    >
                      <td className="py-2 sm:py-3.5 px-2 sm:px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 font-mono text-[10px] sm:text-xs font-black ${
                            isQualifying
                              ? "bg-yellow-400 text-black"
                              : "bg-black text-zinc-500 border border-zinc-800"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 font-extrabold text-white text-[11px] sm:text-[13px] uppercase tracking-wide">
                        <span className="mr-1 sm:mr-2 text-base sm:text-xl select-none">
                          {row.flag}
                        </span>
                        <span>{row.teamName}</span>
                        {isQualifying && correctlyPredictedQualifying && (
                          <span
                            className="ml-1 text-[9px] sm:text-[10px] bg-emerald-500 text-black px-1 py-0.5 font-bold uppercase tracking-wider"
                            title="Correctly predicted as qualifier!"
                          >
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-center font-mono font-bold text-zinc-300">
                        {row.played}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.won}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.drawn}
                      </td>
                      <td className="py-2 sm:py-3.5 px-1 sm:px-2 text-center font-mono text-zinc-500">
                        {row.lost}
                      </td>
                      <td
                        className={`py-2 sm:py-3.5 px-2 sm:px-3 text-center font-mono font-black ${
                          row.gd > 0
                            ? "text-yellow-400"
                            : row.gd < 0
                              ? "text-red-400"
                              : "text-zinc-400"
                        }`}
                      >
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-4 text-center font-mono font-black text-xs sm:text-sm text-yellow-400">
                        {row.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-2 sm:p-3 bg-black text-[9px] sm:text-[10px] text-zinc-400 border-t-2 border-zinc-800 text-center">
            {correctQualifierCount === 2 ? (
              <span className="text-emerald-400 font-extrabold uppercase tracking-wider font-mono flex items-center justify-center gap-1 text-[9px] sm:text-[10px]">
                <CheckCircle className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /> PERFECT
                PREDICTED QUALIFIERS! (2/2)
              </span>
            ) : correctQualifierCount === 1 ? (
              <span className="text-yellow-400 font-extrabold uppercase tracking-wider font-mono flex items-center justify-center gap-1 text-[9px] sm:text-[10px]">
                <TrendingUp className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /> 1/2 QUALIFIERS
                ACCURATE
              </span>
            ) : (
              <span className="text-zinc-500 font-extrabold tracking-wider font-mono uppercase text-[9px] sm:text-[10px]">
                0/2 QUALIFIERS MATCHED SO FAR
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Analysis panel */}
      <div
        id="compare-standings-insight-card"
        className="bg-zinc-900 border-2 sm:border-4 border-zinc-800 p-4 sm:p-5 rounded-none"
      >
        <h4 className="font-display text-base sm:text-lg uppercase tracking-wider text-yellow-400 mb-2 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          How to read this comparison?
        </h4>
        <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed font-sans">
          The <span className="text-white font-bold">Actual Standings</span>{" "}
          illustrates the current group leaderboard based on simulated live
          scores. The{" "}
          <span className="text-white font-bold">Forecast Model</span> shows the
          group table generated automatically if every match concludes exactly
          in line with the selected AI model's score predictions. Comparing the
          two showcases how close the model's projections align with actual
          tournament developments!
        </p>
      </div>
    </div>
  );
});
