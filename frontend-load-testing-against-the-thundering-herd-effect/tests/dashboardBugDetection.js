import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const organizationsApiCalls = new Counter("organizations_api_calls_total");
const excessiveCallsRate = new Rate("users_with_excessive_calls");
const apiCallsPerUser = new Trend("api_calls_per_user");

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Ramp up
    { duration: "1m", target: 20 }, // Steady load
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    organizations_api_calls_total: ["count<1500"], // Allow ~1-2 per user for ~800 users
    users_with_excessive_calls: ["rate<0.1"], // <10% of users affected
    api_calls_per_user: ["avg<5"], // Average calls per user
    http_req_duration: ["p(95)<2000"], // Latency safeguard
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || "";

  // Get bug status from environment variable (default: enabled)
  const bugEnabled = __ENV.BUG_ENABLED !== "false";

  let userApiCalls = { organizations: 0, total: 0 };

  console.log(
    `[VU ${__VU}] Bug status: ${bugEnabled ? "ENABLED" : "DISABLED"}`
  );

  // Simulate dashboard loading
  const dashboardResponse = http.get(`${baseUrl}/`, {
    tags: { name: "dashboard_load" },
  });

  check(dashboardResponse, {
    "dashboard loads successfully": (r) => r.status === 200 || r.status === 404, // Accept 404 for mock
  });

  // Simulate the useEffect bug behavior
  if (bugEnabled) {
    // BUG SIMULATION: Multiple organizations calls due to useEffect dependency issue
    const buggyCallCount = Math.floor(Math.random() * 10) + 10; // 10-19 calls

    console.log(
      `[VU ${__VU}] Simulating bug: ${buggyCallCount} organizations calls`
    );

    for (let i = 0; i < buggyCallCount; i++) {
      const orgResponse = http.get(`${baseUrl}/api/organizations`, {
        tags: { name: "organizations_api_buggy" },
      });

      check(orgResponse, {
        "organizations API responds": (r) =>
          r.status === 200 || r.status === 404,
      });

      // INCREMENT THE COUNTERS PROPERLY
      organizationsApiCalls.add(1);
      userApiCalls.organizations++;
      userApiCalls.total++;

      // Small delay between calls as they happen in rapid succession
      sleep(0.05);
    }
  } else {
    // NORMAL BEHAVIOR: Single organizations call
    console.log(`[VU ${__VU}] Normal behavior: 1 organizations call`);

    const orgResponse = http.get(`${baseUrl}/api/organizations`, {
      tags: { name: "organizations_api_normal" },
    });

    check(orgResponse, {
      "organizations API responds": (r) => r.status === 200 || r.status === 404,
    });

    // INCREMENT THE COUNTERS PROPERLY
    organizationsApiCalls.add(1);
    userApiCalls.organizations = 1;
    userApiCalls.total++;
  }

  // Simulate other normal API calls that would happen during dashboard load
  const normalCalls = [
    { endpoint: "/api/user", name: "user_api" },
    { endpoint: "/api/stats", name: "stats_api" },
  ];

  for (const call of normalCalls) {
    const response = http.get(`${baseUrl}${call.endpoint}`, {
      tags: { name: call.name },
    });

    check(response, {
      [`${call.name} responds`]: (r) => r.status === 200 || r.status === 404,
    });

    userApiCalls.total++;
    sleep(0.2);
  }

  // Record metrics at the end of each iteration
  apiCallsPerUser.add(userApiCalls.total);

  // A user has excessive calls if they made more than 3 organizations calls
  const hasExcessiveCalls = userApiCalls.organizations > 3;
  excessiveCallsRate.add(hasExcessiveCalls);

  console.log(
    `[VU ${__VU}] Completed: ${userApiCalls.organizations} org calls, ${userApiCalls.total} total calls, excessive: ${hasExcessiveCalls}`
  );

  sleep(1);
}

export function handleSummary(data) {
  console.log("\n=== DEBUG: Raw Metrics ===");
  console.log(
    "organizations_api_calls_total:",
    data.metrics.organizations_api_calls_total
  );
  console.log("api_calls_per_user:", data.metrics.api_calls_per_user);
  console.log(
    "users_with_excessive_calls:",
    data.metrics.users_with_excessive_calls
  );
  console.log("========================\n");

  // Correctly access metrics from the values object
  const orgCalls =
    data.metrics.organizations_api_calls_total?.values?.count || 0;
  const avgCalls = data.metrics.api_calls_per_user?.values?.avg || 0;
  const excessiveRate =
    data.metrics.users_with_excessive_calls?.values?.rate || 0;

  const avgCallsStr = avgCalls.toFixed(1);
  const excessiveRateStr = (excessiveRate * 100).toFixed(1);

  console.log("=== Load Test Summary ===");
  console.log(`Total Organizations API Calls: ${orgCalls}`);
  console.log(`Average Calls per User: ${avgCallsStr}`);
  console.log(`Users with Excessive Calls: ${excessiveRateStr}%`);

  // Determine if thresholds were exceeded
  const thresholdsExceeded = [];
  if (orgCalls >= 1500)
    thresholdsExceeded.push("organizations_api_calls_total");
  if (excessiveRate >= 0.1)
    thresholdsExceeded.push("users_with_excessive_calls");
  if (avgCalls >= 5) thresholdsExceeded.push("api_calls_per_user");

  // The key indicator is excessive users rate - this is the most reliable bug detector
  const bugDetected = excessiveRate > 0.05; // >5% of users having excessive calls indicates bug

  if (bugDetected) {
    console.log(
      `❌ BUG DETECTED: ${excessiveRateStr}% of users made excessive API calls!`
    );
    console.log(
      "This indicates the useEffect bug is active and causing excessive API calls!"
    );
  } else {
    console.log("✅ No bug detected - API call pattern looks normal");
  }

  if (thresholdsExceeded.length > 0) {
    console.log(
      `⚠️  Additional thresholds exceeded: ${thresholdsExceeded.join(", ")}`
    );
  }

  return {
    "summary.json": JSON.stringify(
      {
        organizationsCalls: orgCalls,
        avgCallsPerUser: avgCallsStr,
        excessiveUsersRate: excessiveRateStr,
        bugDetected: thresholdsExceeded.length > 0,
        thresholdsExceeded: thresholdsExceeded,
      },
      null,
      2
    ),
  };
}
