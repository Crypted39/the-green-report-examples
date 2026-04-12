#!/usr/bin/env node
/**
 * MCP Server: CI/CD Test Failure Triage
 * Exposes tools for an AI agent to analyze test failures,
 * correlate logs, detect flaky tests, and suggest root causes.
 *
 * Compatible with: Claude Desktop, any MCP-capable AI agent
 * Simulates: GitHub Actions CI data (swap fetch calls for your real CI API)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "test-triage-mcp",
  version: "1.0.0",
});

// ─── Simulated CI/CD Data Store ───────────────────────────────────────────────
// In production, replace these with real API calls to GitHub Actions, Jenkins,
// CircleCI, etc. The MCP tool structure stays identical.

const TEST_RUNS = [
  {
    id: "run-001",
    branch: "main",
    commit: "a1b2c3d",
    triggeredBy: "push",
    startedAt: "2025-04-10T08:00:00Z",
    duration: 312,
    status: "failed",
    failedTests: [
      "checkout.spec.ts::completeOrder",
      "auth.spec.ts::loginWithOAuth",
    ],
    passedTests: 47,
    totalTests: 49,
  },
  {
    id: "run-002",
    branch: "feature/payment-v2",
    commit: "e4f5g6h",
    triggeredBy: "pull_request",
    startedAt: "2025-04-10T09:15:00Z",
    duration: 289,
    status: "failed",
    failedTests: [
      "checkout.spec.ts::completeOrder",
      "payment.spec.ts::stripeWebhook",
    ],
    passedTests: 46,
    totalTests: 48,
  },
  {
    id: "run-003",
    branch: "main",
    commit: "i7j8k9l",
    triggeredBy: "schedule",
    startedAt: "2025-04-09T23:00:00Z",
    duration: 305,
    status: "passed",
    failedTests: [],
    passedTests: 49,
    totalTests: 49,
  },
  {
    id: "run-004",
    branch: "main",
    commit: "m1n2o3p",
    triggeredBy: "push",
    startedAt: "2025-04-09T14:00:00Z",
    duration: 298,
    status: "failed",
    failedTests: ["checkout.spec.ts::completeOrder"],
    passedTests: 48,
    totalTests: 49,
  },
  {
    id: "run-005",
    branch: "hotfix/auth",
    commit: "q4r5s6t",
    triggeredBy: "push",
    startedAt: "2025-04-09T10:00:00Z",
    duration: 310,
    status: "failed",
    failedTests: ["auth.spec.ts::loginWithOAuth", "auth.spec.ts::refreshToken"],
    passedTests: 47,
    totalTests: 49,
  },
];

const TEST_LOGS = {
  "run-001::checkout.spec.ts::completeOrder": {
    error:
      "TimeoutError: Waiting for selector '.order-confirmation' exceeded 30000ms",
    stack: `
  at Page.waitForSelector (playwright/lib/page.js:812)
  at Context.<anonymous> (tests/checkout.spec.ts:88)
  at callFn (mocha/lib/runnable.js:366)
    `.trim(),
    screenshotPath: "artifacts/run-001/checkout-failure.png",
    networkRequests: [
      { url: "/api/orders", method: "POST", status: 200, duration: 1240 },
      {
        url: "/api/payment/confirm",
        method: "POST",
        status: 504,
        duration: 30002,
      },
    ],
    consoleErrors: [
      "[ERROR] Payment gateway timeout after 30s",
      "[WARN] Retry attempt 3/3 failed",
    ],
  },
  "run-001::auth.spec.ts::loginWithOAuth": {
    error:
      "AssertionError: Expected redirect to '/dashboard' but got '/error?code=oauth_state_mismatch'",
    stack: `
  at expect (tests/auth.spec.ts:54)
  at Context.<anonymous> (tests/auth.spec.ts:53)
    `.trim(),
    screenshotPath: "artifacts/run-001/auth-failure.png",
    networkRequests: [
      { url: "/auth/oauth/callback", method: "GET", status: 302, duration: 88 },
      { url: "/dashboard", method: "GET", status: 400, duration: 12 },
    ],
    consoleErrors: ["[ERROR] OAuth state parameter mismatch"],
  },
  "run-002::checkout.spec.ts::completeOrder": {
    error:
      "TimeoutError: Waiting for selector '.order-confirmation' exceeded 30000ms",
    stack: `
  at Page.waitForSelector (playwright/lib/page.js:812)
  at Context.<anonymous> (tests/checkout.spec.ts:88)
    `.trim(),
    screenshotPath: "artifacts/run-002/checkout-failure.png",
    networkRequests: [
      { url: "/api/orders", method: "POST", status: 200, duration: 980 },
      {
        url: "/api/payment/confirm",
        method: "POST",
        status: 504,
        duration: 30001,
      },
    ],
    consoleErrors: ["[ERROR] Payment gateway timeout after 30s"],
  },
  "run-002::payment.spec.ts::stripeWebhook": {
    error: "Error: Webhook signature verification failed",
    stack: `
  at verifyWebhook (tests/payment.spec.ts:112)
  at Context.<anonymous> (tests/payment.spec.ts:111)
    `.trim(),
    networkRequests: [
      { url: "/webhooks/stripe", method: "POST", status: 400, duration: 5 },
    ],
    consoleErrors: ["[ERROR] Invalid Stripe-Signature header"],
  },
  "run-004::checkout.spec.ts::completeOrder": {
    error:
      "TimeoutError: Waiting for selector '.order-confirmation' exceeded 30000ms",
    stack: `
  at Page.waitForSelector (playwright/lib/page.js:812)
  at Context.<anonymous> (tests/checkout.spec.ts:88)
    `.trim(),
    networkRequests: [
      { url: "/api/orders", method: "POST", status: 200, duration: 1100 },
      {
        url: "/api/payment/confirm",
        method: "POST",
        status: 504,
        duration: 30003,
      },
    ],
    consoleErrors: ["[ERROR] Payment gateway timeout after 30s"],
  },
  "run-005::auth.spec.ts::loginWithOAuth": {
    error:
      "AssertionError: Expected redirect to '/dashboard' but got '/error?code=oauth_state_mismatch'",
    stack: `
  at expect (tests/auth.spec.ts:54)
  at Context.<anonymous> (tests/auth.spec.ts:53)
    `.trim(),
    networkRequests: [
      { url: "/auth/oauth/callback", method: "GET", status: 302, duration: 91 },
    ],
    consoleErrors: ["[ERROR] OAuth state parameter mismatch"],
  },
  "run-005::auth.spec.ts::refreshToken": {
    error: "Error: Token refresh returned 401 Unauthorized",
    stack: `
  at Context.<anonymous> (tests/auth.spec.ts:78)
    `.trim(),
    networkRequests: [
      { url: "/auth/refresh", method: "POST", status: 401, duration: 22 },
    ],
    consoleErrors: ["[ERROR] Refresh token expired or revoked"],
  },
};

// ─── Tool 1: list_recent_runs ─────────────────────────────────────────────────
server.registerTool(
  "list_recent_runs",
  {
    description:
      "List recent CI/CD test runs with their status, branch, and failure summary. Use this as the starting point for any triage session.",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("How many recent runs to return"),
      status: z
        .enum(["all", "failed", "passed"])
        .default("all")
        .describe("Filter by run status"),
      branch: z
        .string()
        .optional()
        .describe("Filter by branch name (partial match)"),
    },
  },
  async ({ limit, status, branch }) => {
    let runs = [...TEST_RUNS];

    if (status !== "all") runs = runs.filter((r) => r.status === status);
    if (branch) runs = runs.filter((r) => r.branch.includes(branch));

    runs = runs.slice(0, limit);

    const summary = runs.map((r) => ({
      id: r.id,
      branch: r.branch,
      commit: r.commit.slice(0, 7),
      triggeredBy: r.triggeredBy,
      startedAt: r.startedAt,
      durationSeconds: r.duration,
      status: r.status,
      failedTests: r.failedTests,
      passedCount: r.passedTests,
      totalCount: r.totalTests,
      failureRate:
        r.totalTests > 0
          ? `${(((r.totalTests - r.passedTests) / r.totalTests) * 100).toFixed(1)}%`
          : "0%",
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { runs: summary, returnedCount: runs.length },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ─── Tool 2: get_test_logs ────────────────────────────────────────────────────
server.registerTool(
  "get_test_logs",
  {
    description:
      "Fetch the detailed failure log for a specific test in a specific run. Returns error message, stack trace, network requests, and console errors.",
    inputSchema: {
      runId: z.string().describe("The CI run ID (e.g. 'run-001')"),
      testName: z
        .string()
        .describe(
          "Full test name including file (e.g. 'checkout.spec.ts::completeOrder')",
        ),
    },
  },
  async ({ runId, testName }) => {
    const key = `${runId}::${testName}`;
    const log = TEST_LOGS[key];

    if (!log) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `No log found for run '${runId}' test '${testName}'. Available keys: ${Object.keys(TEST_LOGS).join(", ")}`,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ runId, testName, log }, null, 2),
        },
      ],
    };
  },
);

// ─── Tool 3: get_test_history ─────────────────────────────────────────────────
server.registerTool(
  "get_test_history",
  {
    description:
      "Get the pass/fail history of a specific test across all recent runs. Essential for detecting flaky tests vs. genuine regressions.",
    inputSchema: {
      testName: z
        .string()
        .describe(
          "Full test name including file (e.g. 'checkout.spec.ts::completeOrder')",
        ),
    },
  },
  async ({ testName }) => {
    const history = TEST_RUNS.map((run) => {
      const failed = run.failedTests.includes(testName);
      const logKey = `${run.id}::${testName}`;
      const log = TEST_LOGS[logKey];

      return {
        runId: run.id,
        branch: run.branch,
        commit: run.commit.slice(0, 7),
        startedAt: run.startedAt,
        result: failed
          ? "FAIL"
          : run.failedTests.length === 0 || !failed
            ? "PASS"
            : "SKIP",
        errorSummary: failed && log ? log.error.slice(0, 120) : null,
      };
    });

    const failCount = history.filter((h) => h.result === "FAIL").length;
    const passCount = history.filter((h) => h.result === "PASS").length;
    const failRate = ((failCount / history.length) * 100).toFixed(0);

    const isFlaky = failCount > 0 && passCount > 0;
    const isRegression =
      failCount > 0 &&
      history[0].result === "FAIL" &&
      history[2]?.result === "PASS";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              testName,
              history,
              analysis: {
                totalRuns: history.length,
                failCount,
                passCount,
                failRate: `${failRate}%`,
                classification: isFlaky
                  ? "FLAKY"
                  : isRegression
                    ? "REGRESSION"
                    : failCount === 0
                      ? "STABLE"
                      : "CONSISTENTLY_FAILING",
                isFlaky,
                isRegression,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ─── Tool 4: correlate_failures ───────────────────────────────────────────────
server.registerTool(
  "correlate_failures",
  {
    description:
      "Analyze all failed runs to find patterns: which tests fail together, which branches are affected, common error types, and failure clustering.",
    inputSchema: {
      lookbackRuns: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe(
          "How many recent runs to include in the correlation analysis",
        ),
    },
  },
  async ({ lookbackRuns }) => {
    const runs = TEST_RUNS.slice(0, lookbackRuns).filter(
      (r) => r.status === "failed",
    );

    // Count co-occurrences of test failures
    const coOccurrence = {};
    const testFailCounts = {};
    const errorTypes = {};

    for (const run of runs) {
      for (const test of run.failedTests) {
        testFailCounts[test] = (testFailCounts[test] || 0) + 1;

        // Collect error type
        const logKey = `${run.id}::${test}`;
        const log = TEST_LOGS[logKey];
        if (log) {
          const errorType = log.error.split(":")[0].trim();
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }

        // Co-occurrence with other tests in same run
        for (const otherTest of run.failedTests) {
          if (otherTest !== test) {
            const pairKey = [test, otherTest].sort().join(" | ");
            coOccurrence[pairKey] = (coOccurrence[pairKey] || 0) + 1;
          }
        }
      }
    }

    const hotspots = Object.entries(testFailCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([test, count]) => ({
        test,
        failCount: count,
        appearsIn: `${count}/${runs.length} failed runs`,
      }));

    const clusters = Object.entries(coOccurrence)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([pair, count]) => ({ pair, coFailCount: count }));

    const branchImpact = runs.reduce((acc, run) => {
      acc[run.branch] = (acc[run.branch] || 0) + 1;
      return acc;
    }, {});

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              analyzedRuns: runs.length,
              hotspots,
              coFailingClusters: clusters,
              errorTypeFrequency: errorTypes,
              branchImpact,
              insight: hotspots[0]
                ? `Most unstable test: '${hotspots[0].test}' (failed ${hotspots[0].failCount} times)`
                : "No failures found in this window",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ─── Tool 5: suggest_root_cause ───────────────────────────────────────────────
server.registerTool(
  "suggest_root_cause",
  {
    description:
      "Given a test name and run ID, synthesize all available signals (logs, history, network, errors) into a structured root cause hypothesis with recommended actions.",
    inputSchema: {
      runId: z.string().describe("The CI run ID to analyze"),
      testName: z.string().describe("Full test name to analyze"),
    },
  },
  async ({ runId, testName }) => {
    const logKey = `${runId}::${testName}`;
    const log = TEST_LOGS[logKey];
    const run = TEST_RUNS.find((r) => r.id === runId);

    if (!log || !run) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Run or test log not found" }),
          },
        ],
      };
    }

    // Compute history inline
    const history = TEST_RUNS.map((r) => ({
      runId: r.id,
      result: r.failedTests.includes(testName) ? "FAIL" : "PASS",
    }));
    const failCount = history.filter((h) => h.result === "FAIL").length;
    const isFlaky = failCount > 0 && failCount < history.length;

    // Detect signals
    const hasTimeout = log.error.toLowerCase().includes("timeout");
    const has5xx = log.networkRequests?.some((r) => r.status >= 500);
    const hasAuthError =
      log.error.toLowerCase().includes("auth") ||
      log.error.toLowerCase().includes("oauth") ||
      log.error.toLowerCase().includes("token");
    const hasWebhookError =
      log.error.toLowerCase().includes("signature") ||
      log.error.toLowerCase().includes("webhook");

    let hypothesis = "";
    let confidence = "";
    const recommendedActions = [];

    if (hasTimeout && has5xx) {
      hypothesis =
        "External service dependency timeout — a downstream API (payment gateway or similar) is returning 5xx/504 errors, causing the test to wait until its timeout expires.";
      confidence = "HIGH";
      recommendedActions.push(
        "Check payment gateway / third-party API status page for outages",
      );
      recommendedActions.push(
        "Add retry logic with exponential backoff in the app code",
      );
      recommendedActions.push(
        "Mock the external dependency in tests to decouple from third-party reliability",
      );
      recommendedActions.push(
        "Reduce Playwright timeout and assert on error state instead of waiting indefinitely",
      );
    } else if (hasAuthError) {
      hypothesis =
        "OAuth state mismatch or token lifecycle issue — the test environment's session/cookie state may not be properly reset between runs, or the OAuth callback URL is misconfigured in the test environment.";
      confidence = "MEDIUM-HIGH";
      recommendedActions.push(
        "Ensure test setup clears all cookies and local storage before each run",
      );
      recommendedActions.push(
        "Verify OAuth redirect URIs match the test environment exactly",
      );
      recommendedActions.push(
        "Check if a shared test OAuth app is being hit by parallel test runs (state collision)",
      );
    } else if (hasWebhookError) {
      hypothesis =
        "Webhook secret misconfiguration — the test environment's Stripe webhook signing secret does not match what the test sends, indicating an environment variable mismatch.";
      confidence = "HIGH";
      recommendedActions.push(
        "Confirm STRIPE_WEBHOOK_SECRET in CI environment variables matches your Stripe test dashboard",
      );
      recommendedActions.push(
        "Use stripe-mock or a local webhook forwarder (stripe listen) in CI instead of real webhooks",
      );
    } else {
      hypothesis =
        "Undetermined — insufficient signal to confidently classify root cause.";
      confidence = "LOW";
      recommendedActions.push(
        "Review full stack trace and browser console output",
      );
      recommendedActions.push(
        "Run the test in isolation to rule out interference",
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              runId,
              testName,
              classification: isFlaky ? "FLAKY" : "REGRESSION",
              failureRate: `${Math.round((failCount / history.length) * 100)}%`,
              rootCauseHypothesis: hypothesis,
              confidence,
              signals: { hasTimeout, has5xx, hasAuthError, hasWebhookError },
              recommendedActions,
              affectedBranch: run.branch,
              affectedCommit: run.commit.slice(0, 7),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ─── Start the server ─────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ test-triage-mcp server running on stdio");
