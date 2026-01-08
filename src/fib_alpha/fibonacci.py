from __future__ import annotations


def fibonacci(n: int) -> list[int]:
    """
    Return the first n Fibonacci numbers, starting with 0, 1, ...

    Examples:
        fibonacci(1) -> [0]
        fibonacci(2) -> [0, 1]
        fibonacci(6) -> [0, 1, 1, 2, 3, 5]
    """
    if n < 0:
        raise ValueError("n must be >= 0")
    if n == 0:
        return []
    if n == 1:
        return [0]

    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq
