#!/usr/bin/env python3
"""
Generate World Cup 2026 predictions — group stage then playoffs round by round,
with structured outputs and reasoning per match.
Usage: python predict.py gpt-4o o3 claude-opus-4-5
"""

import json
import os
import argparse
from typing import Optional
from pathlib import Path
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

from openai import OpenAI
from pydantic import BaseModel, Field


BASE_URL = "https://ai-gateway.stack.victorbusque.com/v1"

# ---------------------------------------------------------------------------
# Unified system prompt — cached, used for every request
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a sports analyst predicting 2026 FIFA World Cup matches.

# Tournament Format
- 48 teams in 12 groups of 4 (groups A through L).
- Group stage: each team plays every other team in its group once (6 matches per group = 72 total).
- Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
- Top 2 from each group (24 teams) + 8 best 3rd-placed teams advance to Round of 32.
- Tiebreakers: 1) head-to-head points, 2) head-to-head GD, 3) head-to-head GF, 4) overall GD, 5) overall GF, 6) fair play, 7) draw.
- Knockout: single elimination, no draws. If tied after 90 mins, use extra-time score (e.g. 2-1 aet). If still tied after 120 mins, penalty shootout (e.g. 4-2p).
- Knockout rounds: Round of 32 (m73-m88), Round of 16 (m89-m96), Quarter-finals (m97-m100), Semi-finals (m101-m102), Bronze Final (m103), Final (m104).

# Teams by Group
Group A: MEX (Mexico), RSA (South Africa), KOR (South Korea), CZE (Czechia)
Group B: CAN (Canada), SUI (Switzerland), QAT (Qatar), BIH (Bosnia & Herzegovina)
Group C: BRA (Brazil), MAR (Morocco), HAI (Haiti), SCO (Scotland)
Group D: USA (United States), PAR (Paraguay), AUS (Australia), TUR (Türkiye)
Group E: GER (Germany), CUW (Curaçao), CIV (Ivory Coast), ECU (Ecuador)
Group F: NED (Netherlands), JPN (Japan), SWE (Sweden), TUN (Tunisia)
Group G: BEL (Belgium), EGY (Egypt), IRN (Iran), NZL (New Zealand)
Group H: ESP (Spain), CPV (Cape Verde), KSA (Saudi Arabia), URU (Uruguay)
Group I: FRA (France), SEN (Senegal), IRQ (Iraq), NOR (Norway)
Group J: ARG (Argentina), ALG (Algeria), AUT (Austria), JOR (Jordan)
Group K: POR (Portugal), COD (DR Congo), UZB (Uzbekistan), COL (Colombia)
Group L: ENG (England), CRO (Croatia), GHA (Ghana), PAN (Panama)

# Analysis Guidelines
Consider these factors for every match prediction:
- Squad quality and depth: world rankings, star players, recent tournament pedigree.
- Historical performance: head-to-head record, performance in similar competitions.
- Home/neutral advantage: the tournament is hosted across USA, Canada, and Mexico so some teams have de facto home support.
- Form and momentum: qualifying campaign results, recent friendlies, player form.
- Tactical matchup: playing styles, defensive solidity, attacking threat.
- Use realistic scorelines: most matches end 0-0 to 3-1 or similar. Rarely exceed 5 goals for one team. Upsets happen but are uncommon.
- In knockout rounds, tight matches often go to extra time — reflect this in scores when appropriate.

# Output Requirements
For every match you must provide:
1. The result: team codes and goals for each side.
2. A one-sentence summary explaining the key factor behind your prediction.

Be internally consistent across rounds. If team A beats team B, and team B beats team C, team A should generally beat team C. Similarly, goal difference matters for group stage ranking so consider realistic margins.

