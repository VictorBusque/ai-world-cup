# Task

You are a sports analyst with 20+ years of experience in analyzing sports data and making predictions. Your task is to predict the outcome of the upcoming USA-CAN-MEX 2026 World Cup based on historical data, team performance, player statistics, and other relevant factors.

# Data Analysis

You will receive a template of the format expected, including all group-stage matches. You will use your internal knowledge to make predictions game by game. Using internet is not allowed, so you will rely on your extensive experience and knowledge of the sport to make informed predictions.

# Group Stage

Predict exact scores for all 72 group-stage matches. Use the match IDs and team codes exactly as given.

# Playoff Predictions

Based on your group-stage scores, compute the final standings in each group. The top 2 from each group plus the 8 best third-placed teams advance to a 32-team knockout round. Then predict every playoff match using the **exact same format** as the group stage: `{ "TEAM_A": score, "TEAM_B": score }` — regular time score (or extra time if needed to determine a winner; do NOT predict draws in knockout rounds).

## Bracket — Round of 32

| Match | Matchup |
|-------|---------|
| m73 | Group A runners-up vs Group B runners-up |
| m74 | Group E winners vs Best 3rd from (A/B/C/D/F) |
| m75 | Group F winners vs Group C runners-up |
| m76 | Group C winners vs Group F runners-up |
| m77 | Group I winners vs Best 3rd from (C/D/F/G/H) |
| m78 | Group E runners-up vs Group I runners-up |
| m79 | Group A winners vs Best 3rd from (C/E/F/H/I) |
| m80 | Group L winners vs Best 3rd from (E/H/I/J/K) |
| m81 | Group D winners vs Best 3rd from (B/E/F/I/J) |
| m82 | Group G winners vs Best 3rd from (A/E/H/I/J) |
| m83 | Group K runners-up vs Group L runners-up |
| m84 | Group H winners vs Group J runners-up |
| m85 | Group B winners vs Best 3rd from (E/F/G/I/J) |
| m86 | Group J winners vs Group H runners-up |
| m87 | Group K winners vs Best 3rd from (D/E/I/J/L) |
| m88 | Group D runners-up vs Group G runners-up |

## Bracket — Round of 16

| Match | Matchup |
|-------|---------|
| m89 | Winner m74 vs Winner m77 |
| m90 | Winner m73 vs Winner m75 |
| m91 | Winner m76 vs Winner m78 |
| m92 | Winner m79 vs Winner m80 |
| m93 | Winner m83 vs Winner m84 |
| m94 | Winner m81 vs Winner m82 |
| m95 | Winner m86 vs Winner m88 |
| m96 | Winner m85 vs Winner m87 |

## Bracket — Quarter-finals

| Match | Matchup |
|-------|---------|
| m97 | Winner m89 vs Winner m90 |
| m98 | Winner m93 vs Winner m94 |
| m99 | Winner m91 vs Winner m92 |
| m100 | Winner m95 vs Winner m96 |

## Bracket — Semi-finals

| Match | Matchup |
|-------|---------|
| m101 | Winner m97 vs Winner m98 |
| m102 | Winner m99 vs Winner m100 |

## Bronze final

| Match | Matchup |
|-------|---------|
| m103 | Loser m101 vs Loser m102 |

## Final

| Match | Matchup |
|-------|---------|
| m104 | Winner m101 vs Winner m102 |

# Prediction Template

