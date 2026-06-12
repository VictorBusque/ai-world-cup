import React from "react";
import { PlayoffMatch, PLAYOFF_ROUNDS } from "../types";
import { Trophy, Lock } from "lucide-react";

interface PlayoffsTabProps {
  playoffMatches: PlayoffMatch[];
  isActive: boolean;
}

const ROUND_META: Record<string, { label: string; short: string }> = {
  "Round of 32": { label: "ROUND OF 32", short: "R32" },
  "Round of 16": { label: "ROUND OF 16", short: "R16" },
  "Quarter-finals": { label: "QUARTER-FINALS", short: "QF" },
  "Semi-finals": { label: "SEMI-FINALS", short: "SF" },
  Final: { label: "FINAL", short: "F" },
};

const ROUND_COUNTS: Record<string, number> = {
  "Round of 32": 16,
  "Round of 16": 8,
  "Quarter-finals": 4,
  "Semi-finals": 2,
  Final: 1,
};

export default function PlayoffsTab({ playoffMatches, isActive }: PlayoffsTabProps) {
  const hasData = playoffMatches.length > 0;

  // Build placeholder data if none exists
  const allMatches = hasData
    ? playoffMatches
    : PLAYOFF_ROUNDS.flatMap((round) =>
        Array.from({ length: ROUND_COUNTS[round] }, (_, i) => ({
          id: `ph_${round}_${i}`,
          round: round as PlayoffMatch["round"],
          slot: i + 1,
          teamA: null,
          teamB: null,
          date: "",
          time: "",
          venue: "",
          actualScore: null,
          predictions: {},
        }))
      );

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <div
        className={`border-4 p-6 flex flex-col md:flex-row items-center justify-between gap-4 ${
          isActive ? "bg-zinc-900 border-yellow-400" : "bg-zinc-950 border-zinc-800 relative overflow-hidden"
        }`}
      >
        {!isActive && <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] pointer-events-none" />}
        <div className="flex items-center gap-4 relative z-10">
          <Trophy className={`h-8 w-8 text-yellow-400 ${isActive ? "" : "opacity-40"}`} />
          <div>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-white">Knockout Stage</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">
              {isActive ? "Playoffs are LIVE — bracket is being populated" : "Awaiting group stage completion"}
            </p>
          </div>
        </div>
        {!isActive && (
          <div className="relative z-10 flex items-center gap-3 bg-black border-2 border-zinc-800 px-5 py-3">
            <Lock className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-mono font-black uppercase tracking-widest text-zinc-500">Locked</span>
          </div>
        )}
      </div>

      {/* Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          <div className="flex items-stretch gap-0">
            {PLAYOFF_ROUNDS.map((round, ri) => {
              const count = ROUND_COUNTS[round];
              const matches = allMatches.filter((m) => m.round === round);
              const meta = ROUND_META[round];
              // Spacing doubles each round to create bracket alignment
              const gapClass = ri === 0 ? "gap-2" : ri === 1 ? "gap-4" : ri === 2 ? "gap-8" : ri === 3 ? "gap-16" : "gap-0";

              return (
                <div key={round} className="flex flex-col min-w-[180px]" style={{ flex: ri === 0 ? "0 0 180px" : "0 0 180px" }}>
                  {/* Round Header */}
                  <div className="text-center py-3 border-b-2 border-zinc-800 mb-2">
                    <span className="font-display text-sm uppercase tracking-wider text-white">{meta.label}</span>
                  </div>

                  {/* Matches with spacing for bracket alignment */}
                  <div className={`flex flex-col justify-around flex-1 ${gapClass}`}>
                    {Array.from({ length: count }, (_, i) => {
                      const match = matches[i] || {
                        id: `empty_${round}_${i}`,
                        teamA: null,
                        teamB: null,
                        actualScore: null,
                      };
                      return (
                        <div key={match.id} className="flex items-center">
                          {/* Connector line from previous round */}
                          {ri > 0 && (
                            <div className="w-4 flex-shrink-0 flex items-center">
                              <div className="w-full h-px bg-zinc-700" />
                            </div>
                          )}
                          <BracketMatch match={match} isActive={isActive} round={round} index={i} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border-4 border-zinc-800 p-5">
        <h4 className="font-display text-lg uppercase tracking-wider text-yellow-400 mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0" />
          How the knockout bracket works
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The top <span className="text-white font-bold">2 teams from each group</span> (24 teams) plus the{" "}
          <span className="text-white font-bold">8 best third-placed teams</span> advance to a 32-team
          single-elimination bracket. The bracket will populate automatically once all group stage matches are complete.
        </p>
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  isActive,
  round,
  index,
}: {
  match: { id: string; teamA: PlayoffMatch["teamA"]; teamB: PlayoffMatch["teamB"]; actualScore: PlayoffMatch["actualScore"] };
  isActive: boolean;
  round: string;
  index: number;
}) {
  const hasTeams = match.teamA !== null && match.teamB !== null;
  const hasScore = match.actualScore !== null;
  const isFinal = round === "Final";

  return (
    <div
      className={`flex-1 border-2 transition-all ${
        isActive && hasTeams
          ? isFinal
            ? "bg-zinc-900 border-yellow-400"
            : "bg-zinc-900 border-zinc-600 hover:border-white"
          : "bg-zinc-950 border-zinc-800/50 opacity-40"
      }`}
    >
      {/* Team A */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none shrink-0">{match.teamA?.flag ?? "🏳️"}</span>
          <span className={`text-[11px] font-black uppercase tracking-wider truncate ${match.teamA ? "text-white" : "text-zinc-600"}`}>
            {match.teamA?.code ?? "TBD"}
          </span>
        </div>
        <span className="font-mono font-bold text-xs text-zinc-500 shrink-0 ml-2">
          {hasScore ? match.actualScore!.teamA : "–"}
        </span>
      </div>
      {/* Team B */}
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm select-none shrink-0">{match.teamB?.flag ?? "🏳️"}</span>
          <span className={`text-[11px] font-black uppercase tracking-wider truncate ${match.teamB ? "text-white" : "text-zinc-600"}`}>
            {match.teamB?.code ?? "TBD"}
          </span>
        </div>
        <span className="font-mono font-bold text-xs text-zinc-500 shrink-0 ml-2">
          {hasScore ? match.actualScore!.teamB : "–"}
        </span>
      </div>
    </div>
  );
}