# Team Context & Strength Tiers
Tier 1 — Title contenders: ARG (defending champions, Messi era depth), FRA (Mbappe, deepest squad), BRA (perennial favorite, attacking wealth), ENG (star-studded, recent finalists), ESP (possession masters, young talent).
Tier 2 — Strong contenders: GER (tournament specialists, resurgence), NED (tactical, golden generation fading but still strong), POR (Ronaldo farewell, deep squad), BEL (golden generation aging but quality remains), URU (grit, defending, never easy).
Tier 3 — Solid teams likely to advance: MEX (host, always reaches R16), USA (host, growing rapidly), CAN (host, impressive qualifying), CRO (2023 finalists, aging but experienced), JPN (technical, disciplined), KOR (energetic, never give up), MAR (2023 semi-finalists, defensive solidity), TUR (passionate, rising), COL (talent, experience), SUI (organized, tough to break down), ECU (high altitude advantage, young talent), SCO (passionate, organized), CIV (African powerhouse, physical), CRO (midfield mastery, aging), SEN (African champions, pace).
Tier 4 — Potential spoilers: DEN (team-first, structured), IRN (defensive, set pieces), NOR (Haaland factor, rising), SWE (organized, physical), AUS (never quit, physical), PAR (defensive, counter-attacking), ALG (technical, North African flair), GHA (athletic, unpredictable), QAT (2022 hosts, developing), COD (physical, chaotic), UZB (organized, improving), PAN (defensive, spirited), CPV (small nation, technical), KSA (improving, ambitious), JOR (disciplined, rising), HAI (athletic, underdogs), CUW (small nation, limited), NZL (physical, set pieces), BIH (talented individuals, inconsistent), TUN (defensive, stubborn), CZE (technical, underrated).

