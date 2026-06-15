import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Match, AIModel, Team, ModelPlayoffPrediction, PlayoffMatch } from "./types";
import { loadData } from "./data";
import { analyzePredictions } from "./utils";

import LeaderboardTab from "./components/LeaderboardTab";
import MatchesTab from "./components/MatchesTab";
import StandingsTab from "./components/StandingsTab";
import EvolutionTab from "./components/EvolutionTab";
import PlayoffsTab from "./components/PlayoffsTab";
import PredictionsTab from "./components/PredictionsTab";
import ModelDetailModal from "./components/ModelDetailModal";

import { Award, Swords, BarChart3, TrendingUp, Trophy, Eye, RefreshCw } from "lucide-react";

// ── Error Boundary ──────────────────────────────────────────────────────────
import type { ReactNode } from "react";

type EBProps = { children: ReactNode };
type EBState = { hasError: boolean; error: Error | null };

class ErrorBoundary extends React.Component<EBProps, EBState> {
  public state: EBState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="text-6xl">💥</div>
            <div className="font-display text-2xl uppercase tracking-wider text-white">Something went wrong</div>
            <div className="text-xs text-red-400 font-mono whitespace-pre-wrap">{this.state.error?.message}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

// ── Tab type ────────────────────────────────────────────────────────────────
type TabId = "leaderboard" | "matches" | "standings" | "evolution" | "playoffs" | "predictions";

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("leaderboard");

