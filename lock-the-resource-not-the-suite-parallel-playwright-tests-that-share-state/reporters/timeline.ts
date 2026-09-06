import type {
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type Row = { name: string; start: number; end: number; ok: boolean };

/**
 * Prints an ASCII gantt of when each test actually ran.
 *
 * This is the only way to *see* what a lock does: locked tests line up
 * end to end, everything else stays stacked in parallel.
 *
 * Attached with 1.63's `--add-reporter`, which appends to the configured
 * reporters instead of replacing them.
 */
export default class TimelineReporter implements Reporter {
  private rows: Row[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (!result.startTime) return;
    const start = result.startTime.getTime();
    this.rows.push({
      name: test.title,
      start,
      end: start + result.duration,
      ok: result.status === 'passed',
    });
  }

  onEnd() {
    if (this.rows.length === 0) return;

    const origin = Math.min(...this.rows.map((r) => r.start));
    const finish = Math.max(...this.rows.map((r) => r.end));
    const span = Math.max(1, finish - origin);
    const width = Number(process.env.TIMELINE_WIDTH || 56);
    const labelWidth = Math.min(38, Math.max(...this.rows.map((r) => r.name.length)));

    console.log(`\n  Timeline  (${(span / 1000).toFixed(1)}s total, one cell ~${Math.round(span / width)}ms)`);
    console.log(`  ${'-'.repeat(labelWidth + width + 3)}`);

    for (const row of [...this.rows].sort((a, b) => a.start - b.start)) {
      const offset = Math.floor(((row.start - origin) / span) * width);
      const length = Math.max(1, Math.round(((row.end - row.start) / span) * width));
      const bar = ' '.repeat(offset) + (row.ok ? '#' : 'x').repeat(length);
      const name = row.name.length > labelWidth
        ? row.name.slice(0, labelWidth - 1) + '~'
        : row.name.padEnd(labelWidth);
      console.log(`  ${name} | ${bar}`);
    }

    console.log(`\n  # passed   x failed\n`);
  }
}
