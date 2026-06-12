import { Match, AIModel, GroupStanding, Team } from "./types";

export function analyzePredictions(matches: Match[], models: AIModel[]): AIModel[] {
  const updatedModels = models.map(m => ({
    ...m,
    points: 0,
    exactScores: 0,
    correctOutcomes: 0,
    accuracy: 0,
    avgGoalDeviation: 0
  }));

  const completedMatches = matches.filter(m => m.actualScore !== null);
  const totalCompleted = completedMatches.length;

  updatedModels.forEach(model => {
    let totalPredGoals = 0;
    let totalGoalDeviation = 0;
    let completedWithPred = 0;

    matches.forEach(match => {
      const pred = match.predictions[model.id];
      if (pred) {
        totalPredGoals += (pred.teamAScore + pred.teamBScore);
      }

      if (match.actualScore && pred) {
        const actScore = match.actualScore;
        const actDiff = actScore.teamA - actScore.teamB;
        const predDiff = pred.teamAScore - pred.teamBScore;

        const actOutcome = actDiff > 0 ? "A" : actDiff < 0 ? "B" : "D";
        const predOutcome = predDiff > 0 ? "A" : predDiff < 0 ? "B" : "D";

        const isExactScore = actScore.teamA === pred.teamAScore && actScore.teamB === pred.teamBScore;
        const isCorrectOutcome = actOutcome === predOutcome;

        if (isExactScore) {
          model.points += 3;
          model.exactScores += 1;
          model.correctOutcomes += 1;
        } else if (isCorrectOutcome) {
          model.points += 1;
          model.correctOutcomes += 1;
        }

        // Track goal deviation for completed matches
        totalGoalDeviation += Math.abs(pred.teamAScore - actScore.teamA) + Math.abs(pred.teamBScore - actScore.teamB);
        completedWithPred += 1;
      }
    });

    model.avgPredictedGoals = +(totalPredGoals / Math.max(1, matches.length)).toFixed(2);
    model.accuracy = totalCompleted > 0 ? Math.round((model.correctOutcomes / totalCompleted) * 100) : 100;
    model.avgGoalDeviation = completedWithPred > 0 ? +(totalGoalDeviation / completedWithPred).toFixed(2) : 0;
  });

  return updatedModels.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (a.avgGoalDeviation !== b.avgGoalDeviation) return a.avgGoalDeviation - b.avgGoalDeviation;
    return a.name.localeCompare(b.name);
  });
}

export function calculateActualStandings(group: string, teams: Team[], matches: Match[]): GroupStanding[] {
  const groupTeams = teams.filter(t => t.group === group);
  const standingsMap: Record<string, GroupStanding> = {};

  groupTeams.forEach(t => {
    standingsMap[t.id] = {
      teamId: t.id, teamName: t.name, flag: t.flag,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, pts: 0
    };
  });

  const groupMatches = matches.filter(m => m.group === group && m.actualScore !== null);

  groupMatches.forEach(m => {
    const act = m.actualScore!;
    const tA = standingsMap[m.teamA.id];
    const tB = standingsMap[m.teamB.id];

    if (tA && tB) {
      tA.played += 1; tB.played += 1;
      tA.gf += act.teamA; tA.ga += act.teamB;
      tB.gf += act.teamB; tB.ga += act.teamA;

      if (act.teamA > act.teamB) { tA.won += 1; tA.pts += 3; tB.lost += 1; }
      else if (act.teamB > act.teamA) { tB.won += 1; tB.pts += 3; tA.lost += 1; }
      else { tA.drawn += 1; tB.drawn += 1; tA.pts += 1; tB.pts += 1; }
    }
  });

  return Object.values(standingsMap).map(s => ({ ...s, gd: s.gf - s.ga })).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName);
  });
}

export function calculatePredictedStandings(
  group: string,
  teams: Team[],
  matches: Match[],
  modelId: string,
  rawModelPredictions?: Record<string, Record<string, number | string>>,
): GroupStanding[] {
  const groupTeams = teams.filter(t => t.group === group);
  const standingsMap: Record<string, GroupStanding> = {};

  groupTeams.forEach(t => {
    standingsMap[t.id] = {
      teamId: t.id, teamName: t.name, flag: t.flag,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, pts: 0
    };
  });

  // Build a team code → team id lookup for this group
  const codeToTeamId: Record<string, string> = {};
  for (const t of groupTeams) {
    codeToTeamId[t.code] = t.id;
  }

  // Track which team code pairs have already been counted from API matches
  const countedPairs = new Set<string>();

  // First: use predictions from API matches
  const groupMatches = matches.filter(m => m.group === group);

  groupMatches.forEach(m => {
    const pred = m.predictions[modelId];
    const tA = standingsMap[m.teamA.id];
    const tB = standingsMap[m.teamB.id];

    if (tA && tB && pred) {
      tA.played += 1; tB.played += 1;
      tA.gf += pred.teamAScore; tA.ga += pred.teamBScore;
      tB.gf += pred.teamBScore; tB.ga += pred.teamAScore;

      if (pred.teamAScore > pred.teamBScore) { tA.won += 1; tA.pts += 3; tB.lost += 1; }
      else if (pred.teamBScore > pred.teamAScore) { tB.won += 1; tB.pts += 3; tA.lost += 1; }
      else { tA.drawn += 1; tB.drawn += 1; tA.pts += 1; tB.pts += 1; }

      countedPairs.add(`${m.teamA.code}-${m.teamB.code}`);
      countedPairs.add(`${m.teamB.code}-${m.teamA.code}`);
    }
  });

  // Second: supplement with raw model predictions for matches not in the API
  if (rawModelPredictions) {
    // Derive group letter from group name: "Group H" → "h"
    const groupLetter = group.replace(/^Group /, '').toLowerCase();

    for (const [matchKey, pred] of Object.entries(rawModelPredictions)) {
      // Match pattern: g_<letter>_<number> e.g. g_h_1
      if (!matchKey.startsWith(`g_${groupLetter}_`)) continue;

      const codes = Object.keys(pred).filter(k => typeof pred[k] === 'number');
      if (codes.length !== 2) continue;

      const pairKey = `${codes[0]}-${codes[1]}`;
      if (countedPairs.has(pairKey)) continue; // already counted from API

      const tAId = codeToTeamId[codes[0]];
      const tBId = codeToTeamId[codes[1]];
      const tA = tAId ? standingsMap[tAId] : undefined;
      const tB = tBId ? standingsMap[tBId] : undefined;

      if (tA && tB) {
        const scoreA = pred[codes[0]] as number;
        const scoreB = pred[codes[1]] as number;

        tA.played += 1; tB.played += 1;
        tA.gf += scoreA; tA.ga += scoreB;
        tB.gf += scoreB; tB.ga += scoreA;

        if (scoreA > scoreB) { tA.won += 1; tA.pts += 3; tB.lost += 1; }
        else if (scoreB > scoreA) { tB.won += 1; tB.pts += 3; tA.lost += 1; }
        else { tA.drawn += 1; tB.drawn += 1; tA.pts += 1; tB.pts += 1; }

        countedPairs.add(pairKey);
        countedPairs.add(`${codes[1]}-${codes[0]}`);
      }
    }
  }

  return Object.values(standingsMap).map(s => ({ ...s, gd: s.gf - s.ga })).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName);
  });
}
