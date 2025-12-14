const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const TEST_RESULTS_DIR = "./test-results";
const DOCS_DIR = "./docs";
const TRACES_DIR = path.join(DOCS_DIR, "traces");

// Ensure docs directories exist
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
if (!fs.existsSync(TRACES_DIR)) fs.mkdirSync(TRACES_DIR, { recursive: true });

// Find all trace.zip files
function findTraces(dir, traces = []) {
  if (!fs.existsSync(dir)) return traces;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findTraces(fullPath, traces);
    } else if (item === "trace.zip") {
      traces.push(fullPath);
    }
  }
  return traces;
}

// Extract screenshots and actions from trace.zip
function extractTraceData(tracePath) {
  const zip = new AdmZip(tracePath);
  const entries = zip.getEntries();

  const screenshots = [];
  let actions = [];

  for (const entry of entries) {
    // Extract screenshots
    if (entry.entryName.endsWith(".png") || entry.entryName.endsWith(".jpeg")) {
      screenshots.push({
        name: entry.entryName,
        data: entry.getData().toString("base64"),
        type: entry.entryName.endsWith(".png") ? "image/png" : "image/jpeg",
      });
    }

    // Parse trace actions from the trace file
    if (entry.entryName.endsWith(".trace")) {
      const content = entry.getData().toString("utf8");
      const lines = content.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          // Look for 'before' events with pw:api method - these are the actual Playwright actions
          if (
            event.type === "before" &&
            event.method === "pw:api" &&
            event.title
          ) {
            // Skip internal/setup actions
            const skipPatterns = [
              "Launch browser",
              "New browser context",
              "New page",
              "Close browser",
              "Close context",
              "Close page",
              "Tracing",
              "Route",
              "Expect",
            ];

            const shouldSkip = skipPatterns.some((pattern) =>
              event.title.toLowerCase().includes(pattern.toLowerCase())
            );

            if (!shouldSkip) {
              actions.push({
                title: event.title,
                startTime: event.startTime || 0,
              });
            }
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    }
  }

  // Sort actions by timestamp and deduplicate
  actions = actions
    .sort((a, b) => a.startTime - b.startTime)
    .filter((action, index, arr) => {
      if (index === 0) return true;
      return action.title !== arr[index - 1].title;
    });

  return { screenshots, actions };
}

// Get test info from trace path
function getTestInfo(tracePath) {
  const dirName = path.basename(path.dirname(tracePath));
  const parts = dirName.replace(/-chromium$/, "").split("-");

  // Try to parse describe block and test name
  // Format is usually: filename-DescribeBlock-test-name-chromium

  return {
    id: dirName,
    fullName: parts.join(" "),
    tracePath: tracePath,
    timestamp: fs.statSync(tracePath).mtime,
  };
}

// Load test metadata from Playwright JSON report if available
function loadTestMetadata() {
  const jsonReportPath = "./test-results/results.json";
  const metadata = {};

  if (fs.existsSync(jsonReportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(jsonReportPath, "utf8"));

      for (const suite of report.suites || []) {
        extractTestsFromSuite(suite, metadata);
      }
    } catch (e) {
      console.log("   Could not parse JSON report, using defaults");
    }
  }

  return metadata;
}

function extractTestsFromSuite(suite, metadata, parentTitles = []) {
  const titles = [suite.title].filter(Boolean);

  for (const spec of suite.specs || []) {
    const testTitle = spec.title;
    const fullTitle = [...titles, testTitle].join(" ");

    // Create a key that matches our trace directory naming
    const key = fullTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    metadata[key] = {
      title: testTitle,
      suite: titles.join(" > "),
      file: suite.file,
      annotations: spec.annotations || [],
      description:
        spec.annotations?.find((a) => a.type === "description")?.description ||
        null,
    };
  }

  for (const childSuite of suite.suites || []) {
    extractTestsFromSuite(childSuite, metadata, titles);
  }
}

