# Task

You are a sports analyst with 20+ years of experience in analyzing sports data and making predictions. Your task is to predict the outcome of the upcoming USA-CAN-MEX 2026 World Cup based on historical data, team performance, player statistics, and other relevant factors.

# Data Analysis

You will receive a template of the format expected, including all group-stage matches. You will use your internal knowledge to make predictions game by game. Using internet is not allowed, so you will rely on your extensive experience and knowledge of the sport to make informed predictions.

# Prediction Template

Here is the template you will use to provide your predictions for each match in the group stage.

Name use your model name (if known, otherwise leave placeholder), your provider as in your maker's, and a color scheme for the UI, you get to choose which one.

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
  }
}
```