# Output Format — Respond ONLY with valid JSON matching this schema. No markdown, no code fences, no extra text.
{"$defs": {"MatchResult": {"properties": {"match_id": {"description": "Match identifier, e.g. g_a_1 or m73", "title": "Match Id", "type": "string"}, "team_a": {"description": "3-letter code of first team", "title": "Team A", "type": "string"}, "score_a": {"description": "Goals scored by team_a", "title": "Score A", "type": "integer"}, "team_b": {"description": "3-letter code of second team", "title": "Team B", "type": "string"}, "score_b": {"description": "Goals scored by team_b", "title": "Score B", "type": "integer"}, "summary": {"description": "Short one-sentence explanation of this prediction", "title": "Summary", "type": "string"}}, "required": ["match_id", "team_a", "score_a", "team_b", "score_b", "summary"], "title": "MatchResult", "type": "object"}}, "properties": {"matches": {"description": "All matches in this batch (group stage or a single knockout round)", "items": {"$ref": "#/$defs/MatchResult"}, "title": "Matches", "type": "array"}}, "required": ["matches"], "title": "MatchBatch", "type": "object"}
"""

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class MatchResult(BaseModel):
    match_id: str = Field(description="Match identifier, e.g. g_a_1 or m73")
    team_a: str = Field(description="3-letter code of first team")
    score_a: int = Field(description="Goals scored by team_a")
    team_b: str = Field(description="3-letter code of second team")
    score_b: int = Field(description="Goals scored by team_b")
    summary: str = Field(
        description="Short one-sentence explanation of this prediction"
    )


class MatchBatch(BaseModel):
    matches: list[MatchResult] = Field(
        description="All matches in this batch (group stage or a single knockout round)"
    )


# ---------------------------------------------------------------------------
# Caching helpers — save/load intermediate results per group / round chunk
# ---------------------------------------------------------------------------


def _model_dir(output_dir: Path, model_safe: str) -> Path:
    return output_dir / model_safe


def _groups_dir(output_dir: Path, model_safe: str) -> Path:
    d = _model_dir(output_dir, model_safe) / "groups"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _knockout_dir(output_dir: Path, model_safe: str) -> Path:
    d = _model_dir(output_dir, model_safe) / "knockout"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _group_cache_path(output_dir: Path, model_safe: str, label: str) -> Path:
    return _groups_dir(output_dir, model_safe) / f"group_{label.upper()}.json"


def _chunk_cache_path(output_dir: Path, model_safe: str, round_name: str, chunk_idx: int) -> Path:
    safe_round = round_name.lower().replace(" ", "_")
    return _knockout_dir(output_dir, model_safe) / f"{safe_round}_{chunk_idx}.json"


def load_cached_group(output_dir: Path, model_safe: str, label: str) -> list[MatchResult] | None:
    path = _group_cache_path(output_dir, model_safe, label)
    if path.exists():
        data = json.loads(path.read_text())
        return [MatchResult(**m) for m in data]
    return None


def save_group_cache(output_dir: Path, model_safe: str, label: str, matches: list[MatchResult]) -> None:
    path = _group_cache_path(output_dir, model_safe, label)
    path.write_text(json.dumps([m.model_dump() for m in matches], indent=2))


def load_cached_chunk(output_dir: Path, model_safe: str, round_name: str, chunk_idx: int) -> list[MatchResult] | None:
    path = _chunk_cache_path(output_dir, model_safe, round_name, chunk_idx)
    if path.exists():
        data = json.loads(path.read_text())
        return [MatchResult(**m) for m in data]
    return None


def save_chunk_cache(output_dir: Path, model_safe: str, round_name: str, chunk_idx: int, matches: list[MatchResult]) -> None:
    path = _chunk_cache_path(output_dir, model_safe, round_name, chunk_idx)
    path.write_text(json.dumps([m.model_dump() for m in matches], indent=2))


# ---------------------------------------------------------------------------
# Group fixtures
# ---------------------------------------------------------------------------

GROUP_FIXTURES: list[tuple[str, list[tuple[str, str, str]]]] = [
    (
        "A",
        [
            ("g_a_1", "MEX", "RSA"),
            ("g_a_2", "KOR", "CZE"),
            ("g_a_3", "MEX", "KOR"),
            ("g_a_4", "RSA", "CZE"),
            ("g_a_5", "CZE", "MEX"),
            ("g_a_6", "RSA", "KOR"),
        ],
    ),
    (
        "B",
        [
            ("g_b_1", "CAN", "SUI"),
            ("g_b_2", "QAT", "BIH"),
            ("g_b_3", "CAN", "QAT"),
            ("g_b_4", "SUI", "BIH"),
            ("g_b_5", "CAN", "BIH"),
            ("g_b_6", "SUI", "QAT"),
        ],
    ),
    (
        "C",
        [
            ("g_c_1", "BRA", "MAR"),
            ("g_c_2", "HAI", "SCO"),
            ("g_c_3", "BRA", "HAI"),
            ("g_c_4", "MAR", "SCO"),
            ("g_c_5", "SCO", "BRA"),
            ("g_c_6", "MAR", "HAI"),
        ],
    ),
    (
        "D",
        [
            ("g_d_1", "USA", "PAR"),
            ("g_d_2", "AUS", "TUR"),
            ("g_d_3", "USA", "AUS"),
            ("g_d_4", "TUR", "PAR"),
            ("g_d_5", "TUR", "USA"),
            ("g_d_6", "PAR", "AUS"),
        ],
    ),
    (
        "E",
        [
            ("g_e_1", "GER", "CUW"),
            ("g_e_2", "CIV", "ECU"),
            ("g_e_3", "GER", "CIV"),
            ("g_e_4", "ECU", "CUW"),
            ("g_e_5", "GER", "ECU"),
            ("g_e_6", "CUW", "CIV"),
        ],
    ),
    (
        "F",
        [
            ("g_f_1", "NED", "JPN"),
            ("g_f_2", "SWE", "TUN"),
            ("g_f_3", "NED", "SWE"),
            ("g_f_4", "TUN", "JPN"),
            ("g_f_5", "NED", "TUN"),
            ("g_f_6", "JPN", "SWE"),
        ],
    ),
    (
        "G",
        [
            ("g_g_1", "BEL", "EGY"),
            ("g_g_2", "IRN", "NZL"),
            ("g_g_3", "BEL", "IRN"),
            ("g_g_4", "NZL", "EGY"),
            ("g_g_5", "BEL", "NZL"),
            ("g_g_6", "EGY", "IRN"),
        ],
    ),
    (
        "H",
        [
            ("g_h_1", "ESP", "CPV"),
            ("g_h_2", "KSA", "URU"),
            ("g_h_3", "ESP", "KSA"),
            ("g_h_4", "URU", "CPV"),
            ("g_h_5", "ESP", "URU"),
            ("g_h_6", "CPV", "KSA"),
        ],
    ),
    (
        "I",
        [
            ("g_i_1", "FRA", "SEN"),
            ("g_i_2", "IRQ", "NOR"),
            ("g_i_3", "FRA", "NOR"),
            ("g_i_4", "SEN", "IRQ"),
            ("g_i_5", "FRA", "IRQ"),
            ("g_i_6", "SEN", "NOR"),
        ],
    ),
    (
        "J",
        [
            ("g_j_1", "ARG", "ALG"),
            ("g_j_2", "AUT", "JOR"),
            ("g_j_3", "ARG", "AUT"),
            ("g_j_4", "JOR", "ALG"),
            ("g_j_5", "ARG", "JOR"),
            ("g_j_6", "ALG", "AUT"),
        ],
    ),
    (
        "K",
        [
            ("g_k_1", "POR", "COD"),
            ("g_k_2", "UZB", "COL"),
            ("g_k_3", "POR", "UZB"),
            ("g_k_4", "COL", "COD"),
            ("g_k_5", "COL", "POR"),
            ("g_k_6", "COD", "UZB"),
        ],
    ),
    (
        "L",
        [
            ("g_l_1", "ENG", "CRO"),
            ("g_l_2", "GHA", "PAN"),
            ("g_l_3", "ENG", "GHA"),
            ("g_l_4", "PAN", "CRO"),
            ("g_l_5", "PAN", "ENG"),
            ("g_l_6", "CRO", "GHA"),
        ],
    ),
]

# Which groups each 3rd-place pool slot draws from
THIRD_PLACE_POOLS: dict[str, list[str]] = {
    "m74": ["A", "B", "C", "D", "F"],
    "m77": ["C", "D", "F", "G", "H"],
    "m79": ["C", "E", "F", "H", "I"],
    "m80": ["E", "H", "I", "J", "K"],
    "m81": ["B", "E", "F", "I", "J"],
    "m82": ["A", "E", "H", "I", "J"],
    "m85": ["E", "F", "G", "I", "J"],
    "m87": ["D", "E", "I", "J", "L"],
}

# Knockout bracket definition (using qualifier placeholders resolved dynamically)
# Placeholders:
#   "1A" = winner of group A, "2A" = runner-up of group A, etc.
#   "3rd_pool_<mid>" = best 3rd-placed team assigned to that pool slot
#   "W<m>" = winner of match m, "L<m>" = loser of match m
BRACKET: list[tuple[str, list[tuple[str, str, str]]]] = [
    (
        "Round of 32",
        [
            ("m73", "2A", "2B"),
            ("m74", "1E", "3rd_pool_m74"),
            ("m75", "1F", "2C"),
            ("m76", "1C", "2F"),
            ("m77", "1I", "3rd_pool_m77"),
            ("m78", "2E", "2I"),
            ("m79", "1A", "3rd_pool_m79"),
            ("m80", "1L", "3rd_pool_m80"),
            ("m81", "1D", "3rd_pool_m81"),
            ("m82", "1G", "3rd_pool_m82"),
            ("m83", "2K", "2L"),
            ("m84", "1H", "2J"),
            ("m85", "1B", "3rd_pool_m85"),
            ("m86", "1J", "2H"),
            ("m87", "1K", "3rd_pool_m87"),
            ("m88", "2D", "2G"),
        ],
    ),
    (
        "Round of 16",
        [
            ("m89", "W74", "W77"),
            ("m90", "W73", "W75"),
            ("m91", "W76", "W78"),
            ("m92", "W79", "W80"),
            ("m93", "W83", "W84"),
            ("m94", "W81", "W82"),
            ("m95", "W86", "W88"),
            ("m96", "W85", "W87"),
        ],
    ),
    (
        "Quarter-finals",
        [
            ("m97", "W89", "W90"),
            ("m98", "W93", "W94"),
            ("m99", "W91", "W92"),
            ("m100", "W95", "W96"),
        ],
    ),
    ("Semi-finals", [("m101", "W97", "W98"), ("m102", "W99", "W100")]),
    ("Bronze Final", [("m103", "L101", "L102")]),
    ("Final", [("m104", "W101", "W102")]),
]

# ---------------------------------------------------------------------------
# Standings computation
# ---------------------------------------------------------------------------


@dataclass
class TeamRecord:
    code: str
    group: str
    pts: int = 0
    w: int = 0
    d: int = 0
    l: int = 0
    gf: int = 0
    ga: int = 0


def compute_group_standings(
    label: str, results: dict[str, dict[str, int]]
) -> list[TeamRecord]:
    teams: dict[str, TeamRecord] = {}
    for mid, r in results.items():
        if not mid.startswith(f"g_{label.lower()}_"):
            continue
        a, b = list(r.keys())
        sa, sb = r[a], r[b]
        for code in (a, b):
            teams.setdefault(code, TeamRecord(code=code, group=label))
        teams[a].gf += sa
        teams[a].ga += sb
        teams[b].gf += sb
        teams[b].ga += sa
        if sa > sb:
            teams[a].pts += 3
            teams[a].w += 1
            teams[b].l += 1
        elif sa == sb:
            teams[a].pts += 1
            teams[b].pts += 1
            teams[a].d += 1
            teams[b].d += 1
        else:
            teams[b].pts += 3
            teams[b].w += 1
            teams[a].l += 1

    codes = list(teams.keys())

    def h2h(t: TeamRecord) -> tuple:
        h_pts = h_gd = h_gf = 0
        for o in codes:
            if o == t.code:
                continue
            mid = [
                m
                for m, r in results.items()
                if m.startswith(f"g_{label.lower()}_") and t.code in r and o in r
            ]
            if mid:
                r = results[mid[0]]
                sa, sb = r[t.code], r[o]
                h_pts += 3 if sa > sb else (1 if sa == sb else 0)
                h_gd += sa - sb
                h_gf += sa
        return (-h_pts, -h_gd, -h_gf)

    return sorted(
        teams.values(), key=lambda t: (-t.pts, *h2h(t), -(t.gf - t.ga), -t.gf, t.code)
    )


def compute_group_info(
    group_stage: list[MatchResult],
) -> tuple[dict[str, list[TeamRecord]], dict[str, str], list[str], dict[str, str]]:
    """Return (standings, qualifiers, best_third_codes, group_of)."""
    results: dict[str, dict[str, int]] = {}
    for m in group_stage:
        results[m.match_id] = {m.team_a: m.score_a, m.team_b: m.score_b}

    standings = {l: compute_group_standings(l, results) for l, _ in GROUP_FIXTURES}
    qualifiers: dict[str, str] = {}
    group_of: dict[str, str] = {}
    third_placed: list[tuple[TeamRecord, int]] = []

    for idx, (label, _) in enumerate(GROUP_FIXTURES):
        for pos, t in enumerate(standings[label], 1):
            qualifiers[f"{pos}{label}"] = t.code
            group_of[t.code] = label
            if pos == 3:
                third_placed.append((t, idx))

    third_placed.sort(key=lambda x: (-x[0].pts, -(x[0].gf - x[0].ga), -x[0].gf))
    best_third = [t.code for t, _ in third_placed[:8]]
    return standings, qualifiers, best_third, group_of


# ---------------------------------------------------------------------------
# Bracket resolution
# ---------------------------------------------------------------------------


def resolve_bracket(
    qualifiers: dict[str, str],
    best_third: list[str],
    group_of: dict[str, str],
    round_results: dict[str, list[MatchResult]],
) -> dict[str, dict[str, str]]:
    """Resolve placeholders to actual team codes for each round.

    Returns {round_name: {match_id: (team_a, team_b)}}.
    """
    # Map all matches from every completed round
    all_matches: dict[str, MatchResult] = {}
    for matches in round_results.values():
        for m in matches:
            all_matches[m.match_id] = m

    # Assign 3rd-place pool slots
    third_assigned: dict[str, str] = {}
    used: set[str] = set()
    for mid in ["m74", "m77", "m79", "m80", "m81", "m82", "m85", "m87"]:
        pool = THIRD_PLACE_POOLS[mid]
        chosen = next(
            (t for t in best_third if group_of.get(t, "") in pool and t not in used),
            best_third[0] if best_third else "???",
        )
        third_assigned[mid] = chosen
        used.add(chosen)

    def resolve(slot: str) -> str:
        if slot.startswith("3rd_pool_"):
            return third_assigned.get(slot[9:], "???")
        if slot.startswith("W") or slot.startswith("L"):
            match_key = "m" + slot[1:]
            if match_key in all_matches:
                m = all_matches[match_key]
                if slot.startswith("W"):
                    return m.team_a if m.score_a > m.score_b else m.team_b
                else:
                    return m.team_a if m.score_a < m.score_b else m.team_b
            return f"?{slot}?"
        return qualifiers.get(slot, slot)

    resolved: dict[str, dict[str, tuple[str, str]]] = {}
    for round_name, matches in BRACKET:
        resolved[round_name] = {}
        for mid, slot_a, slot_b in matches:
            resolved[round_name][mid] = (
                resolve(slot_a),
                resolve(slot_b),
            )
    return resolved


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------


def group_stage_prompt(label: str, fixtures: list[tuple[str, str, str]]) -> str:
    lines = [f"## Group {label} Fixtures"]
    for mid, ta, tb in fixtures:
        lines.append(f"  {mid}: {ta} vs {tb}")
    return "\n".join(lines)


def round_prompt(
    round_name: str,
    matchups: dict[str, tuple[str, str]],
    previous_round_results: Optional[list[MatchResult]],
    group_standings_text: Optional[str],
) -> str:
    lines = [f"## {round_name}\n"]
    if group_standings_text:
        lines.append(group_standings_text)
        lines.append("")
    if previous_round_results:
        lines.append("### Previous Round")
        for m in previous_round_results:
            lines.append(
                f"  {m.match_id}: {m.team_a} {m.score_a}-{m.score_b} {m.team_b} — {m.summary}"
            )
        lines.append("")
    lines.append("### Matchups")
    for mid, (ta, tb) in sorted(matchups.items(), key=lambda x: int(x[0][1:])):
        lines.append(f"  {mid}: {ta} vs {tb}")
    return "\n".join(lines)


def standings_text(
    standings: dict[str, list[TeamRecord]], best_third: list[str]
) -> str:
    lines = ["| Group | 1st | 2nd | 3rd | 4th |"]
    lines.append("|-------|-----|-----|-----|-----|")
    for label, _ in GROUP_FIXTURES:
        gs = standings[label]
        rows = []
        for t in gs:
            gd = t.gf - t.ga
            rows.append(f"{t.code} (Pts:{t.pts} GD:{gd:+d})")
        lines.append(f"| {label} | " + " | ".join(rows) + " |")
    lines.append(f"\nQualified 3rd-placed teams (in order): {', '.join(best_third)}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Output assembly
# ---------------------------------------------------------------------------

ROUND_RANGES = [
    ("r32", set(range(73, 89))),
    ("r16", set(range(89, 97))),
    ("qf", set(range(97, 101))),
    ("sf", set(range(101, 103))),
    ("bronze", {103}),
    ("final", {104}),
]
# Build match-number → round-name lookup
_ROUND_LOOKUP: dict[int, str] = {}
for name, nums in ROUND_RANGES:
    for n in nums:
        _ROUND_LOOKUP[n] = name


def to_output(
    model_id: str,
    group_stage: list[MatchResult],
    round_results: dict[str, list[MatchResult]],
) -> dict:
    out: dict[str, dict] = {}
    for m in group_stage:
        out[m.match_id] = {m.team_a: m.score_a, m.team_b: m.score_b, "summary": m.summary}
    for _rname, matches in round_results.items():
        for m in matches:
            out[m.match_id] = {m.team_a: m.score_a, m.team_b: m.score_b, "summary": m.summary}
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def _supports_structured(model_id: str) -> bool:
    """True for models known to support json_schema response_format."""
    id_lower = model_id.lower()
    return any(k in id_lower for k in ("gpt-", "o1", "o3", "o4", "together"))


def _clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def predict_batch(
    client: OpenAI,
    model_id: str,
    user_content: str,
    batch_model: type[MatchBatch],
) -> MatchBatch:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    # Attempt 1: OpenAI-style structured output
    if _supports_structured(model_id):
        try:
            parsed = (
                client.beta.chat.completions.parse(
                    model=model_id,
                    messages=messages,
                    response_format=batch_model,
                    temperature=0,
                )
                .choices[0]
                .message.parsed
            )
            if parsed is not None:
                return parsed
        except Exception as e:
            print(f"    structured output failed ({e}), falling back...")

    # Attempt 2-3: json_object → plain text
    for rf in ({"type": "json_object"}, None):
        try:
            kwargs: dict = {"model": model_id, "messages": messages, "temperature": 0}
            if rf is not None:
                kwargs["response_format"] = rf
            resp = client.chat.completions.create(**kwargs)
            text = resp.choices[0].message.content
            if text:
                data = json.loads(_clean_json(text))
                return batch_model.model_validate(data)
        except Exception as e:
            if rf is not None:
                print(f"    json_object failed ({e}), trying plain...")
            else:
                raise ValueError(f"{model_id} failed to produce valid JSON: {e}") from e

    raise ValueError(f"{model_id} returned empty response")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate WC 2026 predictions")
    parser.add_argument("models", nargs="+", help="Model IDs (e.g. gpt-4o o3)")
    parser.add_argument(
        "--output-dir", default="scripts/predictions", help="Output directory"
    )
    args = parser.parse_args()

    client = OpenAI(api_key=os.environ["API_KEY"], base_url=BASE_URL)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for model_id in args.models:
        safe = model_id.replace("/", "_").replace(":", "_")
        out_path = output_dir / f"{safe}.json"
        if out_path.exists():
            print(f"  Skipping {model_id} (already exists)")
            continue

        print(f"\n--- {model_id} ---")

        # ------------------------------------------------------------------
        # Phase 1: Group stage — all 12 groups (with caching)
        # ------------------------------------------------------------------
        all_group_matches: list[MatchResult] = []
        pending_groups: list[tuple[str, list[tuple[str, str, str]]]] = []

        for label, fixtures in GROUP_FIXTURES:
            cached = load_cached_group(output_dir, safe, label)
            if cached is not None:
                print(f"  ⏺ Group {label}: {len(cached)} matches (cached)")
                all_group_matches.extend(cached)
            else:
                pending_groups.append((label, fixtures))

        if pending_groups:
            with ThreadPoolExecutor(max_workers=len(pending_groups)) as pool:
                fut_to_label: dict = {}
                for label, fixtures in pending_groups:
                    fut = pool.submit(
                        predict_batch, client, model_id, group_stage_prompt(label, fixtures), MatchBatch
                    )
                    fut_to_label[fut] = (label, fixtures)
                for fut in as_completed(fut_to_label):
                    label, fixtures = fut_to_label[fut]
                    batch = fut.result()
                    print(f"  ✓ Group {label}: {len(batch.matches)} matches")
                    save_group_cache(output_dir, safe, label, batch.matches)
                    all_group_matches.extend(batch.matches)

        all_group_matches.sort(key=lambda m: m.match_id)
        print(f"  → {len(all_group_matches)} group matches total")

        # Compute standings
        standings, qualifiers, best_third, group_of = compute_group_info(
            all_group_matches
        )

        # ------------------------------------------------------------------
        # Phase 2: Playoffs — round by round (with caching)
        # ------------------------------------------------------------------
        round_results: dict[str, list[MatchResult]] = {}
        previous_results: Optional[list[MatchResult]] = None
        stand_text = standings_text(standings, best_third)

        # Rounds that get split into smaller batches (4 matches per batch)
        SPLIT_ROUNDS = {"Round of 32", "Round of 16"}

        for round_name, bracket_matches in BRACKET:
            # Resolve matchups dynamically from qualifiers + previous results
            matchups = resolve_bracket(qualifiers, best_third, group_of, round_results)[
                round_name
            ]
            sorted_mids = sorted(matchups.keys(), key=lambda x: int(x[1:]))

            # Split into chunks of 4 for larger rounds
            chunks = (
                [sorted_mids[i : i + 4] for i in range(0, len(sorted_mids), 4)]
                if round_name in SPLIT_ROUNDS
                else [sorted_mids]
            )

            round_matches = []
            pending_chunks: list[tuple[int, list[str]]] = []

            for chunk_idx, chunk_mids in enumerate(chunks):
                cached = load_cached_chunk(output_dir, safe, round_name, chunk_idx)
                if cached is not None:
                    print(f"  ⏺ {' '.join(chunk_mids)}: {len(cached)} matches (cached)")
                    round_matches.extend(cached)
                else:
                    pending_chunks.append((chunk_idx, chunk_mids))

            if pending_chunks:
                with ThreadPoolExecutor(max_workers=len(pending_chunks)) as pool:
                    chunk_futs = []
                    for chunk_idx, chunk_mids in pending_chunks:
                        chunk_matchups = {mid: matchups[mid] for mid in chunk_mids}
                        user_prompt = round_prompt(
                            round_name,
                            chunk_matchups,
                            previous_results,
                            stand_text if round_name == "Round of 32" else None,
                        )
                        fut = pool.submit(predict_batch, client, model_id, user_prompt, MatchBatch)
                        chunk_futs.append((chunk_idx, chunk_mids, fut))
                    for chunk_idx, chunk_mids, fut in chunk_futs:
                        batch = fut.result()
                        print(f"  ✓ {' '.join(chunk_mids)}: {len(batch.matches)} matches")
                        save_chunk_cache(output_dir, safe, round_name, chunk_idx, batch.matches)
                        round_matches.extend(batch.matches)

            round_matches.sort(key=lambda m: m.match_id)
            print(f"    ✓ {len(round_matches)} total for {round_name}")
            round_results[round_name] = round_matches
            previous_results = round_matches

        # ------------------------------------------------------------------
        # Write output
        # ------------------------------------------------------------------
        output = to_output(model_id, all_group_matches, round_results)
        out_path.write_text(json.dumps(output, indent=2))
        print(f"  -> {out_path}")


if __name__ == "__main__":
    main()
