# Playwright Trace Documentation Example

Turn your Playwright test traces into visual documentation with screenshots and human-readable steps.

## What This Does

Instead of just linking to trace files (which Playwright's HTML reporter already does), this tool:

1. **Extracts screenshots** from traces and displays them inline (start, middle, end states)
2. **Parses test steps** into human-readable actions ("Click on Login button", "Type 'admin' into Username field")
3. **Pulls test descriptions** from your test annotations
4. **Generates a standalone HTML page** that non-technical stakeholders can browse without any tooling

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run tests (generates traces)
npm test

# Generate documentation from traces
npm run generate-docs

# Open the documentation
open docs/index.html
# Or if on Windows:
start docs/index.html
```

## Project Structure

```
├── tests/
│   └── example-flows.spec.js   # Example tests with descriptions
├── test-results/                # Playwright output (generated)
├── docs/                        # Documentation site (generated)
│   ├── index.html               # Main documentation page
│   └── traces/                  # Trace files for download
├── generate-docs.js             # Documentation generator
├── playwright.config.js         # Playwright config (traces always on)
└── package.json
```