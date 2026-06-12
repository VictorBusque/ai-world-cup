import React, { useState, useTransition } from "react";
import { motion } from "motion/react";
import { AIModel, Match } from "../types";
import { Sparkles, Megaphone, Terminal, Newspaper, AlertTriangle, ArrowRight, BookOpen } from "lucide-react";

interface AnalystDeskTabProps {
  models: AIModel[];
  matches: Match[];
}

export default React.memo(function AnalystDeskTab({ models, matches }: AnalystDeskTabProps) {
  const [summaryText, setSummaryText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const completedCount = matches.filter(m => m.actualScore !== null).length;

  const handleFetchBriefing = () => {
    setError(null);
    startTransition(async () => {
      try {
        const modelStandingText = models.map((m, idx) => 
          `${idx + 1}. ${m.name} (${m.provider}): ${m.points} pts, ${m.accuracy}% accuracy, ${m.exactScores} exact scores, ${m.avgGoalDeviation.toFixed(2)} avg goal deviation.`
        ).join("\n");

        const upcomingMatchesText = matches.filter(m => m.actualScore === null).map(m => 
          `- ${m.teamA.name} vs ${m.teamB.name} (${m.group})`
        ).slice(0, 5).join("\n");

        const matchSummaryText = `Total matches: ${matches.length}. Completed matches: ${completedCount}. Upcoming matches: ${matches.filter(m => m.actualScore === null).length}.\nFirst few upcoming matches:\n${upcomingMatchesText}`;

        const response = await fetch("/api/gemini/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelStandingText, matchSummaryText })
        });

        if (!response.ok) {
          throw new Error("The backend summary service reported an error. Please verify that GEMINI_API_KEY is properly initialized.");
        }

        const data = await response.json();
        setSummaryText(data.text);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to contact analysis server.");
      }
    });
  };

  const loadingSteps = [
    "Compiling points metrics across group stage fixtures...",
    "Querying Gemini 3.5 Flash server-side engine...",
    "Evaluating statistical discrepancy between models...",
    "Drafting tactical editorial column for the Leaderboard brief..."
  ];

  return (
    <div className="space-y-6">
      {/* Intro Desk Banner */}
      <div className="w-full border-4 border-zinc-800 bg-zinc-900 p-6 relative rounded-none overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black border border-zinc-800 text-yellow-400 text-xs font-black uppercase tracking-widest mb-4">
            <Newspaper className="h-3.5 w-3.5" />
            AI Editorial Desk
          </div>
          <h2 className="font-display text-4xl uppercase tracking-tight text-white italic leading-tight">
            World Cup AI Predictor Briefings
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-2 uppercase tracking-wide font-mono">
            Query Gemini's analyst panel to summarize the standings, evaluate tactical variances, and draft a professional journal playground report!
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleFetchBriefing}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-800 text-black font-extrabold uppercase text-[11px] tracking-widest transition-all"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/50 border-t-black rounded-full animate-spin"></span>
                  Analyzing model tendencies...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Request Leaderboard Briefing
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main output view */}
      {isPending ? (
        <div style={{ contentVisibility: "auto" }} className="bg-zinc-900 border-4 border-zinc-800 p-12 rounded-none flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-400 animate-spin"></div>
            <Sparkles className="h-5 w-5 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <span className="text-white font-display text-xl uppercase tracking-wider block">Drafting live model briefing...</span>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono max-w-sm mx-auto h-8 flex items-center justify-center uppercase tracking-wider">
              <motion.div
                key={Date.now()}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-yellow-400"
              >
                {loadingSteps[Math.floor(Math.random() * loadingSteps.length)]}
              </motion.div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-950/20 text-rose-400 p-6 border-4 border-rose-900 flex items-start gap-3 rounded-none">
          <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <h4 className="font-display text-lg uppercase tracking-wider text-white">Server Connection Issue</h4>
            <p className="text-xs text-rose-300 mt-1 leading-relaxed font-mono uppercase tracking-wide">
              {error}
            </p>
            <p className="text-[10px] text-zinc-500 mt-3 font-mono uppercase tracking-wider">
              Ensure GEMINI_API_KEY environment variable is defined in Settings Secrets panel.
            </p>
          </div>
        </div>
      ) : summaryText ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950 border-4 border-zinc-800 p-6 md:p-8 space-y-6 rounded-none"
        >
          {/* Article Header */}
          <div className="border-b-4 border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-zinc-500 uppercase font-bold tracking-widest">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Megaphone className="h-4 w-4" /> Gemini AI Forecast Bulletin
            </span>
            <span>PUBLISHED: {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Render Markdown Paragraphs beautifully */}
          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-sans space-y-5">
            {summaryText.split("\n\n").map((para, pIdx) => {
              if (para.startsWith("#")) {
                const cleanHeader = para.replace(/#/g, "").trim();
                return (
                  <h3 key={pIdx} className="font-display text-xl uppercase tracking-wider text-yellow-400 mt-6 block border-b-2 border-zinc-800 pb-1 italic">
                    {cleanHeader}
                  </h3>
                );
              }

              if (para.startsWith("-") || para.startsWith("*")) {
                const lines = para.split("\n");
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-2 text-xs text-zinc-400 font-sans my-4">
                    {lines.map((line, lIdx) => (
                      <li key={lIdx}>
                        {line.replace(/^-\s*|^\*\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="text-xs md:text-sm text-zinc-300 font-sans leading-relaxed">
                  {para.split("\n").map((line, lIdx) => {
                    const parts = line.split("**");
                    if (parts.length > 2) {
                      return (
                        <span key={lIdx}>
                          {parts.map((p, pIndex) => pIndex % 2 === 1 ? <strong key={pIndex} className="text-yellow-400 font-bold uppercase tracking-wider">{p}</strong> : p)}
                        </span>
                      );
                    }
                    return line;
                  })}
                </p>
              );
            })}
          </div>

          <div className="border-t-2 border-zinc-900 pt-4 flex justify-between items-center text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-bold">
            <span>Powered by @google/genai module & gemini-3.5-flash server</span>
            <span>Ref: wc-ai-leaders-brief</span>
          </div>
        </motion.div>
      ) : (
        <div style={{ contentVisibility: "auto" }} className="border-4 border-zinc-800 bg-zinc-950 p-12 text-center text-zinc-500 rounded-none flex flex-col items-center justify-center">
          <BookOpen className="h-10 w-10 text-zinc-700 mb-3" />
          <span className="font-display text-2xl uppercase tracking-wider text-zinc-400 block">No briefings drafted yet</span>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto uppercase tracking-wide font-mono">
            Engage the Sports Analytical Panel above to compile real-time summaries.
          </p>
        </div>
      )}
    </div>
  );
});
