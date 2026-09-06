import { spawnSync } from 'node:child_process';

const modes = [
  {
    label: 'naive        (fullyParallel, no locks)',
    args: ['--project=naive'],
    expect: 'races',
  },
  {
    label: 'workers=1    (the sledgehammer)',
    args: ['--project=naive', '--workers=1'],
    expect: 'green',
  },
  {
    label: 'locks        (fullyParallel + lock)',
    args: ['--project=locked'],
    expect: 'green',
  },
];

const results = [];

for (const mode of modes) {
  console.log(`\n${'='.repeat(70)}\n  ${mode.label}\n${'='.repeat(70)}\n`);
  const started = Date.now();
  const run = spawnSync(
    `npx playwright test ${mode.args.join(' ')} --reporter=line --add-reporter=./reporters/timeline.ts`,
    { stdio: 'inherit', shell: true },
  );
  results.push({
    label: mode.label,
    seconds: ((Date.now() - started) / 1000).toFixed(1),
    passed: run.status === 0,
    expect: mode.expect,
  });
}

console.log(`\n${'='.repeat(70)}\n  SUMMARY\n${'='.repeat(70)}`);
for (const r of results) {
  const outcome = r.passed ? 'all green' : 'FAILURES';
  console.log(`  ${r.label}  ${String(r.seconds).padStart(6)}s   ${outcome}`);
}
console.log();
