# Low/High Chance

A tiny CLI + library to classify a probability (or percent) as **low** or **high** chance.

## Install

```bash
python -m pip install -e ".[dev]"
```

## Usage

### CLI

```bash
low-high-chance 0.72
low-high-chance 72%
low-high-chance 0.45 --threshold 0.6
```

### Python

```python
from low_high_chance import classify_probability

result = classify_probability(0.72, threshold=0.6)
print(result.label)  # "high"
```

## Development

```bash
pytest
```