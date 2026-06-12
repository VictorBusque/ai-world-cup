import React, { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Match, AIModel, Team, PlayoffMatch } from "./types";
import { loadData } from "./data";
import { analyzePredictions } from "./utils";

import LeaderboardTab from "./components/LeaderboardTab";
import MatchesTab from "./components/MatchesTab";
import StandingsTab from "./components/StandingsTab";
import EvolutionTab from "./components/EvolutionTab";
import PlayoffsTab from "./components/PlayoffsTab";
import ModelDetailModal from "./components/ModelDetailModal";

import { Award, Swords, BarChart3, TrendingUp, Trophy } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "matches" | "standings" | "evolution" | "playoffs">("leaderboard");

  // Async data loading state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [baseModels, setBaseModels] = useState<AIModel[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedDiagnosticModel, setSelectedDiagnosticModel] = useState<AIModel | null>(null);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);

  // Bootstrap: load JSON data on mount
  React.useEffect(() => {
    loadData()
      .then(({ teams, matches, models, playoffMatches }) => {
        setTeams(teams);
        setBaseModels(models);
        setMatches(matches);
        if (playoffMatches) setPlayoffMatches(playoffMatches);
        setLoading(false);
      })
      .catch(err => {
        console.error("Data loading failed:", err);
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  const analyzedModels = useMemo(() => {
    return analyzePredictions(matches, baseModels);
  }, [matches, baseModels]);

  const highestScore = analyzedModels[0]?.points ?? 0;
  const leadingModelName = analyzedModels[0]?.name ?? "None";

  // Determine if playoffs are active (all group matches have scores)
  const playoffsActive = useMemo(() => {
    const groupMatches = matches.filter(m => !m.group.startsWith("Round") && !m.group.startsWith("Q") && !m.group.startsWith("S") && !m.group.startsWith("Final"));
    return groupMatches.length > 0 && groupMatches.every(m => m.actualScore !== null);
  }, [matches]);

  const completedScoresTicker = useMemo(() => {
    const completed = matches.filter(m => m.actualScore !== null);
    if (completed.length === 0) return "";
    return completed.slice(-5).map(m =>
      `${m.teamA.code} (${m.actualScore?.teamA}) - (${m.actualScore?.teamB}) ${m.teamB.code}`
    ).join(" • ");
  }, [matches]);

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-400 animate-spin mx-auto"></div>
          <div className="font-display text-2xl uppercase tracking-wider text-white">Loading models...</div>
          <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Fetching tournament data & AI predictions</div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">⚠️</div>
          <div className="font-display text-2xl uppercase tracking-wider text-white">Data Load Error</div>
          <div className="text-xs text-red-400 font-mono">{loadError}</div>
        </div>
      </main>
    );
  }

  const teamArray: Team[] = Object.values(teams);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none opacity-40"></div>

      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2 text-center text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex items-center justify-center gap-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>World Cup AI Predictor Dashboard • {baseModels.length} Models Loaded</span>
      </div>

      <header className="border-b-4 border-white bg-black p-6 sm:p-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col">
            <h1 className="font-display text-5xl sm:text-8xl leading-[0.85] tracking-tighter uppercase">
              WORLD CUP<br/>
              <span className="text-zinc-500">AI PREDICTOR</span>
            </h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="bg-white text-black px-3 py-1 text-xs font-black uppercase tracking-widest">
                Group Stage
              </span>
              <span className="border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {matches.length} Matches • {baseModels.length} Models
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-12">
            <div className="text-left lg:text-right">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Global Accuracy Max</div>
              <div className="text-5xl font-display text-emerald-400 accent-green tracking-tight leading-none">
                {highestScore > 0 ? `${Math.round(highestScore * 5.5)}%` : "N/A"}
              </div>
            </div>

            <div className="text-left lg:text-right">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Top Machine Points</div>
              <div className="text-5xl font-display text-yellow-400 leading-none">
                {highestScore} PTS
              </div>
              <div className="text-[10px] uppercase font-mono text-zinc-400 mt-2 block">
                Leader Model: <span className="text-white font-bold">{leadingModelName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col space-y-8 relative z-10">
        <div className="border-b-2 border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap -mb-[2px]">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "leaderboard" ? "border-yellow-400 text-white bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Award className="h-4 w-4 text-yellow-400" /> Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "matches" ? "border-emerald-400 text-white bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Swords className="h-4 w-4 text-emerald-400" /> Matches
            </button>
            <button
              onClick={() => setActiveTab("standings")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "standings" ? "border-indigo-400 text-white bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-indigo-400" /> Standings Comparison
            </button>
            <button
              onClick={() => setActiveTab("evolution")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "evolution" ? "border-yellow-400 text-white bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <TrendingUp className="h-4 w-4 text-yellow-400" /> Evolution
            </button>
            <button
              onClick={() => setActiveTab("playoffs")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "playoffs"
                  ? "border-yellow-400 text-white bg-zinc-900"
                  : playoffsActive
                    ? "border-transparent text-yellow-400 hover:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Trophy className="h-4 w-4 text-yellow-400" /> Playoffs
              {!playoffsActive && (
                <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 font-mono uppercase tracking-widest">soon</span>
              )}
            </button>
          </div>

          <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-3 py-1.5 mb-2 md:mb-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            READ ONLY
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "leaderboard" && (
            <LeaderboardTab models={analyzedModels} matches={matches} onSelectModel={setSelectedDiagnosticModel} />
          )}
          {activeTab === "matches" && (
            <MatchesTab matches={matches} models={analyzedModels} />
          )}
          {activeTab === "standings" && (
            <StandingsTab matches={matches} teams={teamArray} models={analyzedModels} />
          )}
          {activeTab === "evolution" && (
            <EvolutionTab models={analyzedModels} matches={matches} />
          )}
          {activeTab === "playoffs" && (
            <PlayoffsTab playoffMatches={playoffMatches} isActive={playoffsActive} />
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedDiagnosticModel && (
          <ModelDetailModal model={selectedDiagnosticModel} matches={matches} onClose={() => setSelectedDiagnosticModel(null)} />
        )}
      </AnimatePresence>

      <footer className="bg-black border-t-2 border-zinc-800 py-6 mt-12 text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            WORLD PREDICTOR TAPE • Read Only Dashboard
          </div>
          <div className="flex items-center gap-4 overflow-hidden max-w-lg">
            <span className="text-yellow-400 shrink-0 font-black uppercase text-[10px] tracking-wider">LAST SCORES:</span>
            <span className="text-white text-[11px] font-semibold tracking-wider whitespace-nowrap overflow-ellipsis overflow-hidden">
              {completedScoresTicker}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