```json
{
  "name": "YOUR_MODEL_NAME",
  "provider": "YOUR_PROVIDER",
  "color": "from-blue-500 to-indigo-600",
  "predictions": {
    "g_a_1": { "MEX": null, "RSA": null },
    "g_a_2": { "KOR": null, "CZE": null },
    "g_a_3": { "MEX": null, "KOR": null },
    "g_a_4": { "RSA": null, "CZE": null },
    "g_a_5": { "MEX": null, "CZE": null },
    "g_a_6": { "RSA": null, "KOR": null },

    "g_b_1": { "CAN": null, "SUI": null },
    "g_b_2": { "QAT": null, "BIH": null },
    "g_b_3": { "CAN": null, "QAT": null },
    "g_b_4": { "SUI": null, "BIH": null },
    "g_b_5": { "CAN": null, "BIH": null },
    "g_b_6": { "SUI": null, "QAT": null },

    "g_c_1": { "BRA": null, "MAR": null },
    "g_c_2": { "HAI": null, "SCO": null },
    "g_c_3": { "BRA": null, "HAI": null },
    "g_c_4": { "MAR": null, "SCO": null },
    "g_c_5": { "BRA": null, "SCO": null },
    "g_c_6": { "MAR": null, "HAI": null },

    "g_d_1": { "USA": null, "PAR": null },
    "g_d_2": { "AUS": null, "TUR": null },
    "g_d_3": { "USA": null, "AUS": null },
    "g_d_4": { "PAR": null, "TUR": null },
    "g_d_5": { "USA": null, "TUR": null },
    "g_d_6": { "PAR": null, "AUS": null },

    "g_e_1": { "GER": null, "CUW": null },
    "g_e_2": { "CIV": null, "ECU": null },
    "g_e_3": { "GER": null, "CIV": null },
    "g_e_4": { "CUW": null, "ECU": null },
    "g_e_5": { "GER": null, "ECU": null },
    "g_e_6": { "CUW": null, "CIV": null },

    "g_f_1": { "NED": null, "JPN": null },
    "g_f_2": { "SWE": null, "TUN": null },
    "g_f_3": { "NED": null, "SWE": null },
    "g_f_4": { "JPN": null, "TUN": null },
    "g_f_5": { "NED": null, "TUN": null },
    "g_f_6": { "JPN": null, "SWE": null },

    "g_g_1": { "BEL": null, "EGY": null },
    "g_g_2": { "IRN": null, "NZL": null },
    "g_g_3": { "BEL": null, "IRN": null },
    "g_g_4": { "EGY": null, "NZL": null },
    "g_g_5": { "BEL": null, "NZL": null },
    "g_g_6": { "EGY": null, "IRN": null },

    "g_h_1": { "ESP": null, "CPV": null },
    "g_h_2": { "KSA": null, "URU": null },
    "g_h_3": { "ESP": null, "KSA": null },
    "g_h_4": { "CPV": null, "URU": null },
    "g_h_5": { "ESP": null, "URU": null },
    "g_h_6": { "CPV": null, "KSA": null },

    "g_i_1": { "FRA": null, "SEN": null },
    "g_i_2": { "NOR": null, "IRQ": null },
    "g_i_3": { "FRA": null, "NOR": null },
    "g_i_4": { "SEN": null, "IRQ": null },
    "g_i_5": { "FRA": null, "IRQ": null },
    "g_i_6": { "SEN": null, "NOR": null },

    "g_j_1": { "ARG": null, "ALG": null },
    "g_j_2": { "AUT": null, "JOR": null },
    "g_j_3": { "ARG": null, "AUT": null },
    "g_j_4": { "ALG": null, "JOR": null },
    "g_j_5": { "ARG": null, "JOR": null },
    "g_j_6": { "ALG": null, "AUT": null },

    "g_k_1": { "POR": null, "COD": null },
    "g_k_2": { "UZB": null, "COL": null },
    "g_k_3": { "POR": null, "UZB": null },
    "g_k_4": { "COD": null, "COL": null },
    "g_k_5": { "POR": null, "COL": null },
    "g_k_6": { "COD": null, "UZB": null },

    "g_l_1": { "ENG": null, "CRO": null },
    "g_l_2": { "GHA": null, "PAN": null },
    "g_l_3": { "ENG": null, "GHA": null },
    "g_l_4": { "CRO": null, "PAN": null },
    "g_l_5": { "ENG": null, "PAN": null },
    "g_l_6": { "CRO": null, "GHA": null }
  },
  "playoffs": {
    "r32": {
      "m73": { "TEAM_A": null, "TEAM_B": null },
      "m74": { "TEAM_A": null, "TEAM_B": null },
      "m75": { "TEAM_A": null, "TEAM_B": null },
      "m76": { "TEAM_A": null, "TEAM_B": null },
      "m77": { "TEAM_A": null, "TEAM_B": null },
      "m78": { "TEAM_A": null, "TEAM_B": null },
      "m79": { "TEAM_A": null, "TEAM_B": null },
      "m80": { "TEAM_A": null, "TEAM_B": null },
      "m81": { "TEAM_A": null, "TEAM_B": null },
      "m82": { "TEAM_A": null, "TEAM_B": null },
      "m83": { "TEAM_A": null, "TEAM_B": null },
      "m84": { "TEAM_A": null, "TEAM_B": null },
      "m85": { "TEAM_A": null, "TEAM_B": null },
      "m86": { "TEAM_A": null, "TEAM_B": null },
      "m87": { "TEAM_A": null, "TEAM_B": null },
      "m88": { "TEAM_A": null, "TEAM_B": null }
    },
    "r16": {
      "m89": { "TEAM_A": null, "TEAM_B": null },
      "m90": { "TEAM_A": null, "TEAM_B": null },
      "m91": { "TEAM_A": null, "TEAM_B": null },
      "m92": { "TEAM_A": null, "TEAM_B": null },
      "m93": { "TEAM_A": null, "TEAM_B": null },
      "m94": { "TEAM_A": null, "TEAM_B": null },
      "m95": { "TEAM_A": null, "TEAM_B": null },
      "m96": { "TEAM_A": null, "TEAM_B": null }
    },
    "qf": {
      "m97": { "TEAM_A": null, "TEAM_B": null },
      "m98": { "TEAM_A": null, "TEAM_B": null },
      "m99": { "TEAM_A": null, "TEAM_B": null },
      "m100": { "TEAM_A": null, "TEAM_B": null }
    },
    "sf": {
      "m101": { "TEAM_A": null, "TEAM_B": null },
      "m102": { "TEAM_A": null, "TEAM_B": null }
    },
    "bronze": {
      "m103": { "TEAM_A": null, "TEAM_B": null }
    },
    "final": {
      "m104": { "TEAM_A": null, "TEAM_B": null }
    }
  }
}
```

Fill in every `null` with the appropriate value:
- **Group stage**: exact scores (integers) for each team in each match.
- **Playoffs**: replace `TEAM_A` and `TEAM_B` with the actual 3-letter team codes of the two teams facing each other, and set each score. Knockout matches cannot end in a draw — if scores are level after regular time, show the extra-time score (e.g. `{ "BRA": 2, "FRA": 1 }` even if it was 1-1 after 90 min). The higher score indicates the winner.

Make sure your predictions are internally consistent:
1. Compute each group's final standings from your group-stage scores.
2. Identify which teams qualify (top 2 + 8 best third-placed).
3. Fill in the playoff bracket with the correct teams based on those standings.
4. Each subsequent round must use the winners (or losers, for the bronze match) from the previous round.
