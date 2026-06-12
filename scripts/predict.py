#!/usr/bin/env python3
"""
Generate World Cup 2026 predictions using multiple models via the OpenAI SDK
with Pydantic structured outputs.

Usage:
    python generate.py gpt-4o o3 claude-opus-4-5
    python generate.py gpt-4o --output-dir results
"""

import json
import os
import argparse
import concurrent.futures
from pathlib import Path

import httpx
from pydantic import BaseModel, Field
from openai import OpenAI

BASE_URL = "https://ai-gateway.stack.victorbusque.com"

# ---------------------------------------------------------------------------
# Provider / colour helpers
# ---------------------------------------------------------------------------

PROVIDER_MAP: dict[str, str] = {
    "gpt": "openai",
    "claude": "anthropic",
    "gemini": "google",
    "palm": "google",
}

PROVIDER_COLORS: dict[str, str] = {
    "openai": "from-green-500 to-teal-600",
    "anthropic": "from-orange-400 to-amber-600",
    "google": "from-blue-500 to-indigo-600",
    "meta": "from-blue-600 to-blue-800",
    "mistral": "from-orange-500 to-red-500",
    "alibaba": "from-orange-600 to-red-700",
    "deepseek": "from-sky-500 to-cyan-600",
    "xai": "from-gray-700 to-gray-900",
    "cohere": "from-purple-500 to-violet-600",
    "default": "from-slate-500 to-gray-600",
}


def infer_provider(model_id: str) -> str:
    """Best-effort provider inference from a model ID string."""
    # Handle OpenRouter-style  "provider/model-name"
    if "/" in model_id:
        return model_id.split("/")[0].lower()

    lower = model_id.lower()
    for prefix, provider in PROVIDER_MAP.items():
        if lower.startswith(prefix):
            return provider
    return "unknown"


def provider_color(provider: str) -> str:
    return PROVIDER_COLORS.get(provider, PROVIDER_COLORS["default"])


# ---------------------------------------------------------------------------
# Pydantic schema
# OpenAI structured outputs require additionalProperties:false everywhere, so
# Dict[str, …] is forbidden.  We use lists of explicit match objects instead
# and reshape to the dict template format afterwards.
# ---------------------------------------------------------------------------


class MatchResult(BaseModel):
    match_id: str = Field(description="Match identifier, e.g. 'g_a_1' or 'm73'")
    team_a: str = Field(description="3-letter code of the first team, e.g. 'MEX'")
    score_a: int = Field(description="Goals scored by team_a")
    team_b: str = Field(description="3-letter code of the second team, e.g. 'RSA'")
    score_b: int = Field(description="Goals scored by team_b")


class WorldCupPrediction(BaseModel):
    name: str = Field(description="Model identifier, e.g. gpt-4o")
    provider: str = Field(description="Provider name, e.g. openai")
    color: str = Field(description="Tailwind CSS gradient classes for UI display")
    group_stage: list[MatchResult] = Field(
        description="All 72 group-stage matches (g_a_1 … g_l_6)."
    )
    playoffs: list[MatchResult] = Field(
        description=(
            "All 32 playoff matches in order: m73–m88 (R32), m89–m96 (R16), "
            "m97–m100 (QF), m101–m102 (SF), m103 (bronze), m104 (final). "
            "Use the actual 3-letter team codes derived from your group-stage results."
        )
    )


# ---------------------------------------------------------------------------
# Reshape list-based output → dict template format
# ---------------------------------------------------------------------------

_ROUND_RANGES: list[tuple[str, set[int]]] = [
    ("r32", set(range(73, 89))),
    ("r16", set(range(89, 97))),
    ("qf", set(range(97, 101))),
    ("sf", set(range(101, 103))),
    ("bronze", {103}),
    ("final", {104}),
]


def to_template_format(prediction: WorldCupPrediction) -> dict:
    """Convert the Pydantic object into the JSON template structure."""
    group: dict[str, dict[str, int]] = {}
    for m in prediction.group_stage:
        group[m.match_id] = {m.team_a: m.score_a, m.team_b: m.score_b}

    rounds: dict[str, dict[str, dict[str, int]]] = {
        name: {} for name, _ in _ROUND_RANGES
    }
    for m in prediction.playoffs:
        try:
            num = int(m.match_id.lstrip("m"))
        except ValueError:
            continue
        for round_name, nums in _ROUND_RANGES:
            if num in nums:
                rounds[round_name][m.match_id] = {
                    m.team_a: m.score_a,
                    m.team_b: m.score_b,
                }
                break

    return {
        "name": prediction.name,
        "provider": prediction.provider,
        "color": prediction.color,
        "predictions": group,
        "playoffs": rounds,
    }