// Process a single trace
function processTrace(testInfo, metadata) {
  console.log(`   Processing: ${testInfo.id}`);

  const destDir = path.join(TRACES_DIR, testInfo.id);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  // Copy original trace
  fs.copyFileSync(testInfo.tracePath, path.join(destDir, "trace.zip"));

  // Extract screenshots and actions
  const { screenshots, actions } = extractTraceData(testInfo.tracePath);

  // Find matching metadata
  const metaKey = Object.keys(metadata).find((key) => {
    const normalizedId = testInfo.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      normalizedId.includes(normalizedKey) ||
      normalizedKey.includes(normalizedId)
    );
  });
  const testMeta = metadata[metaKey] || {};

  // Select key screenshots (skip first blank one, then pick start/middle/end)
  // The first screenshot is usually blank (captured before page loads)
  const usableScreenshots =
    screenshots.length > 1 ? screenshots.slice(1) : screenshots;

  const keyScreenshots = [];
  if (usableScreenshots.length > 0) {
    keyScreenshots.push(usableScreenshots[0]); // First meaningful screenshot
    if (usableScreenshots.length > 2) {
      keyScreenshots.push(
        usableScreenshots[Math.floor(usableScreenshots.length / 2)]
      ); // Middle
    }
    if (usableScreenshots.length > 1) {
      keyScreenshots.push(usableScreenshots[usableScreenshots.length - 1]); // Last
    }
  }

  return {
    ...testInfo,
    title: testMeta.title
      ? `${testMeta.suite || "Tests"}: ${testMeta.title}`
      : testInfo.fullName,
    suite: testMeta.suite || "Tests",
    description: testMeta.description,
    screenshots: keyScreenshots,
    allScreenshotCount: screenshots.length,
    actions: actions.slice(0, 15).map((a) => a.title), // Limit to 15 steps
    totalActions: actions.length,
    traceUrl: `traces/${testInfo.id}/trace.zip`,
  };
}

