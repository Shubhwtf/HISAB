import random
from typing import Optional


def calculate_backoff(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    jitter: bool = True,
    seed: Optional[int] = None,
) -> float:
    if attempt <= 0:
        attempt = 1
    delay = min(max_delay, base_delay * (2.0 ** (attempt - 1)))
    if jitter:
        rng = random.Random(seed) if seed is not None else random
        delay += rng.uniform(0.0, base_delay)
    return round(min(max_delay, delay), 3)
