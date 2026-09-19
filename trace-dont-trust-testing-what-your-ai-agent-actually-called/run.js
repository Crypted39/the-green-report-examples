// Usage: node run.js <fixture-name>
// Prints the tool-call trace and the redundancy report for a fixture.
import { runFixture } from './src/run-fixture.js';
import { redundancyReport } from './src/redundancy.js';

const name = process.argv[2] ?? 'sloppy';
const { fixture, trace } = runFixture(name);

console.log(`Fixture: ${fixture.name} - "${fixture.task}"\n`);
console.log('Trace:');
for (const c of trace) {
  const status = c.ok ? '' : `  [FAILED: ${c.error}]`;
  const origin = c.origin === 'model' ? '' : `  (${c.origin})`;
  console.log(`  turn ${c.turn}  ${c.rawKey}${origin}${status}`);
}

const report = redundancyReport(trace);
const describe = (label, findings) => {
  console.log(`\n${label}: ${findings.length}`);
  for (const f of findings) {
    console.log(`  ${f.repeat.rawKey} (turn ${f.repeat.turn}) repeats ${f.first.rawKey} (turn ${f.first.turn})`);
  }
};
describe('Exact duplicates', report.exactDuplicates);
describe('Semantic duplicates', report.semanticDuplicates);
describe('Stale re-fetches', report.staleRefetches);
console.log('\nCall counts:', report.counts);
