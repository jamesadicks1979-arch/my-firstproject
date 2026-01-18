"""Trend following utilities for moving-average signals."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Iterable, List, Optional


@dataclass(frozen=True)
class TrendSignal:
    """Represents the moving-average trend signal at a point in time."""

    index: int
    price: float
    fast_ma: Optional[float]
    slow_ma: Optional[float]
    signal: str


def simple_moving_average(values: Iterable[float], window: int) -> List[Optional[float]]:
    """Return the simple moving average for each value."""

    if window <= 0:
        raise ValueError("window must be positive")

    result: List[Optional[float]] = []
    window_values: Deque[float] = deque()
    window_sum = 0.0

    for value in values:
        window_values.append(value)
        window_sum += value

        if len(window_values) > window:
            window_sum -= window_values.popleft()

        if len(window_values) == window:
            result.append(window_sum / window)
        else:
            result.append(None)

    return result


def trend_follow(
    prices: Iterable[float],
    fast_window: int = 5,
    slow_window: int = 20,
) -> List[TrendSignal]:
    """Generate trend-following signals based on moving averages."""

    if fast_window <= 0 or slow_window <= 0:
        raise ValueError("fast_window and slow_window must be positive")
    if fast_window >= slow_window:
        raise ValueError("fast_window must be less than slow_window")

    price_list = list(prices)
    fast_ma = simple_moving_average(price_list, fast_window)
    slow_ma = simple_moving_average(price_list, slow_window)

    signals: List[TrendSignal] = []
    current_signal = "flat"

    for index, price in enumerate(price_list):
        fast_value = fast_ma[index]
        slow_value = slow_ma[index]

        if fast_value is None or slow_value is None:
            current_signal = "flat"
        elif fast_value > slow_value:
            current_signal = "long"
        elif fast_value < slow_value:
            current_signal = "short"
        else:
            current_signal = "flat"

        signals.append(
            TrendSignal(
                index=index,
                price=price,
                fast_ma=fast_value,
                slow_ma=slow_value,
                signal=current_signal,
            )
        )

    return signals


def _format_signal_row(signal: TrendSignal) -> str:
    fast = f"{signal.fast_ma:.2f}" if signal.fast_ma is not None else "n/a"
    slow = f"{signal.slow_ma:.2f}" if signal.slow_ma is not None else "n/a"
    return (
        f"{signal.index:>3} | {signal.price:>7.2f} | {fast:>7} | {slow:>7} |"
        f" {signal.signal}"
    )


def main() -> None:
    sample_prices = [
        100.0,
        101.0,
        102.0,
        103.0,
        104.0,
        105.0,
        104.0,
        103.0,
        102.0,
        101.0,
        100.0,
        99.0,
        98.0,
        97.0,
        96.0,
        97.0,
        98.0,
        99.0,
        100.0,
        101.0,
        102.0,
    ]

    signals = trend_follow(sample_prices, fast_window=3, slow_window=5)

    print("Idx |  Price |  Fast |  Slow | Signal")
    print("----+--------+-------+-------+--------")
    for signal in signals:
        print(_format_signal_row(signal))


if __name__ == "__main__":
    main()
