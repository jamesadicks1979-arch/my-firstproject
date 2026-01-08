from __future__ import annotations

from collections.abc import Iterable

DEFAULT_RATIOS: tuple[float, ...] = (0.236, 0.382, 0.5, 0.618, 0.786)
DEFAULT_EXTENSIONS: tuple[float, ...] = (1.272, 1.414, 1.618, 2.0, 2.618)


def _validate_low_high(low: float, high: float) -> tuple[float, float]:
    if low == high:
        raise ValueError("low and high must be different")
    if low > high:
        # normalize so callers can pass values in either order
        low, high = high, low
    return low, high


def fib_retracement_levels(
    *, low: float, high: float, ratios: Iterable[float] = DEFAULT_RATIOS
) -> dict[float, float]:
    """
    Fibonacci retracement levels for a move from low -> high.

    For an up-move from low to high, retracements are:
        level(r) = high - (high - low) * r

    Returns a dict mapping ratio -> level price.
    """
    low, high = _validate_low_high(low, high)
    move = high - low

    out: dict[float, float] = {}
    for r in ratios:
        if r < 0:
            raise ValueError("ratios must be >= 0")
        out[float(r)] = high - move * float(r)
    return out


def fib_extension_levels(
    *, low: float, high: float, extensions: Iterable[float] = DEFAULT_EXTENSIONS
) -> dict[float, float]:
    """
    Fibonacci extension levels for a move from low -> high.

    Extensions are:
        level(e) = low + (high - low) * e

    Returns a dict mapping extension -> level price.
    """
    low, high = _validate_low_high(low, high)
    move = high - low

    out: dict[float, float] = {}
    for e in extensions:
        if e < 0:
            raise ValueError("extensions must be >= 0")
        out[float(e)] = low + move * float(e)
    return out
