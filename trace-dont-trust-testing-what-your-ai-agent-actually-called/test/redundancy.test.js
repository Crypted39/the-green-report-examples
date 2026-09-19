import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runFixture } from '../src/run-fixture.js';
import {
  findExactDuplicates,
  findSemanticDuplicates,
  findStaleRefetches,
  callCounts,
} from '../src/redundancy.js';

const CALL_BUDGET = 5;

test('well-behaved agent makes no redundant tool calls', () => {
  const { trace } = runFixture('well-behaved');

  assert.equal(findExactDuplicates(trace).length, 0);
  assert.equal(findSemanticDuplicates(trace).length, 0);
  assert.equal(findStaleRefetches(trace).length, 0);
  assert.ok(callCounts(trace).total <= CALL_BUDGET);
});

test('re-reading a file after writing it is not flagged', () => {
  const { trace } = runFixture('well-behaved');
  const reads = trace.filter((c) => c.name === 'read_file');

  assert.equal(reads.length, 2, 'fixture reads config.json twice');
  assert.equal(findStaleRefetches(trace).length, 0);
});

test('sloppy agent: exact duplicate in the same turn', () => {
  const { trace } = runFixture('sloppy');
  const findings = findExactDuplicates(trace);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].repeat.rawKey, 'search({"query":"config"})');
  assert.equal(findings[0].repeat.turn, findings[0].first.turn);
});

test('sloppy agent: semantically identical args are caught', () => {
  const { trace } = runFixture('sloppy');
  const findings = findSemanticDuplicates(trace);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].first.rawKey, 'get_user({"id":5})');
  assert.equal(findings[0].repeat.rawKey, 'get_user({"id":"5"})');
});

test('sloppy agent: re-read with no intervening write is a stale re-fetch', () => {
  const { trace } = runFixture('sloppy');
  const findings = findStaleRefetches(trace);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].repeat.resource, 'file:config.json');
  assert.equal(findings[0].first.turn, 2);
  assert.equal(findings[0].repeat.turn, 3);
});

test('sloppy agent blows the call budget', () => {
  const { trace } = runFixture('sloppy');
  const counts = callCounts(trace);

  assert.ok(counts.total > CALL_BUDGET, `expected more than ${CALL_BUDGET} calls, got ${counts.total}`);
  assert.equal(counts.read_file, 4);
});

test('harness retries after a transient error are not counted as duplicates', () => {
  const { trace } = runFixture('transient-retry');

  assert.equal(trace.length, 2, 'one failed attempt plus one retry');
  assert.equal(trace[0].ok, false);
  assert.equal(trace[1].origin, 'harness-retry');
  assert.equal(findExactDuplicates(trace).length, 0);
  assert.equal(callCounts(trace).total, 1);
});
