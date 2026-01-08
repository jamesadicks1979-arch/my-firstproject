from __future__ import annotations

from collections.abc import Sequence


def alpha_mean_excess(
    returns: Sequence[float],
    benchmark_returns: Sequence[float],
    *,
    annualization_factor: float | None = None,
) -> float:
    """
    Compute a simple "alpha" as mean(returns - benchmark_returns).

    If annualization_factor is provided, returns are multiplied by it
    (useful when returns are per-period and you want a per-year figure).
    """
    if len(returns) != len(benchmark_returns):
        raise ValueError("returns and benchmark_returns must have the same length")
    if len(returns) == 0:
        raise ValueError("returns must be non-empty")

    excess_sum = 0.0
    for r, b in zip(returns, benchmark_returns, strict=True):
        excess_sum += float(r) - float(b)

    alpha = excess_sum / len(returns)
    if annualization_factor is not None:
        alpha *= float(annualization_factor)
    return alpha
