import json

import pytest

from fib_alpha.cli import main
from fib_alpha.finance import alpha_mean_excess
from fib_alpha.fibonacci import fibonacci
from fib_alpha.levels import fib_extension_levels, fib_retracement_levels


def test_fibonacci_basic() -> None:
    assert fibonacci(0) == []
    assert fibonacci(1) == [0]
    assert fibonacci(2) == [0, 1]
    assert fibonacci(6) == [0, 1, 1, 2, 3, 5]


def test_fibonacci_negative() -> None:
    with pytest.raises(ValueError):
        fibonacci(-1)


def test_retracement_levels() -> None:
    lvls = fib_retracement_levels(low=100, high=150, ratios=[0.5])
    assert lvls[0.5] == 125.0


def test_extension_levels() -> None:
    lvls = fib_extension_levels(low=100, high=150, extensions=[1.618])
    assert lvls[1.618] == pytest.approx(100 + 50 * 1.618)


def test_alpha_mean_excess() -> None:
    assert alpha_mean_excess([0.01, 0.02], [0.0, 0.01]) == pytest.approx(0.01)


def test_cli_fib_prints_json(capsys: pytest.CaptureFixture[str]) -> None:
    rc = main(["fib", "--n", "6"])
    assert rc == 0
    out = capsys.readouterr().out
    assert json.loads(out) == [0, 1, 1, 2, 3, 5]


def test_cli_alpha_prints_number(capsys: pytest.CaptureFixture[str]) -> None:
    rc = main(["alpha", "--returns", "0.01", "0.02", "--benchmark", "0.0", "0.01"])
    assert rc == 0
    out = capsys.readouterr().out.strip()
    assert float(out) == pytest.approx(0.01)
