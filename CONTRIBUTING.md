# Contributing to AI World Cup Predictor

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to this project. Use your best judgment — if something isn't covered here, feel free to open an issue to discuss it.

## Table of Contents

- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Adding a New AI Model](#adding-a-new-ai-model)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## How Can I Contribute?

- **Fix bugs** — check [open issues](https://github.com/VictorBusque/ai-world-cup/issues) for known bugs.
- **Add AI models** — see [Adding a New AI Model](#adding-a-new-ai-model) below.
- **Improve the UI** — better visualizations, responsive fixes, accessibility.
- **Enhance scoring** — improve the prediction scoring algorithm.
- **Write docs** — clarify setup steps, add comments, improve README.

## Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/ai-world-cup.git
cd ai-world-cup

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start dev server
bun run dev

# In a separate terminal, type-check continuously
bun run lint
```

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name:
   - `feat/add-new-model`
   - `fix/leaderboard-sorting`
   - `docs/update-readme`
2. **Make your changes** with clear, focused commits.
3. **Test your changes** — run `bun run lint` and verify the app works locally.
4. **Update documentation** if you've changed behavior or added features.
5. **Open a Pull Request** against `main` with:
   - A clear title and description of what changed.
   - Screenshots for any UI changes.
   - Reference to any related issues (e.g., "Fixes #12").
6. **Respond to review feedback** promptly.

## Coding Standards

- **TypeScript** — all new code should be typed. Avoid `any`.
- **Components** — one component per file, named exports (no default exports for components).
- **Styling** — Tailwind CSS utility classes. Keep the dark theme aesthetic.
- **Formatting** — follow existing code style. Prettier-compatible.
- **Commits** — use conventional commit messages when possible:
  - `feat: add knockout bracket visualization`
  - `fix: correct group standings tiebreaker logic`
  - `docs: add contributing guide`

## Adding a New AI Model

1. Add your model to the `MODELS` array in `scripts/predict.js`:
   ```js
   { model: "your-model-id", file: "your-model-slug" }
   ```
2. Run the prediction script (requires an API gateway with the model available):
   ```bash
   export AI_GATEWAY_KEY="your-key"
   bun run scripts/predict.js
   ```
3. Verify the generated JSON file appears in `public/data/models/`.
4. Add the model slug to the `MODEL_FILES` array in `src/data.ts`.
5. Test that the model appears correctly in the dashboard.
6. Open a PR with both the JSON file and the `data.ts` change.

**Alternatively**, if you don't have API access to a model, you can:
- Create the JSON file manually following the template in `scripts/prediction-template.json`.
- Open a PR and we'll verify the format.

## Reporting Bugs

Open a [GitHub Issue](https://github.com/VictorBusque/ai-world-cup/issues/new?template=bug_report.md) with:

- **Description** of the bug.
- **Steps to reproduce** the behavior.
- **Expected vs. actual behavior**.
- **Screenshots** if applicable.
- **Environment** (browser, OS, Node/Bun version).

## Feature Requests

Open a [GitHub Issue](https://github.com/VictorBusque/ai-world-cup/issues/new?template=feature_request.md) describing:

- The problem or gap you want to address.
- Your proposed solution.
- Any alternatives you've considered.

## Code of Conduct

Be respectful. Be constructive. We're all here because we love football and AI.

---

Thanks again for your contribution! ⚽🤖
