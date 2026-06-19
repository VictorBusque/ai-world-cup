# AI World Cup Predictor ⚽🤖

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Bun](https://img.shields.io/badge/runtime-bun-black?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/ui-react-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/lang-typescript-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/build-vite-646cff?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/style-tailwind-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

An interactive dashboard that pits the world's top AI models against each other to predict outcomes of the **2026 FIFA World Cup** (USA / Canada / Mexico). Each model forecasts every group-stage match, and we score them in real time as results come in.

**Live demo →** [https://github.com/VictorBusque/ai-world-cup](https://github.com/VictorBusque/ai-world-cup)

---

## ✨ Features

- **Leaderboard** — Rank 12 AI models by prediction accuracy (correct result = 3 pts, each nailed team score = 1 pt; max 5 pts/match).
- **Match-by-Match** — Drill into every game to see how each model predicted vs. reality.
- **Standings Comparison** — Compare real group standings vs. each model's projected standings.
- **Evolution Chart** — Track how models rise and fall over the course of the tournament.
- **Playoff Bracket** — Knockout-stage predictions (activates once group stage completes).
- **Predictions** — Each model's pick for champion, runner-up, and bronze winner.
- **AI Commentary** — Gemini-powered tactical breakdowns comparing how the models diverge on each match.
- **Dark, data-dense UI** — Built with Tailwind CSS, Lucide icons, and Motion for animations.

## 🤖 Models Competing

| Model | Provider |
|-------|----------|
| GPT-5.5 | OpenAI |
| Claude Opus 4.8 | Anthropic |
| Claude Sonnet 4.6 | Anthropic |
| Claude Fable 5 | Anthropic |
| Gemini 3.1 Pro | Google |
| Gemini 3.5 Flash | Google |
| DeepSeek V4 Pro | DeepSeek |
| DeepSeek V4 Flash | DeepSeek |
| Mistral Medium 3.5 | Mistral |
| Kimi K2.6 | Moonshot |
| Nemotron 3 Super | NVIDIA |
| GLM 5.2 | Zhipu AI |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 (or Node.js ≥ 20 with npm)
- A **Gemini API key** (for AI commentary features) — [get one here](https://aistudio.google.com/apikey)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/VictorBusque/ai-world-cup.git
cd ai-world-cup

# Install dependencies
bun install

# Create your env file
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
bun run build
bun run start
```

## 📂 Project Structure

```
├── public/data/
│   ├── tournament.json          # Teams, groups, match schedule & scores
│   └── models/                  # One JSON per AI model with predictions
├── scripts/
│   └── predict.py               # Python script to query AI models via an OpenAI-compatible gateway (system prompt embedded)
├── server.ts                    # Express + Vite dev server (also Gemini API proxy)
├── src/
│   ├── App.tsx                  # Main app shell, tabs, header
│   ├── main.tsx                 # React entry point
│   ├── data.ts                  # Data loader (fetches tournament + model JSONs)
│   ├── utils.ts                 # Scoring, standings calculations
│   ├── constants.ts             # Round metadata, model colors, team helpers
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.css                # Tailwind base styles
│   └── components/
│       ├── LeaderboardTab.tsx
│       ├── MatchesTab.tsx
│       ├── StandingsTab.tsx
│       ├── EvolutionTab.tsx
│       ├── PlayoffsTab.tsx
│       ├── PredictionsTab.tsx
│       └── ModelDetailModal.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🧪 Generating Predictions

The `scripts/predict.py` script sends the tournament context (system prompt embedded in the file) to each AI model via an OpenAI-compatible API gateway, using Pydantic structured outputs with per-match reasoning. It runs the group stage first, then the playoffs round by round.

### Prerequisites

- Python ≥ 3.10
- Install deps: `pip install openai pydantic`

### Run

```bash
# Set your gateway API key
export API_KEY="your-key-here"

# Generate predictions for one or more models (by gateway model id)
python scripts/predict.py gpt-5.5 claude-opus-4-8 gemini-3.1-pro
```

Output is written to `scripts/predictions/<model>.json` (existing files are skipped). Copy the generated files into `public/data/models/` so the dashboard loads them. To re-run a model, delete its output file first.

## 🏗️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide React
- **Backend:** Express.js, Vite middleware (dev) / static serving (prod)
- **AI Integration:** Google Gemini API (commentary), OpenAI-compatible gateway (predictions)
- **Predictions Tooling:** Python with the OpenAI SDK and Pydantic structured outputs
- **Build:** Vite 6, Bun

## 🤝 Contributing

Contributions are welcome! Whether it's adding new AI models, improving the scoring system, fixing bugs, or enhancing the UI.

Please read the [Contributing Guide](CONTRIBUTING.md) to get started.

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

- Tournament data sourced from official FIFA 2026 World Cup announcements.

---

<div align="center">
Made with ⚽ and 🤖 by <a href="https://github.com/VictorBusque">Victor Busque</a>
</div>
