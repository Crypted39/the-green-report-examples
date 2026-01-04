const fs = require('fs');
const path = require('path');

// In-memory storage for tracking test execution (simulates external systems)
const testMetrics = {
  startTime: null,
  endTime: null,
  testResults: [],
  passCount: 0,
  failCount: 0,
  totalLatency: 0,
};

function loadDynamicTestCases() {
  console.log('📦 [beforeAll] Loading dynamic test cases from external source...');
  
  return [
    {
      description: '[Dynamic] Edge case: Empty message',
      vars: {
        customer_name: 'EdgeUser1',
        inquiry_type: 'unknown',
        message: '',
      },
      assert: [
        {
          type: 'llm-rubric',
          value: 'Response gracefully handles empty input and asks for clarification',
        },
      ],
    },
    {
      description: '[Dynamic] Edge case: Very long message',
      vars: {
        customer_name: 'EdgeUser2',
        inquiry_type: 'complaint',
        message: 'I am extremely frustrated with your service. '.repeat(20) + 
                 'Please help me resolve this issue immediately.',
      },
      assert: [
        {
          type: 'llm-rubric',
          value: 'Response remains professional despite emotional customer message',
        },
      ],
    },
    {
      description: '[Dynamic] Multilingual: Spanish inquiry',
      vars: {
        customer_name: 'Maria',
        inquiry_type: 'general',
        message: 'Hola, necesito ayuda con mi pedido',
        language: 'Spanish',
      },
      assert: [
        {
          type: 'llm-rubric',
          value: 'Response acknowledges the Spanish language or responds appropriately',
        },
      ],
    },
  ];
}

/**
 * Simulates loading customer context from a CRM or database.
 * This enriches test cases with realistic customer data.
 */
function getCustomerContext(customerName) {
  const customerDatabase = {
    Alice: { tier: 'Premium', accountAge: '2 years', previousTickets: 3 },
    Bob: { tier: 'Standard', accountAge: '6 months', previousTickets: 1 },
    Charlie: { tier: 'Enterprise', accountAge: '5 years', previousTickets: 15 },
    EdgeUser1: { tier: 'Free', accountAge: '1 week', previousTickets: 0 },
    EdgeUser2: { tier: 'Standard', accountAge: '1 year', previousTickets: 8 },
    Maria: { tier: 'Premium', accountAge: '3 years', previousTickets: 5 },
  };
  
  return customerDatabase[customerName] || { 
    tier: 'Unknown', 
    accountAge: 'Unknown', 
    previousTickets: 0 
  };
}

/**
 * The main hook function that Promptfoo calls at each lifecycle stage.
 * 
 * @param {string} hookName - One of: 'beforeAll', 'beforeEach', 'afterEach', 'afterAll'
 * @param {object} context - Context object containing relevant data for each hook
 * @returns {object|undefined} - Return modified context to persist changes (beforeAll, beforeEach)
 */
