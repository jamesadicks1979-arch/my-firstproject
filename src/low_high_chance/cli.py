from __future__ import annotations

import argparse
import sys

from .core import classify_probability


def _parse_probability(raw: str) -> float:
    s = raw.strip()
    if not s:
        raise ValueError("Empty probability input.")
    if s.endswith("%"):
        return float(s[:-1].strip())
    return float(s)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="low-high-chance",
        description="Classify a probability as low/high chance.",
    )
    p.add_argument(
        "value",
        help='Probability as 0..1 (e.g. "0.72") or percent (e.g. "72%%").',
    )
    p.add_argument(
        "--threshold",
        default="0.5",
        help='Threshold as 0..1 or percent (default: "0.5").',
    )
    p.add_argument(
        "--quiet",
        action="store_true",
        help="Print only 'low' or 'high'.",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        value = _parse_probability(args.value)
        threshold = _parse_probability(args.threshold)
        result = classify_probability(value, threshold=threshold)
    except Exception as e:  # noqa: BLE001 - CLI should convert to user-friendly error
        print(f"error: {e}", file=sys.stderr)
        return 2

    if args.quiet:
        print(result.label)
        return 0

    print(f"{result.label} chance ({result.percent:.2f}% >= {result.threshold * 100.0:.2f}%)")
    return 0
