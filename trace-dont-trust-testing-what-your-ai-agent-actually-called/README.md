# Detecting Redundant Tool Calls in an AI Agent Harness

Zero dependencies; requires Node 18.14+.

```bash
npm test                    # run the redundancy tests (node:test)
node run.js sloppy          # print the trace and report for a fixture
node run.js well-behaved
node run.js transient-retry
```

## What is being tested

The *harness*, not the model. A scripted stand-in for the LLM replays a fixed
list of tool calls from a fixture, so runs are deterministic and need no API key.
A `ToolTracer` wraps the tool registry and records every call. The detectors in
`src/redundancy.js` then assert on that trace.

| Detector | Definition | Sloppy fixture example |
|---|---|---|
| Exact duplicate | same tool, identical args, same turn | `search("config")` twice in turn 1 |
| Semantic duplicate | same tool, args equal after normalization, same turn | `get_user(5)` then `get_user("5")` |
| Stale re-fetch | read of a resource in a later turn with no mutation in between | `read_file(config.json)` in turns 2 and 3 |
| Call budget | total model-initiated calls exceeds a ceiling | 9 calls for a 4-call task |

Things that are deliberately **not** flagged:

- Re-reading a file after writing it (verify-after-write). Tools declare `mutates`
  and a `resource` key so the stale-refetch detector can see the write in between.
- Harness retries after a transient error. The retry is tagged `origin: 'harness-retry'`
  and excluded, so infrastructure flakiness is not blamed on the model.

## Layout

```
src/tools.js        fake tools over an in-memory world (files, users)
src/tracer.js       ToolTracer + argument normalization
src/agent.js        minimal agent loop, retry-once, scripted model
src/redundancy.js   the detectors
src/run-fixture.js  glue: fixture -> agent -> trace
fixtures/*.json     scripted tool-call sequences
test/               node:test assertions
run.js              prints a trace and report
```