async function extensionHook(hookName, context) {
  
  // ===========================================================================
  // HOOK: beforeAll
  // ===========================================================================
  // Runs ONCE before the entire test suite begins.
  // Use cases:
  // - Load additional test cases from external sources
  // - Set up global test fixtures
  // - Initialize connections to external services
  // - Add default assertions to all tests
  // ===========================================================================
  if (hookName === 'beforeAll') {
    console.log('\n' + '='.repeat(70));
    console.log('[beforeAll] Initializing test suite...');
    console.log('='.repeat(70));
    
    testMetrics.startTime = new Date();
    
    // Log suite information
    const suiteDescription = context.suite.description || 'Unnamed Suite';
    const originalTestCount = context.suite.tests?.length || 0;
    console.log(`Suite: ${suiteDescription}`);
    console.log(`Original test count: ${originalTestCount}`);
    
    // Load and inject additional test cases from external sources
    const dynamicTests = loadDynamicTestCases();
    
    if (context.suite.tests) {
      context.suite.tests.push(...dynamicTests);
      console.log(`Injected ${dynamicTests.length} dynamic test cases`);
      console.log(`New total test count: ${context.suite.tests.length}`);
    }
    
    // Add assertions that should apply to ALL test cases
    if (!context.suite.defaultTest) {
      context.suite.defaultTest = { assert: [] };
    }
    if (!context.suite.defaultTest.assert) {
      context.suite.defaultTest.assert = [];
    }
    
    // Add a global assertion to check response length
    context.suite.defaultTest.assert.push({
      type: 'javascript',
      value: 'output.length > 10 && output.length < 2000',
    });
    console.log('Added global response length assertion');
    
    // Adjust behavior based on environment
    const isCI = process.env.CI === 'true';
    if (isCI) {
      console.log('CI environment detected - enabling strict mode');
      // In CI, we might want stricter thresholds
      context.suite.defaultTest.assert.push({
        type: 'latency',
        threshold: 5000,
      });
    }
    
    console.log('='.repeat(70) + '\n');
    
    // IMPORTANT: Return the modified context to persist changes
    return context;
  }

  // ===========================================================================
  // HOOK: beforeEach
  // ===========================================================================
  // Runs BEFORE each individual test case.
  // Use cases:
  // - Enrich test data with runtime context
  // - Modify variables based on external state
  // - Set up per-test fixtures
  // - Add conditional assertions based on test properties
  // ===========================================================================
  if (hookName === 'beforeEach') {
    const testDescription = context.test.description || 'Unnamed Test';
    console.log(`\n[beforeEach] Preparing: "${testDescription}"`);
    
    // Load customer data and inject it into the test variables
    const customerName = context.test.vars?.customer_name;
    if (customerName) {
      const customerContext = getCustomerContext(customerName);
      
      // Inject customer context into variables
      context.test.vars.customer_tier = customerContext.tier;
      context.test.vars.customer_account_age = customerContext.accountAge;
      context.test.vars.customer_previous_tickets = customerContext.previousTickets;
      
      console.log(`Enriched with customer context: ${customerName} (${customerContext.tier})`);
    }
    
    // Add Timestamp for Debugging
    context.test.vars.test_timestamp = new Date().toISOString();
    
    // Example: Add stricter assertions for premium customers
    if (context.test.vars?.customer_tier === 'Premium' || 
        context.test.vars?.customer_tier === 'Enterprise') {
      if (!context.test.assert) {
        context.test.assert = [];
      }
      context.test.assert.push({
        type: 'llm-rubric',
        value: 'Response demonstrates premium-level service with personalized attention',
      });
      console.log('Added premium service quality assertion');
    }
    
    // Useful for passing runtime configuration to prompts
    context.test.vars.environment = process.env.NODE_ENV || 'development';
    context.test.vars.version = process.env.APP_VERSION || '1.0.0';
    
    // IMPORTANT: Return the modified context to persist changes
    return context;
  }

  // ===========================================================================
  // HOOK: afterEach
  // ===========================================================================
  // Runs AFTER each individual test case completes.
  // Use cases:
  // - Log individual test results
  // - Track metrics and performance data
  // - Send results to external systems (Slack, DataDog, etc.)
  // - Clean up per-test resources
  // ===========================================================================
  if (hookName === 'afterEach') {
    const testDescription = context.test.description || 'Unnamed Test';
    const success = context.result?.success || false;
    const score = context.result?.score || 0;
    const latencyMs = context.result?.latencyMs || 0;
    
    // Update metrics
    if (success) {
      testMetrics.passCount++;
    } else {
      testMetrics.failCount++;
    }
    testMetrics.totalLatency += latencyMs;
    
    // Store detailed result for reporting
    testMetrics.testResults.push({
      description: testDescription,
      success,
      score,
      latencyMs,
      timestamp: new Date().toISOString(),
      customerName: context.test.vars?.customer_name,
      inquiryType: context.test.vars?.inquiry_type,
    });
    
    // Log result with visual indicator
    const statusIcon = success ? '✅' : '❌';
    const scoreDisplay = (score * 100).toFixed(1);
    console.log(`${statusIcon} [afterEach] "${testDescription}"`);
    console.log(`   Score: ${scoreDisplay}% | Latency: ${latencyMs}ms`);
    
    // Alert on Failures (simulate sending to external system)
    if (!success) {
      console.log(`ALERT: Test failed - would notify Slack/PagerDuty`);
      // In production, you could:
      // await sendSlackNotification(testDescription, context.result);
      // await logToDataDog('test.failed', { test: testDescription });
    }
    // No need to return anything for afterEach (changes won't persist)
  }

  // ===========================================================================
  // HOOK: afterAll
  // ===========================================================================
  // Runs ONCE after the entire test suite completes.
  // Use cases:
  // - Generate summary reports
  // - Send aggregated metrics to monitoring systems
  // - Clean up global resources
  // - Trigger downstream processes (deploy, notify, etc.)
  // ===========================================================================
  if (hookName === 'afterAll') {
    testMetrics.endTime = new Date();
    const duration = (testMetrics.endTime - testMetrics.startTime) / 1000;
    
    console.log('\n' + '='.repeat(70));
    console.log('[afterAll] Test Suite Complete - Summary Report');
    console.log('='.repeat(70));
    
    // Summary Statistics
    const totalTests = testMetrics.passCount + testMetrics.failCount;
    const passRate = totalTests > 0 
      ? ((testMetrics.passCount / totalTests) * 100).toFixed(1) 
      : 0;
    const avgLatency = totalTests > 0 
      ? (testMetrics.totalLatency / totalTests).toFixed(0) 
      : 0;
    
    console.log(`\nResults:`);
    console.log(`   Total Tests:    ${totalTests}`);
    console.log(`   Passed:         ${testMetrics.passCount}`);
    console.log(`   Failed:         ${testMetrics.failCount}`);
    console.log(`   Pass Rate:      ${passRate}%`);
    console.log(`   Avg Latency:    ${avgLatency}ms`);
    console.log(`   Total Duration: ${duration.toFixed(2)}s`);
    
    // Failure Analysis
    const failures = testMetrics.testResults.filter(r => !r.success);
    if (failures.length > 0) {
      console.log(`\nFailed Tests:`);
      failures.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.description}`);
        console.log(`      Customer: ${f.customerName}, Type: ${f.inquiryType}`);
      });
    }
    
    // Performance Analysis
    const slowTests = testMetrics.testResults
      .filter(r => r.latencyMs > 3000)
      .sort((a, b) => b.latencyMs - a.latencyMs);
    
    if (slowTests.length > 0) {
      console.log(`\nSlow Tests (>3s):`);
      slowTests.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.description} - ${t.latencyMs}ms`);
      });
    }
    
    // Generate Report File
    const report = {
      summary: {
        totalTests,
        passed: testMetrics.passCount,
        failed: testMetrics.failCount,
        passRate: parseFloat(passRate),
        avgLatencyMs: parseFloat(avgLatency),
        durationSeconds: parseFloat(duration.toFixed(2)),
        startTime: testMetrics.startTime.toISOString(),
        endTime: testMetrics.endTime.toISOString(),
      },
      tests: testMetrics.testResults,
      failures: failures.map(f => f.description),
      slowTests: slowTests.map(t => ({ name: t.description, latencyMs: t.latencyMs })),
    };
    
    // Write custom report to file
    const reportPath = path.join(__dirname, 'results', 'hooks_report.json');
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nCustom report written to: ${reportPath}`);
    } catch (err) {
      console.log(`\nCould not write report: ${err.message}`);
    }
    
    // CI/CD Integration
    const isCI = process.env.CI === 'true';
    if (isCI) {
      console.log('\nCI Environment Actions:');
      console.log('   - Would post results to GitHub PR comment');
      console.log('   - Would update test dashboard');
      console.log('   - Would trigger alerts if pass rate < 80%');
      
      // Exit with error code if pass rate is below threshold
      if (parseFloat(passRate) < 80) {
        console.log('\nPass rate below 80% threshold - CI would fail');
        // process.exitCode = 1; // Uncomment to actually fail CI
      }
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
    // No need to return anything for afterAll
  }
}

// Export the hook function
module.exports = extensionHook;
