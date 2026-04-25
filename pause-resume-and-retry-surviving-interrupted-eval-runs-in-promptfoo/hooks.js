let testStartTimes = {};
let errorCount = 0;
let passCount = 0;

export async function extensionHook(hookName, context) {
  // ── beforeAll ──────────────────────────────────────────────────
  if (hookName === "beforeAll") {
    const totalTests = context.suite.tests?.length ?? 0;
    console.log(`\n[hooks] Suite starting — ${totalTests} tests loaded`);

    // Inject one extra test at runtime (simulates loading from a DB)
    context.suite.tests.push({
      description: "[Dynamic] Rude customer edge case",
      vars: { message: "This is absolutely ridiculous, nothing works!!!" },
      assert: [
        {
          type: "llm-rubric",
          value: "Response stays calm and professional despite rude input",
        },
      ],
    });

    console.log("[hooks] Injected 1 dynamic test case");
    return context;
  }

  // ── beforeEach ─────────────────────────────────────────────────
  if (hookName === "beforeEach") {
    const desc = context.test.description ?? "unnamed";
    testStartTimes[desc] = Date.now();

    // Stamp each test with a run ID for traceability
    context.test.vars.run_id = `run_${Date.now()}`;
    return context;
  }

  // ── afterEach ──────────────────────────────────────────────────
  if (hookName === "afterEach") {
    const desc = context.test.description ?? "unnamed";
    const elapsed = Date.now() - (testStartTimes[desc] ?? Date.now());
    const status = context.result.success ? "✓ PASS" : "✗ FAIL";

    console.log(`[hooks] ${status} | ${desc} | ${elapsed}ms`);

    if (context.result.success) {
      passCount++;
    } else {
      errorCount++;
    }
  }

  // ── afterAll ───────────────────────────────────────────────────
  if (hookName === "afterAll") {
    const total = passCount + errorCount;
    const rate = total > 0 ? ((passCount / total) * 100).toFixed(1) : "0.0";

    console.log("\n── Suite Summary ─────────────────────────");
    console.log(`  Passed : ${passCount}`);
    console.log(`  Failed : ${errorCount}`);
    console.log(`  Rate   : ${rate}%`);
    console.log("──────────────────────────────────────────\n");

    // Quality gate — mirrors what a CI pipeline would enforce
    if (parseFloat(rate) < 80) {
      console.error("[hooks] Quality gate FAILED — pass rate below 80%");
      process.exitCode = 1;
    }
  }
}
