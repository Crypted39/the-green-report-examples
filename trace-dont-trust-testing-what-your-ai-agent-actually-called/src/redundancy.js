// Redundancy detectors. Each takes a tracer's call list and returns findings.
// Harness retries are never counted: the model asked once, the harness repeated.

const modelCalls = (trace) => trace.filter((c) => c.origin === 'model');
const successfulModelCalls = (trace) => modelCalls(trace).filter((c) => c.ok);

// Same tool, byte-identical args, within one turn.
export function findExactDuplicates(trace) {
  return findDuplicatesWithinTurn(trace, (c) => c.rawKey);
}

// Same tool, equivalent args after normalization, within one turn.
// Excludes anything already reported as an exact duplicate.
export function findSemanticDuplicates(trace) {
  return findDuplicatesWithinTurn(trace, (c) => c.normalizedKey).filter(
    (f) => f.first.rawKey !== f.repeat.rawKey,
  );
}

function findDuplicatesWithinTurn(trace, keyOf) {
  const seen = new Map(); // `${turn}|${key}` -> first call
  const findings = [];
  for (const call of successfulModelCalls(trace)) {
    const key = `${call.turn}|${keyOf(call)}`;
    if (seen.has(key)) findings.push({ first: seen.get(key), repeat: call });
    else seen.set(key, call);
  }
  return findings;
}

// A read of a resource in a later turn when nothing has mutated that
// resource since it was last read. Reading after a write is fine.
export function findStaleRefetches(trace) {
  const lastEvent = new Map(); // resource -> last call touching it
  const findings = [];
  for (const call of successfulModelCalls(trace)) {
    const prev = lastEvent.get(call.resource);
    if (prev && !call.mutates && !prev.mutates && prev.turn !== call.turn) {
      findings.push({ first: prev, repeat: call });
    }
    lastEvent.set(call.resource, call);
  }
  return findings;
}

// Per-tool and total call counts, for budget assertions.
// Failed attempts count: the model still spent a request on them.
export function callCounts(trace) {
  const counts = { total: 0 };
  for (const call of modelCalls(trace)) {
    counts[call.name] = (counts[call.name] ?? 0) + 1;
    counts.total++;
  }
  return counts;
}

export function redundancyReport(trace) {
  return {
    exactDuplicates: findExactDuplicates(trace),
    semanticDuplicates: findSemanticDuplicates(trace),
    staleRefetches: findStaleRefetches(trace),
    counts: callCounts(trace),
  };
}