  // Async data loading state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [baseModels, setBaseModels] = useState<AIModel[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedDiagnosticModel, setSelectedDiagnosticModel] = useState<AIModel | null>(null);
  const [rawPredictions, setRawPredictions] = useState<Record<string, Record<string, Record<string, number | string>>>>({});
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [modelPlayoffPredictions, setModelPlayoffPredictions] = useState<ModelPlayoffPrediction[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Bootstrap: load JSON data on mount
  useEffect(() => {
    loadData()
      .then(({ teams, matches, models, rawPredictions, playoffMatches, modelPlayoffPredictions }) => {
        setTeams(teams);
        setBaseModels(models);
        setMatches(matches);
        setRawPredictions(rawPredictions);
        if (playoffMatches) setPlayoffMatches(playoffMatches);
        setModelPlayoffPredictions(modelPlayoffPredictions);
        setLastRefreshed(new Date());
        setLoading(false);
      })
      .catch(err => {
        console.error("Data loading failed:", err);
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  // Poll for score updates every 15 minutes during match windows (18:00–04:59 local)
  useEffect(() => {
    const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

    const isDuringMatchWindow = () => {
      const hour = new Date().getHours();
      return hour >= 18 || hour < 5;
    };

    const pollData = async () => {
      if (!isDuringMatchWindow()) return;
      try {
        const data = await loadData();
        setMatches(data.matches);
        setModelPlayoffPredictions(data.modelPlayoffPredictions);
        setLastRefreshed(new Date());
      } catch (err) {
        console.warn("Poll refresh failed:", err);
      }
    };

    const interval = setInterval(pollData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    try {
      const data = await loadData();
      setMatches(data.matches);
      setModelPlayoffPredictions(data.modelPlayoffPredictions);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn("Manual refresh failed:", err);
    }
  }, []);

  const analyzedModels = useMemo(() => {
    return analyzePredictions(matches, baseModels);
  }, [matches, baseModels]);

  const highestScore = analyzedModels[0]?.points ?? 0;
  const leadingModelName = analyzedModels[0]?.name ?? "None";
  const globalAccuracyMax = analyzedModels.length > 0 ? Math.max(...analyzedModels.map(m => m.accuracy)) : 0;
  const globalGoalDevMin = analyzedModels.length > 0 ? Math.min(...analyzedModels.filter(m => m.avgGoalDeviation > 0).map(m => m.avgGoalDeviation)) : 0;

  // Count group-stage matches only
  const groupStageMatchCount = useMemo(() => {
    return matches.filter(m =>
      !m.group.startsWith("Round") && !m.group.startsWith("Q") &&
      !m.group.startsWith("S") && !m.group.startsWith("Final")
    ).length;
  }, [matches]);

  // Determine if playoffs are active
  const playoffsActive = useMemo(() => {
    const groupMatches = matches.filter(m =>
      !m.group.startsWith("Round") && !m.group.startsWith("Q") &&
      !m.group.startsWith("S") && !m.group.startsWith("Final")
    );
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

  const tabs: { id: TabId; label: string; icon: React.ReactNode; accent: string }[] = [
    { id: "leaderboard", label: "Leaderboard", icon: <Award className="h-4 w-4 text-yellow-400" />, accent: "border-yellow-400" },
    { id: "matches", label: "Matches", icon: <Swords className="h-4 w-4 text-emerald-400" />, accent: "border-emerald-400" },
    { id: "evolution", label: "Evolution", icon: <TrendingUp className="h-4 w-4 text-yellow-400" />, accent: "border-yellow-400" },
    { id: "standings", label: "Group Stage", icon: <BarChart3 className="h-4 w-4 text-indigo-400" />, accent: "border-indigo-400" },
    { id: "playoffs", label: "Playoffs", icon: <Trophy className="h-4 w-4 text-yellow-400" />, accent: "border-yellow-400" },
    { id: "predictions", label: "Predictions", icon: <Eye className="h-4 w-4 text-emerald-400" />, accent: "border-emerald-400" },
  ];

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none opacity-40"></div>

        <div className="bg-zinc-950 border-b border-zinc-900 px-3 sm:px-4 py-2 text-center text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex items-center justify-center gap-1 sm:gap-2 z-10 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">World Cup AI Predictor Dashboard • {baseModels.length} Models Loaded</span>
          <span className="sm:hidden">AI World Cup • {baseModels.length} Models</span>
          <span className="mx-1 sm:mx-2 text-zinc-700">|</span>
          <span className="hidden sm:inline">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
          <button
            onClick={handleManualRefresh}
            className="ml-1 sm:ml-2 p-0.5 hover:text-white transition-colors"
            title="Refresh data now"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        <header className="border-b-4 border-white bg-black p-4 sm:p-6 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div className="flex flex-col">
              <h1 className="font-display text-4xl sm:text-5xl md:text-8xl leading-[0.85] tracking-tighter uppercase">
                WORLD CUP<br/>
                <span className="text-zinc-500">AI PREDICTOR</span>
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                <span className="bg-white text-black px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  Group Stage
                </span>
                <span className="border border-zinc-700 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {matches.length} Matches • {baseModels.length} Models
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:flex-row sm:items-end gap-3 sm:gap-12">
              <div className="text-left sm:text-left lg:text-right">
                <div className="text-[9px] sm:text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Accuracy Max</div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-display text-emerald-400 accent-green tracking-tight leading-none">
                  {globalAccuracyMax > 0 ? `${globalAccuracyMax}%` : "N/A"}
                </div>
              </div>

              <div className="text-left sm:text-left lg:text-right">
                <div className="text-[9px] sm:text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Best Goal Dev</div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-display text-sky-400 tracking-tight leading-none">
                  {globalGoalDevMin > 0 ? globalGoalDevMin.toFixed(2) : "N/A"}
                </div>
              </div>

              <div className="text-left sm:text-left lg:text-right">
                <div className="text-[9px] sm:text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Top Points</div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-display text-yellow-400 leading-none">
                  {highestScore} PTS
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase font-mono text-zinc-400 mt-1 sm:mt-2 block truncate">
                  <span className="hidden sm:inline">Leader Model: </span><span className="text-white font-bold">{leadingModelName}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col space-y-8 relative z-10">
          <div className="border-b-2 border-zinc-800 flex items-start sm:items-center justify-between flex-wrap gap-0 sm:gap-2">
            <div className="flex flex-wrap -mb-[2px] gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-sm font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center gap-1 sm:gap-2 border-b-4 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `${tab.accent} text-white bg-zinc-900`
                      : tab.id === "playoffs" && !playoffsActive
                        ? "border-transparent text-zinc-500 hover:text-zinc-300"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.icon} <span className="hidden xs:inline sm:inline">{tab.label}</span><span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.id === "playoffs" && !playoffsActive && (
                    <span className="text-[7px] sm:text-[8px] bg-zinc-800 text-zinc-500 px-1 sm:px-1.5 py-0.5 font-mono uppercase tracking-widest">soon</span>
                  )}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-3 py-1.5 mb-2 md:mb-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              READ ONLY
            </div>
          </div>

          <div className="flex-1">
            {activeTab === "leaderboard" && (
              <LeaderboardTab
                models={analyzedModels}
                matches={matches}
                totalGroupMatches={groupStageMatchCount}
                onSelectModel={setSelectedDiagnosticModel}
              />
            )}
            {activeTab === "matches" && (
              <MatchesTab matches={matches} models={analyzedModels} />
            )}
            {activeTab === "standings" && (
              <StandingsTab matches={matches} teams={teamArray} models={analyzedModels} rawPredictions={rawPredictions} />
            )}
            {activeTab === "evolution" && (
              <EvolutionTab models={analyzedModels} matches={matches} />
            )}
            {activeTab === "playoffs" && (
              <PlayoffsTab
                playoffMatches={playoffMatches}
                isActive={playoffsActive}
                matches={matches}
                teams={teamArray}
                models={analyzedModels}
                modelPlayoffPredictions={modelPlayoffPredictions}
              />
            )}
            {activeTab === "predictions" && (
              <PredictionsTab matches={matches} teams={teamArray} models={analyzedModels} modelPlayoffPredictions={modelPlayoffPredictions} />
            )}
          </div>
        </section>

        <AnimatePresence>
          {selectedDiagnosticModel && (
            <ModelDetailModal model={selectedDiagnosticModel} matches={matches} teams={teamArray} modelPlayoffPredictions={modelPlayoffPredictions} onClose={() => setSelectedDiagnosticModel(null)} />
          )}
        </AnimatePresence>

        <footer className="bg-black border-t-2 border-zinc-800 py-4 sm:py-6 mt-12 text-zinc-500">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 text-xs font-mono">
            <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              WORLD PREDICTOR TAPE
            </div>
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden w-full md:w-auto md:max-w-lg">
              <span className="text-yellow-400 shrink-0 font-black uppercase text-[9px] sm:text-[10px] tracking-wider">SCORES:</span>
              <span className="text-white text-[10px] sm:text-[11px] font-semibold tracking-wider whitespace-nowrap overflow-ellipsis overflow-hidden">
                {completedScoresTicker}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </ErrorBoundary>
  );
}