// Generate HTML
function generateHTML(tests) {
  // Group by suite
  const groupedTests = tests.reduce((acc, test) => {
    const group = test.suite || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(test);
    return acc;
  }, {});

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Documentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #334155;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    header {
      text-align: center;
      margin-bottom: 50px;
    }
    
    h1 {
      font-size: 2.5rem;
      color: #1e293b;
      margin-bottom: 10px;
    }
    
    .subtitle {
      color: #64748b;
      font-size: 1.1rem;
    }
    
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 30px 0;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #3b82f6;
    }
    
    .stat-label {
      font-size: 0.85rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .suite-section {
      margin-bottom: 50px;
    }
    
    .suite-title {
      font-size: 1.3rem;
      color: #475569;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .test-card {
      background: white;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .test-header {
      padding: 20px 25px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .test-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e293b;
    }
    
    .test-description {
      color: #64748b;
      margin-top: 5px;
      font-size: 0.95rem;
    }
    
    .test-meta {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    
    .test-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    
    @media (max-width: 800px) {
      .test-content {
        grid-template-columns: 1fr;
      }
    }
    
    .screenshots-panel {
      padding: 20px;
      background: #f8fafc;
      border-right: 1px solid #f1f5f9;
    }
    
    .screenshots-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .screenshot-item {
      position: relative;
    }
    
    .screenshot-item img {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .screenshot-item img:hover {
      transform: scale(1.02);
    }
    
    .screenshot-label {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .steps-panel {
      padding: 20px 25px;
    }
    
    .steps-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 15px;
    }
    
    .steps-list {
      list-style: none;
    }
    
    .step-item {
      display: flex;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .step-item:last-child {
      border-bottom: none;
    }
    
    .step-number {
      background: #3b82f6;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .step-text {
      font-size: 0.95rem;
      color: #475569;
    }
    
    .more-steps {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-top: 10px;
      font-style: italic;
    }
    
    .test-footer {
      padding: 15px 25px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }
    
    .btn-secondary:hover {
      background: #cbd5e1;
    }
    
    .no-screenshots {
      color: #94a3b8;
      font-style: italic;
      padding: 40px 20px;
      text-align: center;
    }
    
    /* Modal for full-size screenshots */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 8px;
    }
    
    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    
    footer {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📋 Test Documentation</h1>
      <p class="subtitle">Visual walkthroughs of automated test flows</p>
      
      <div class="stats-bar">
        <div class="stat">
          <div class="stat-value">${tests.length}</div>
          <div class="stat-label">Test Flows</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Object.keys(groupedTests).length}</div>
          <div class="stat-label">Test Suites</div>
        </div>
        <div class="stat">
          <div class="stat-value">${new Date().toLocaleDateString()}</div>
          <div class="stat-label">Last Updated</div>
        </div>
      </div>
    </header>
    
    ${Object.entries(groupedTests)
      .map(
        ([suite, suiteTests]) => `
      <section class="suite-section">
        <h2 class="suite-title">${suite}</h2>
        
        ${suiteTests
          .map(
            (test) => `
          <article class="test-card">
            <div class="test-header">
              <div>
                <h3 class="test-title">${test.title}</h3>
                ${
                  test.description
                    ? `<p class="test-description">${test.description}</p>`
                    : ""
                }
              </div>
              <span class="test-meta">${
                test.allScreenshotCount
              } screenshots</span>
            </div>
            
            <div class="test-content">
              <div class="screenshots-panel">
                ${
                  test.screenshots.length > 0
                    ? `
                  <div class="screenshots-grid">
                    ${test.screenshots
                      .map((ss, i) => {
                        const label =
                          i === 0
                            ? "Start"
                            : i === test.screenshots.length - 1
                            ? "End"
                            : "Middle";
                        return `
                        <div class="screenshot-item">
                          <span class="screenshot-label">${label}</span>
                          <img src="data:${ss.type};base64,${ss.data}" 
                               alt="Screenshot ${i + 1}" 
                               onclick="openModal(this.src)" />
                        </div>
                      `;
                      })
                      .join("")}
                  </div>
                `
                    : `
                  <div class="no-screenshots">No screenshots captured</div>
                `
                }
              </div>
              
              <div class="steps-panel">
                <div class="steps-title">Test Steps</div>
                <ol class="steps-list">
                  ${test.actions
                    .map(
                      (action, i) => `
                    <li class="step-item">
                      <span class="step-number">${i + 1}</span>
                      <span class="step-text">${action}</span>
                    </li>
                  `
                    )
                    .join("")}
                </ol>
                ${
                  test.totalActions > test.actions.length
                    ? `
                  <p class="more-steps">+ ${
                    test.totalActions - test.actions.length
                  } more steps</p>
                `
                    : ""
                }
              </div>
            </div>
            
            <div class="test-footer">
              <a href="${
                test.traceUrl
              }" download class="btn btn-secondary">Download Trace</a>
            </div>
          </article>
        `
          )
          .join("")}
      </section>
    `
      )
      .join("")}
  </div>
  
  <footer>
    Generated from Playwright traces • 
    Open downloaded traces at <a href="https://trace.playwright.dev" target="_blank">trace.playwright.dev</a>
  </footer>
  
  <div class="modal" id="modal" onclick="closeModal()">
    <span class="modal-close">&times;</span>
    <img id="modal-img" src="" alt="Full size screenshot" />
  </div>
  
  <script>
    function openModal(src) {
      document.getElementById('modal-img').src = src;
      document.getElementById('modal').classList.add('active');
    }
    
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;
}

// Main
console.log("🔍 Finding traces...");
const traces = findTraces(TEST_RESULTS_DIR);
console.log(`   Found ${traces.length} trace files`);

if (traces.length === 0) {
  console.log('❌ No traces found. Run "npm test" first to generate traces.');
  process.exit(1);
}

console.log("📊 Loading test metadata...");
const metadata = loadTestMetadata();

console.log("📦 Processing traces...");
const tests = traces
  .map((t) => getTestInfo(t))
  .map((t) => processTrace(t, metadata));

console.log("📝 Generating documentation...");
const html = generateHTML(tests);
fs.writeFileSync(path.join(DOCS_DIR, "index.html"), html);

console.log("✅ Documentation generated!");
console.log(`   Output: ${path.resolve(DOCS_DIR)}/index.html`);
console.log("\n📖 To view: open docs/index.html in your browser");
console.log("   Or run: npm run serve-docs");
