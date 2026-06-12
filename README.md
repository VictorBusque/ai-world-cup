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

- **Leaderboard** — Rank 11 AI models by prediction accuracy (exact score = 3 pts, correct outcome = 1 pt).
- **Match-by-Match** — Drill into every game to see how each model predicted vs. reality.
- **Standings Comparison** — Compare real group standings vs. each model's projected standings.
- **Evolution Chart** — Track how models rise and fall over the course of the tournament.
- **Playoff Bracket** — Knockout-stage predictions (activates once group stage completes).
- **AI Commentary** — Gemini-powered tactical breakdowns and newsletter-style summaries.
- **Dark, data-dense UI** — Built with Tailwind CSS, Lucide icons, and Motion for animations.

## 🤖 Models Competing

| Model | Provider |
|-------|----------|
| GPT-5.5 | OpenAI |
| Claude Sonnet 4.6 | Anthropic |
| Claude Opus 4.8 | Anthropic |
| Claude Fable 5 | Anthropic |
| Gemini 3.1 Pro | Google |
| Gemini 3.5 Flash | Google |
| DeepSeek v4 Flash | DeepSeek |
| DeepSeek v4 Pro | DeepSeek |
| Mistral Medium 3.5 | Mistral AI |
| GLM 5.1 | Z.AI |
| Kimi K2.6 | Moonshot AI |
| Nemotron 3 Ultra | NVIDIA |

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
│   ├── predict.js               # Script to query AI models via an OpenAI-compatible gateway
│   ├── prediction_prompt.md     # System prompt sent to models
│   └── prediction-template.json # JSON template for predictions
├── server.ts                    # Express + Vite dev server (also Gemini API proxy)
├── src/
│   ├── App.tsx                  # Main app shell, tabs, header
│   ├── main.tsx                 # React entry point
│   ├── data.ts                  # Data loader (fetches tournament + model JSONs)
│   ├── utils.ts                 # Scoring, standings calculations
│   ├── types.ts                 # TypeScript interfaces
│   ├── index.css                # Tailwind base styles
│   └── components/
│       ├── LeaderboardTab.tsx
│       ├── MatchesTab.tsx
│       ├── StandingsTab.tsx
│       ├── EvolutionTab.tsx
│       ├── PlayoffsTab.tsx
│       ├── ModelDetailModal.tsx
│       └── AnalystDeskTab.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🧪 Generating Predictions

The `scripts/predict.js` script sends the tournament template to each AI model via an OpenAI-compatible API gateway and saves predictions as JSON files.

```bash
# Set your API gateway key
export AI_GATEWAY_KEY="your-key-here"

# Run predictions (skips models that already have files)
bun run scripts/predict.js
```

To re-run a specific model, delete its JSON file from `public/data/models/` first.

## 🏗️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide React
- **Backend:** Express.js, Vite middleware (dev) / static serving (prod)
- **AI Integration:** Google Gemini API (commentary), OpenAI-compatible gateway (predictions)
- **Build:** Vite 6, Bun

## 🤝 Contributing

Contributions are welcome! Whether it's adding new AI models, improving the scoring system, fixing bugs, or enhancing the UI.

Please read the [Contributing Guide](CONTRIBUTING.md) to get started.

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All the AI models and their creators for participating in this experiment.
- Built with [Google AI Studio](https://ai.google.dev/) as a starting point.
- Tournament data sourced from official FIFA 2026 World Cup announcements.

---

<div align="center">
Made with ⚽ and 🤖 by <a href="https://github.com/VictorBusque">Victor Busque</a>
</div>
