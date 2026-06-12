import React, { useMemo } from "react";
import { motion } from "motion/react";
import { AIModel, Match } from "../types";
import { MODEL_COLORS } from "../constants";
import { TrendingUp } from "lucide-react";

interface EvolutionTabProps {
  models: AIModel[];
  matches: Match[];
}

interface EvolutionPoint {
  matchIndex: number;
  matchId: string;
  matchLabel: string;
  cumulativePoints: Record<string, number>; // modelId → points
}

function buildEvolutionData(models: AIModel[], matches: Match[]): {
  points: EvolutionPoint[];
  modelIds: string[];
} {
  const completedMatches = matches.filter(m => m.status === "FINISHED" && m.actualScore !== null);
  const modelIds = models.map(m => m.id);
  const cumulative: Record<string, number> = {};
  modelIds.forEach(id => { cumulative[id] = 0; });

  const points: EvolutionPoint[] = [];

  completedMatches.forEach((match) => {
    models.forEach(model => {
      const pred = match.predictions[model.id];
      if (!pred || !match.actualScore) return;

      const actScore = match.actualScore;
      const actDiff = actScore.teamA - actScore.teamB;
      const predDiff = pred.teamAScore - pred.teamBScore;
      const actOutcome = actDiff > 0 ? "A" : actDiff < 0 ? "B" : "D";
      const predOutcome = predDiff > 0 ? "A" : predDiff < 0 ? "B" : "D";

      const isExact = actScore.teamA === pred.teamAScore && actScore.teamB === pred.teamBScore;
      const isCorrectOutcome = actOutcome === predOutcome;

      if (isExact) cumulative[model.id] += 3;
      else if (isCorrectOutcome) cumulative[model.id] += 1;
    });

    const label = `${match.teamA.code} ${match.actualScore!.teamA}-${match.actualScore!.teamB} ${match.teamB.code}`;
    points.push({
      matchIndex: points.length,
      matchId: match.id,
      matchLabel: label,
      cumulativePoints: { ...cumulative },
    });
  });

  return { points, modelIds };
}