# ---------------------------------------------------------------------------
# Core generation logic
# ---------------------------------------------------------------------------


def load_prompt() -> str:
    return (Path(__file__).parent / "prompt.md").read_text()


def build_system_message(
    model_id: str, provider: str, color: str, raw_prompt: str
) -> str:
    return (
        f"You are running as model '{model_id}' provided by '{provider}'.\n"
        f"When filling in the structured output fields:\n"
        f"  • 'name'     → use exactly: {model_id}\n"
        f"  • 'provider' → use exactly: {provider}\n"
        f"  • 'color'    → use exactly: {color}\n\n"
        f"{raw_prompt}"
    )


def generate_prediction(
    client: OpenAI,
    model_id: str,
    raw_prompt: str,
    *,
    max_completion_tokens: int = 5000000,
) -> WorldCupPrediction:
    provider = infer_provider(model_id)
    color = provider_color(provider)

    response = client.beta.chat.completions.parse(
        model=model_id,
        messages=[
            {
                "role": "system",
                "content": build_system_message(model_id, provider, color, raw_prompt),
            },
            {
                "role": "user",
                "content": (
                    "Generate your complete World Cup 2026 predictions now. "
                    "Fill every group-stage match and every playoff round exactly "
                    "as instructed. Ensure playoff brackets are internally consistent "
                    "with your group-stage results."
                ),
            },
        ],
        response_format=WorldCupPrediction,
        max_completion_tokens=max_completion_tokens,
        max_tokens=max_completion_tokens,
        temperature=0,
    )

    parsed = response.choices[0].message.parsed
    if parsed is None:
        raise ValueError(
            f"Model {model_id} returned a refusal or unparseable response: {response.choices[0].message.refusal}"
        )
    return parsed


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate WC 2026 predictions with structured outputs from multiple models."
    )
    parser.add_argument(
        "models",
        nargs="+",
        help="One or more model IDs (e.g. gpt-4o o3 claude-opus-4-5)",
    )
    parser.add_argument(
        "--output-dir",
        default="predictions",
        help="Directory to write JSON files into (default: predictions/)",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=32_000,
        help="Max completion tokens per request (default: 16000)",
    )
    args = parser.parse_args()

    client = OpenAI(
        api_key=os.environ["ANTHROPIC_AUTH_TOKEN"],
        base_url=BASE_URL,
        http_client=httpx.Client(verify=False),
    )
    raw_prompt = load_prompt()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict] = [None] * len(args.models)  # preserve ordering

    def run(index: int, model_id: str) -> None:
        provider = infer_provider(model_id)
        print(f"→ {model_id}  (provider: {provider})")
        safe_name = model_id.replace("/", "_").replace(":", "_")
        out_path = output_dir / f"{safe_name}.json"
        if out_path.exists():
            print(f"  ↷ {model_id} already exists, skipping")
            results[index] = json.loads(out_path.read_text())
            return
        try:
            prediction = generate_prediction(
                client,
                model_id,
                raw_prompt,
                max_completion_tokens=args.max_tokens,
            )
            output = {
                "model": model_id,
                **to_template_format(prediction),
            }
            out_path.write_text(json.dumps(output, indent=2))
            print(f"  ✓ {model_id} → {out_path}")
            results[index] = output
        except Exception as exc:
            print(f"  ✗ {model_id} FAILED: {exc}")
            raise

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(args.models)) as pool:
        futures = {
            pool.submit(run, i, model_id): model_id
            for i, model_id in enumerate(args.models)
        }
        for fut in concurrent.futures.as_completed(futures):
            fut.result()  # re-raise any exception from the worker

    # Also write a combined file when multiple models were run
    completed = [r for r in results if r is not None]
    if len(completed) > 1:
        combined_path = output_dir / "_all.json"
        combined_path.write_text(json.dumps(completed, indent=2))
        print(f"\n✓ Combined file → {combined_path}")


if __name__ == "__main__":
    main()
