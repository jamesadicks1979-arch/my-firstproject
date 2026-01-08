from __future__ import annotations

import argparse
import json
import sys

from .finance import alpha_mean_excess
from .fibonacci import fibonacci
from .levels import fib_extension_levels, fib_retracement_levels


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="fib-alpha", description="fib alpha utilities")
    sub = p.add_subparsers(dest="cmd", required=True)

    fib_p = sub.add_parser("fib", help="print first n Fibonacci numbers as JSON")
    fib_p.add_argument("--n", type=int, required=True)

    lvl_p = sub.add_parser("levels", help="print retracement levels as JSON")
    lvl_p.add_argument("--low", type=float, required=True)
    lvl_p.add_argument("--high", type=float, required=True)

    ext_p = sub.add_parser("extensions", help="print extension levels as JSON")
    ext_p.add_argument("--low", type=float, required=True)
    ext_p.add_argument("--high", type=float, required=True)

    a_p = sub.add_parser("alpha", help="compute mean excess return vs benchmark")
    a_p.add_argument("--returns", type=float, nargs="+", required=True)
    a_p.add_argument("--benchmark", type=float, nargs="+", required=True)
    a_p.add_argument("--annualization-factor", type=float, default=None)

    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.cmd == "fib":
        sys.stdout.write(json.dumps(fibonacci(args.n)) + "\n")
        return 0

    if args.cmd == "levels":
        sys.stdout.write(json.dumps(fib_retracement_levels(low=args.low, high=args.high)) + "\n")
        return 0

    if args.cmd == "extensions":
        sys.stdout.write(json.dumps(fib_extension_levels(low=args.low, high=args.high)) + "\n")
        return 0

    if args.cmd == "alpha":
        val = alpha_mean_excess(
            args.returns,
            args.benchmark,
            annualization_factor=args.annualization_factor,
        )
        sys.stdout.write(f"{val}\n")
        return 0

    raise AssertionError(f"unhandled cmd: {args.cmd!r}")


if __name__ == "__main__":
    raise SystemExit(main())