export default React.memo(function EvolutionTab({ models, matches }: EvolutionTabProps) {
  const { points, modelIds } = useMemo(() => buildEvolutionData(models, matches), [models, matches]);

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <TrendingUp className="h-12 w-12 mb-4 text-zinc-700" />
        <div className="font-display text-xl uppercase tracking-wider">No completed matches yet</div>
        <div className="text-xs font-mono text-zinc-600 mt-2 uppercase tracking-widest">
          Evolution data will appear once matches have results
        </div>
      </div>
    );
  }

  // Chart dimensions
  const chartPadding = { top: 30, right: 30, bottom: 60, left: 50 };
  const svgWidth = 900;
  const svgHeight = 450;
  const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
  const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;

  // Find max points for Y axis
  const maxPoints = Math.max(
    ...points.map(p => Math.max(...(Object.values(p.cumulativePoints) as number[]))),
    1
  );
  const yMax = Math.ceil(maxPoints / 5) * 5 + 5;

  // Build path data for each model
  const modelPaths = modelIds.map(modelId => {
    const model = models.find(m => m.id === modelId)!;
    const color = MODEL_COLORS[modelId] || "#a1a1aa";

    const pathData = points.map((p, i) => {
      const x = chartPadding.left + (i / Math.max(points.length - 1, 1)) * chartWidth;
      const y = chartPadding.top + chartHeight - (p.cumulativePoints[modelId] / yMax) * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");

    // Area under the line
    const lastX = chartPadding.left + ((points.length - 1) / Math.max(points.length - 1, 1)) * chartWidth;
    const firstX = chartPadding.left;
    const baseY = chartPadding.top + chartHeight;

    const areaData = `${pathData} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;

    // Dots for each data point
    const dots = points.map((p, i) => {
      const x = chartPadding.left + (i / Math.max(points.length - 1, 1)) * chartWidth;
      const y = chartPadding.top + chartHeight - (p.cumulativePoints[modelId] / yMax) * chartHeight;
      return { x, y, points: p.cumulativePoints[modelId], matchLabel: p.matchLabel };
    });

    const lastPoint = points[points.length - 1];
    const finalPoints = lastPoint.cumulativePoints[modelId];

    return { modelId, model, color, pathData, areaData, dots, finalPoints };
  });

  // Sort models by final points for legend ordering (descending)
  modelPaths.sort((a, b) => b.finalPoints - a.finalPoints);

  // Y axis ticks
  const yTicks: number[] = [];
  const yTickStep = Math.max(1, Math.ceil(yMax / 8));
  for (let v = 0; v <= yMax; v += yTickStep) {
    yTicks.push(v);
  }

  // X axis labels (show every Nth label to avoid clutter)
  const labelInterval = points.length <= 10 ? 1 : points.length <= 20 ? 2 : Math.ceil(points.length / 12);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="border-2 sm:border-4 border-zinc-800 bg-zinc-950 p-3 sm:p-6 shadow-2xl">
        <div className="border-b-2 sm:border-b-4 border-white pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-tighter text-white italic">
              Points Evolution
            </h2>
          </div>
          <p className="text-[9px] sm:text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">
            CUMULATIVE POINTS • {points.length} MATCHES PLAYED
          </p>
        </div>

        {/* SVG Chart */}
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[500px] sm:min-w-[600px] h-auto"
            style={{ maxHeight: "500px" }}
          >
            {/* Grid lines */}
            {yTicks.map(v => {
              const y = chartPadding.top + chartHeight - (v / yMax) * chartHeight;
              return (
                <g key={`grid-${v}`}>
                  <line
                    x1={chartPadding.left}
                    y1={y}
                    x2={chartPadding.left + chartWidth}
                    y2={y}
                    stroke="#27272a"
                    strokeWidth="1"
                  />
                  <text
                    x={chartPadding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#71717a"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {/* X axis labels */}
            {points.map((p, i) => {
              if (i % labelInterval !== 0 && i !== points.length - 1) return null;
              const x = chartPadding.left + (i / Math.max(points.length - 1, 1)) * chartWidth;
              return (
                <g key={`x-${p.matchId}`}>
                  <line x1={x} y1={chartPadding.top + chartHeight} x2={x} y2={chartPadding.top + chartHeight + 6} stroke="#3f3f46" strokeWidth="1" />
                  <text
                    x={x}
                    y={chartPadding.top + chartHeight + 18}
                    textAnchor="middle"
                    fill="#52525b"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    transform={`rotate(-35, ${x}, ${chartPadding.top + chartHeight + 18})`}
                  >
                    {p.matchLabel}
                  </text>
                </g>
              );
            })}

            {/* Axis lines */}
            <line
              x1={chartPadding.left}
              y1={chartPadding.top}
              x2={chartPadding.left}
              y2={chartPadding.top + chartHeight}
              stroke="#3f3f46"
              strokeWidth="2"
            />
            <line
              x1={chartPadding.left}
              y1={chartPadding.top + chartHeight}
              x2={chartPadding.left + chartWidth}
              y2={chartPadding.top + chartHeight}
              stroke="#3f3f46"
              strokeWidth="2"
            />

            {/* Area fills (subtle) */}
            {modelPaths.map(mp => (
              <path
                key={`area-${mp.modelId}`}
                d={mp.areaData}
                fill={mp.color}
                fillOpacity="0.05"
              />
            ))}

            {/* Lines */}
            {modelPaths.map(mp => (
              <motion.path
                key={`line-${mp.modelId}`}
                d={mp.pathData}
                fill="none"
                stroke={mp.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            ))}

            {/* Dots */}
            {modelPaths.map(mp => (
              <g key={`dots-${mp.modelId}`}>
                {mp.dots.map((dot, i) => (
                  <circle
                    key={`${mp.modelId}-${i}`}
                    cx={dot.x}
                    cy={dot.y}
                    r="3"
                    fill={mp.color}
                    stroke="#050505"
                    strokeWidth="1.5"
                  >
                    <title>{`${mp.model.name}: ${dot.points} pts (${dot.matchLabel})`}</title>
                  </circle>
                ))}
                {/* End label */}
                {mp.dots.length > 0 && (
                  <motion.text
                    x={mp.dots[mp.dots.length - 1].x + 6}
                    y={mp.dots[mp.dots.length - 1].y + 4}
                    fill={mp.color}
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight="900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    {mp.finalPoints}
                  </motion.text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-800">
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
            {modelPaths.map(mp => (
              <div
                key={mp.modelId}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2"
              >
                <div
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: mp.color }}
                ></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {mp.model.name}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {mp.finalPoints} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match-by-Match Breakdown Table */}
      <div className="border-2 border-zinc-800 bg-zinc-950 p-3 sm:p-6">
        <div className="border-b border-zinc-700 pb-2 sm:pb-3 mb-3 sm:mb-4">
          <h3 className="font-display text-base sm:text-xl uppercase tracking-tighter text-white">
            Match-by-Match Breakdown
          </h3>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">
            Cumulative points after each fixture
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 text-zinc-500 text-[10px] uppercase font-mono tracking-widest border-b border-zinc-800">
                <th className="py-3 px-3 font-black">#</th>
                <th className="py-3 px-3 font-black">Match</th>
                <th className="py-3 px-3 font-black">Score</th>
                {modelPaths.map(mp => (
                  <th key={mp.modelId} className="py-3 px-3 font-black text-center" style={{ color: mp.color }}>
                    {mp.model.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {points.map((p, idx) => (
                <motion.tr
                  key={p.matchId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="py-2 px-3 text-zinc-600 font-mono font-bold">{idx + 1}</td>
                  <td className="py-2 px-3 text-white font-bold uppercase tracking-wider text-[11px]">
                    {p.matchLabel.split(" ")[0]} vs {p.matchLabel.split(" ").slice(-1)[0]}
                  </td>
                  <td className="py-2 px-3 text-zinc-400 font-mono">
                    {p.matchLabel.split(" ").slice(1, -1).join(" ")}
                  </td>
                  {modelPaths.map(mp => {
                    const pts = p.cumulativePoints[mp.modelId];
                    const prevPts = idx > 0 ? points[idx - 1].cumulativePoints[mp.modelId] : 0;
                    const gained = pts - prevPts;
                    const gainColor = gained >= 3 ? "text-yellow-400" : gained >= 1 ? "text-emerald-400" : "text-zinc-500";
                    return (
                      <td key={mp.modelId} className="py-2 px-3 text-center font-mono font-bold">
                        <span className="text-white">{pts}</span>
                        {gained > 0 && (
                          <span className={`ml-1 text-[9px] ${gainColor}`}>+{gained}</span>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
