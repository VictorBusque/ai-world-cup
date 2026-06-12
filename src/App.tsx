import React, { useState, useTransition, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Match, AIModel } from "./types";
import { INITIAL_MODELS, INITIAL_MATCHES, TEAMS } from "./data";
import { analyzePredictions } from "./utils";

import LeaderboardTab from "./components/LeaderboardTab";
import MatchesTab from "./components/MatchesTab";
import StandingsTab from "./components/StandingsTab";
import AnalystDeskTab from "./components/AnalystDeskTab";
import ModelDetailModal from "./components/ModelDetailModal";

import { 
  Award, Swords, BarChart3, Newspaper, Sparkles, 
  RotateCcw, Trophy, CheckSquare, Dumbbell, ShieldAlert,
  HelpCircle, RefreshCw
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "matches" | "standings" | "analyst">("leaderboard");
  const [isPending, startTransition] = useTransition();

  // Load matches from localStorage if available
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem("wc_predictor_matches_v2");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Local storage matches loading exception:", e);
    }
    return INITIAL_MATCHES;
  });

  // Highlighted diagnostics modal
  const [selectedDiagnosticModel, setSelectedDiagnosticModel] = useState<AIModel | null>(null);

  // Sync state mutation safe utility
  const saveMatches = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
    try {
      localStorage.setItem("wc_predictor_matches_v2", JSON.stringify(updatedMatches));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
  };

  // Dynamically analyze models predictions state
  const analyzedModels = useMemo(() => {
    return analyzePredictions(matches, INITIAL_MODELS);
  }, [matches]);

  // Handle score override simulation
  const handleUpdateScore = (matchId: string, scoreA: number, scoreB: number) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          actualScore: { teamA: scoreA, teamB: scoreB }
        };
      }
      return m;
    });
    saveMatches(updated);
  };

  // Handle clearing score override back to unplayed (upcoming)
  const handleClearScore = (matchId: string) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          actualScore: null
        };
      }
      return m;
    });
    saveMatches(updated);
  };

  // Reset local playground back to initial state
  const handleResetTournament = () => {
    const confirm = window.confirm("Are you sure you want to reset all simulated scores back to original World Cup group results? Custom entries will be discarded.");
    if (confirm) {
      saveMatches(INITIAL_MATCHES);
    }
  };

  // General counters
  const totalCompletedCount = matches.filter(m => m.actualScore !== null).length;
  const highestScore = analyzedModels[0]?.points ?? 0;
  const leadingModelName = analyzedModels[0]?.name ?? "None";

  const completedScoresTicker = useMemo(() => {
    const completed = matches.filter(m => m.actualScore !== null);
    if (completed.length === 0) {
      return "EGY 0-0 URU • RUS 5-0 KSA • POR 3-3 ESP • FRA 2-1 AUS";
    }
    return completed.slice(-5).map(m => 
      `${m.teamA.code} (${m.actualScore?.teamA}) - (${m.actualScore?.teamB}) ${m.teamB.code}`
    ).join(" • ");
  }, [matches]);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Stark background design grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none opacity-40"></div>
      
      {/* Top Banner Warning if Gemini Secret Is Missing */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2 text-center text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex items-center justify-center gap-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>World Cup AI Predictor Dashboard • Bold Typography Theme Active • Ready to Simulate</span>
      </div>

      {/* Main Core Header - Stark & Powerful */}
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
                Matches 1-24 active
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
            
            <div className="self-start sm:self-end">
              <button
                onClick={handleResetTournament}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-2 border-zinc-700 text-xs font-black uppercase tracking-wider transition-all"
                title="Reset all simulated values back to standard World Cup defaults"
              >
                Reset Live Simulator
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main stage section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col space-y-8 relative z-10">
        
        {/* Navigation Tabs - Brutalist & Flat */}
        <div className="border-b-2 border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap -mb-[2px]">
            {/* Tab: Leaderboard */}
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "leaderboard"
                  ? "border-yellow-400 text-white bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Award className="h-4 w-4 text-yellow-400" />
              Leaderboard
            </button>

            {/* Tab: Matches */}
            <button
              onClick={() => setActiveTab("matches")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "matches"
                  ? "border-emerald-400 text-white bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Swords className="h-4 w-4 text-emerald-400" />
              Matches & Simulator
            </button>

            {/* Tab: Standings */}
            <button
              onClick={() => setActiveTab("standings")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "standings"
                  ? "border-indigo-400 text-white bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              Standings Comparison
            </button>

            {/* Tab: Analyst Desk */}
            <button
              onClick={() => setActiveTab("analyst")}
              className={`px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-4 ${
                activeTab === "analyst"
                  ? "border-rose-400 text-white bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Newspaper className="h-4 w-4 text-rose-400" />
              Analyst Desk
            </button>
          </div>

          <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-3 py-1.5 mb-2 md:mb-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            COMPILATIONS LIVE
          </div>
        </div>

        {/* Tab content modules */}
        <div className="flex-1">
          {activeTab === "leaderboard" && (
            <LeaderboardTab 
              models={analyzedModels} 
              matches={matches}
              onSelectModel={(model) => setSelectedDiagnosticModel(model)}
            />
          )}

          {activeTab === "matches" && (
            <MatchesTab 
              matches={matches} 
              models={INITIAL_MODELS} 
              onUpdateScore={handleUpdateScore}
              onClearScore={handleClearScore}
            />
          )}

          {activeTab === "standings" && (
            <StandingsTab 
              matches={matches} 
              teams={Object.values(TEAMS)} 
              models={INITIAL_MODELS} 
            />
          )}

          {activeTab === "analyst" && (
            <AnalystDeskTab 
              models={analyzedModels} 
              matches={matches} 
            />
          )}
        </div>
      </section>

      {/* Model Diagnostic / Playbook popup */}
      <AnimatePresence>
        {selectedDiagnosticModel && (
          <ModelDetailModal
            model={selectedDiagnosticModel}
            matches={matches}
            onClose={() => setSelectedDiagnosticModel(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer copyright - Customized with ticker marquee */}
      <footer className="bg-black border-t-2 border-zinc-800 py-6 mt-12 text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            WORLD PREDICTOR TAPE • Live Refresh: Simulated Playboard Active
          </div>
          <div className="flex items-center gap-4 overflow-hidden max-w-lg">
            <span className="text-zinc-650 shrink-0 font-black uppercase text-[10px] tracking-wider text-yellow-400">LAST SCORES:</span>
            <span className="text-white text-[11px] font-semibold tracking-wider whitespace-nowrap overflow-ellipsis overflow-hidden">
              {completedScoresTicker}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
