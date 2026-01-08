# fib alpha

Minimal, typed utilities for:

- Fibonacci sequence helpers
- Fibonacci retracement/extension levels
- Simple portfolio “alpha” (excess return vs benchmark)

## Install (editable)

```bash
python -m pip install -e ".[dev]"
```

## CLI

```bash
fib-alpha fib --n 10
fib-alpha levels --low 100 --high 150
fib-alpha alpha --returns 0.01 0.02 -0.01 --benchmark 0.00 0.01 -0.02
```

## Library usage

```python
from fib_alpha.fibonacci import fibonacci
from fib_alpha.levels import fib_retracement_levels
from fib_alpha.finance import alpha_mean_excess

print(fibonacci(10))
print(fib_retracement_levels(low=100, high=150))
print(alpha_mean_excess([0.01, 0.02], [0.0, 0.01]))
```