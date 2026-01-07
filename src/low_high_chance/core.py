from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Classification:
    label: str  # "low" | "high"
    probability: float  # normalized to 0..1
    threshold: float  # normalized to 0..1

    @property
    def percent(self) -> float:
        return self.probability * 100.0


def _normalize_probability(value: float) -> float:
    """
    Normalize probability-like values to 0..1.

    Rules:
    - If value is in [0, 1], treat as probability.
    - If value is in (1, 100], treat as percent.
    """
    if value < 0:
        raise ValueError("Probability must be >= 0.")
    if value <= 1:
        return float(value)
    if value <= 100:
        return float(value) / 100.0
    raise ValueError("Probability must be <= 1.0 or <= 100%.")


def classify_probability(value: float, *, threshold: float = 0.5) -> Classification:
    """
    Classify a probability (0..1) or percent (0..100) as "low" or "high".

    - label is "high" when probability >= threshold, else "low".
    """
    prob = _normalize_probability(value)
    thr = _normalize_probability(threshold)
    label = "high" if prob >= thr else "low"
    return Classification(label=label, probability=prob, threshold=thr)
