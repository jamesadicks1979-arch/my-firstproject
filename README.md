# my-firstproject

Trend follow is a small Python module that generates moving-average
trend-following signals.

## Usage

Run the sample output:

```
python trend_follow.py
```

Use it in code:

```
from trend_follow import trend_follow

prices = [100.0, 101.0, 102.0, 101.0, 100.0]
signals = trend_follow(prices, fast_window=2, slow_window=3)

for signal in signals:
    print(signal.index, signal.signal)
```

## Tests

```
python -m unittest
```