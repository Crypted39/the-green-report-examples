"""
Deterministic Simulation Testing: a small worked example in Python
====================================================================

Companion code for the blog post "Deterministic Simulation Testing:
A Practical Guide for QA Engineers".

Every class below replaces one source of nondeterminism (time,
randomness, I/O) with a version that is fully controlled by a seed,
so any failure can be replayed exactly.

Run directly to see a reproducible seed sweep:

    python dst_example.py
"""

import heapq
import random
import time


# ---------------------------------------------------------------------------
# Taming Time: A Virtual Clock
# ---------------------------------------------------------------------------

class VirtualClock:
    """A clock that only advances when something asks it to."""

    def __init__(self):
        self._now = 0.0
        self._events = []  # heap of (fire_time, seq, callback)
        self._seq = 0

    def now(self) -> float:
        return self._now

    def call_later(self, delay: float, callback):
        self._seq += 1
        heapq.heappush(self._events, (self._now + delay, self._seq, callback))

    def run_until_idle(self):
        """Advance time by jumping straight to the next scheduled event."""
        while self._events:
            fire_time, _, callback = heapq.heappop(self._events)
            self._now = fire_time
            callback()


# ---------------------------------------------------------------------------
# Taming Randomness: A Seeded RNG, Threaded Through Everything
# ---------------------------------------------------------------------------

class FlakyService:
    def __init__(self, rng: random.Random, failure_rate: float = 0.1):
        self.rng = rng
        self.failure_rate = failure_rate

    def handle_request(self) -> bool:
        return self.rng.random() >= self.failure_rate


# ---------------------------------------------------------------------------
# Taming I/O: A Simulated Network
# ---------------------------------------------------------------------------

class SimulatedNetwork:
    """A building block for richer simulations than the retry-client
    example below. Not wired into run_simulation(), but included here
    since it's a key piece for simulating client/server communication.
    """

    def __init__(self, clock: VirtualClock, rng: random.Random,
                 drop_rate: float = 0.0, max_latency: float = 0.5):
        self.clock = clock
        self.rng = rng
        self.drop_rate = drop_rate
        self.max_latency = max_latency

    def send(self, message, deliver_callback):
        if self.rng.random() < self.drop_rate:
            return  # message vanishes, as if lost in transit
        latency = self.rng.uniform(0, self.max_latency)
        self.clock.call_later(latency, lambda: deliver_callback(message))


# ---------------------------------------------------------------------------
# Worked Example: A Flaky Retry Client
# ---------------------------------------------------------------------------

def fetch_with_retry(service, max_attempts=5):
    """The naive version: real time, real randomness.

    Kept here only for contrast with the deterministic version below.
    Hard to test reliably, and not used by run_simulation().
    """
    for attempt in range(max_attempts):
        if service.handle_request():
            return "success"
        backoff = (2 ** attempt) + random.uniform(0, 1)
        time.sleep(backoff)  # real wall-clock sleep
    return "failed"


def fetch_with_retry_sim(clock, rng, service, max_attempts=5):
    """The deterministic version: time and randomness come from the
    injected clock and rng, so the whole run is reproducible from a seed.
    """
    result = {"status": None}

    def attempt(n):
        if n >= max_attempts:
            result["status"] = "failed"
            return
        if service.handle_request():
            result["status"] = "success"
            return
        backoff = (2 ** n) + rng.uniform(0, 1)
        clock.call_later(backoff, lambda: attempt(n + 1))

    attempt(0)
    clock.run_until_idle()
    return result["status"]


def run_simulation(seed: int, failure_rate: float = 0.6) -> str:
    """Run the retry client end-to-end from a single seed."""
    rng = random.Random(seed)
    clock = VirtualClock()
    service = FlakyService(rng, failure_rate=failure_rate)
    return fetch_with_retry_sim(clock, rng, service)


if __name__ == "__main__":
    # Sweep seeds the way you'd run this in CI
    for seed in range(20):
        outcome = run_simulation(seed)
        print(f"seed={seed:<3} -> {outcome}")
