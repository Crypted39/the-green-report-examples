# Promptfoo Extension Hooks Demo

> **Blog Post:** "Extension Hooks in Promptfoo: Building a Custom LLM Testing Pipeline That Adapts at Runtime"

This demo project showcases how to use Promptfoo's **extension hooks** to build a dynamic, adaptive LLM testing pipeline. It's designed for QA automation engineers who want to go beyond basic prompt testing.

## 🎯 What This Demo Covers

1. **`beforeAll`** - Load additional test cases dynamically from external sources
2. **`beforeEach`** - Enrich test data with runtime context (simulated CRM data)
3. **`afterEach`** - Track test execution metrics and alert on failures
4. **`afterAll`** - Generate custom summary reports and CI/CD integration

## 📁 Project Structure

```
promptfoo-hooks/
├── promptfooconfig.yaml    # Main configuration file
├── hooks.js                # Extension hooks implementation
├── prompts/
│   ├── customer_support_v1.txt  # Basic prompt template
│   └── customer_support_v2.txt  # Enhanced prompt with customer context
├── results/                # Output directory for reports
├── package.json            # NPM scripts for convenience
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **OpenAI API Key** (or any supported LLM provider)

### Setup

```bash
# Navigate to the demo directory
cd promptfoo-hooks

# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key-here

# Validate the configuration (optional but recommended)
npx promptfoo validate
```

### Run the Evaluation

```bash
# Standard run - shows hook output and results
npx promptfoo eval

# Verbose mode - more detailed output
npx promptfoo eval --verbose

# Simulate CI environment
CI=true npx promptfoo eval
```

### View Results

```bash
# Open the interactive web UI to explore results
npx promptfoo view
```

## 🪝 Understanding the Hooks

### 1. `beforeAll` Hook

**When:** Runs once before the entire test suite starts.

**What it does in this demo:**
- Loads 3 additional "edge case" test cases dynamically
- Adds a global assertion for response length to all tests
- Configures stricter settings when running in CI

**Key code:**
```javascript
if (hookName === 'beforeAll') {
  // Inject dynamic test cases
  const dynamicTests = loadDynamicTestCases();
  context.suite.tests.push(...dynamicTests);
  
  // Add global assertion
  context.suite.defaultTest.assert.push({
    type: 'javascript',
    value: 'output.length > 10 && output.length < 2000',
  });
  
  return context; // IMPORTANT: Return to persist changes
}
```

### 2. `beforeEach` Hook

**When:** Runs before each individual test case.

**What it does in this demo:**
- Looks up customer data from a simulated CRM database
- Injects customer context (tier, account age, ticket history) into variables
- Adds premium service assertions for high-tier customers

**Key code:**
```javascript
if (hookName === 'beforeEach') {
  // Enrich with customer context
  const customerContext = getCustomerContext(context.test.vars.customer_name);
  context.test.vars.customer_tier = customerContext.tier;
  context.test.vars.customer_account_age = customerContext.accountAge;
  
  return context; // IMPORTANT: Return to persist changes
}
```

### 3. `afterEach` Hook

**When:** Runs after each individual test case completes.

**What it does in this demo:**
- Tracks pass/fail counts and latency metrics
- Logs individual test results with visual indicators
- Simulates alerting on failures (Slack, PagerDuty, etc.)

**Key code:**
```javascript
if (hookName === 'afterEach') {
  testMetrics.testResults.push({
    description: context.test.description,
    success: context.result.success,
    latencyMs: context.result.latencyMs,
  });
  
  if (!context.result.success) {
    console.log('Would notify Slack/PagerDuty');
  }
  // No return needed - changes won't persist
}
```

### 4. `afterAll` Hook

**When:** Runs once after the entire test suite completes.

**What it does in this demo:**
- Calculates summary statistics (pass rate, avg latency)
- Identifies slow tests and failures
- Writes a custom JSON report to `results/hooks_report.json`
- Simulates CI/CD actions (PR comments, dashboard updates)

**Key code:**
```javascript
if (hookName === 'afterAll') {
  const passRate = (testMetrics.passCount / totalTests) * 100;
  
  // Write custom report
  fs.writeFileSync('results/hooks_report.json', JSON.stringify(report, null, 2));
  
  // CI/CD integration
  if (process.env.CI && passRate < 80) {
    process.exitCode = 1; // Fail the build
  }
}
```

## 🧪 Test Cases Explained

### Static Tests (defined in YAML)

| Test | Customer | Inquiry Type | What We're Testing |
|------|----------|--------------|-------------------|
| Basic greeting | Alice (Premium) | General | Basic functionality |
| Refund request | Bob (Standard) | Refund | Specific use case handling |
| Technical support | Charlie (Enterprise) | Technical | Complex inquiry handling |

### Dynamic Tests (injected via `beforeAll`)

| Test | Purpose |
|------|---------|
| Empty message | Edge case: graceful handling of empty input |
| Very long message | Edge case: handling verbose/emotional customers |
| Spanish inquiry | Edge case: multilingual support detection |

## 📊 Output Files

After running, you'll find:

1. **`results/evaluation_results.json`** - Standard Promptfoo output
2. **`results/hooks_report.json`** - Custom report generated by `afterAll` hook

The custom report includes:
```json
{
  "summary": {
    "totalTests": 12,
    "passed": 10,
    "failed": 2,
    "passRate": 83.3,
    "avgLatencyMs": 1500,
    "durationSeconds": 25.5
  },
  "tests": [...],
  "failures": [...],
  "slowTests": [...]
}
```

## 🔧 Customization Ideas

### Use Different Providers

```yaml
# In promptfooconfig.yaml
providers:
  - openai:gpt-4o        # More capable
  - anthropic:claude-3-5-sonnet  # Alternative
  - ollama:llama3.2      # Local/free option
```

### Load Tests from a Database

```javascript
// In hooks.js
async function loadDynamicTestCases() {
  const connection = await mysql.createConnection({...});
  const [rows] = await connection.execute('SELECT * FROM test_cases WHERE active = 1');
  return rows.map(row => ({
    description: row.description,
    vars: JSON.parse(row.variables),
    assert: JSON.parse(row.assertions),
  }));
}
```

### Send Results to Slack

```javascript
// In afterAll hook
const webhook = process.env.SLACK_WEBHOOK_URL;
await fetch(webhook, {
  method: 'POST',
  body: JSON.stringify({
    text: `LLM Eval Complete: ${passRate}% pass rate (${testMetrics.passCount}/${totalTests})`,
  }),
});
```

## 🤔 When to Use Extension Hooks

| Use Case | Recommended Hook |
|----------|-----------------|
| Load test data from external sources | `beforeAll` |
| Add/modify global assertions | `beforeAll` |
| Enrich tests with runtime data | `beforeEach` |
| Conditional assertions per test | `beforeEach` |
| Track metrics and alert on failures | `afterEach` |
| Generate custom reports | `afterAll` |
| CI/CD quality gates | `afterAll` |