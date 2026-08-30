# Playwright AI Failure Demo

A minimal demo project showing how to capture a screenshot and a compact DOM
(ARIA) snapshot automatically the moment a Playwright test fails, with zero
extra code in the test spec files. This is the companion example for the
blog post "Give Your AI Agent Eyes: Capturing DOM Snapshots for
LLM-Assisted Test Debugging."

## What's here

```
demo-site/         a tiny static checkout page used as the test target
  index.html
  style.css
  script.js         supports ?bug=1 to simulate a UI regression
  server.js         dependency-free static file server (port 3000)
tests/
  fixtures.ts       extends Playwright's `test` to capture on failure
  checkout.spec.ts  two tests: one passes, one fails on purpose
playwright.config.ts
```

## How it works

`tests/fixtures.ts` overrides Playwright's built-in `page` fixture. After
each test runs, it checks if the test failed; if so, it writes a full-page
screenshot and an ARIA snapshot of the DOM into a `failures/` folder.
Every spec that imports `test` from `./fixtures` instead of
`@playwright/test` gets this behavior automatically, no hooks or
boilerplate needed in the spec file itself.

The demo site has a small built-in "bug": visiting it with `?bug=1` changes
the submit button's accessible name from "Submit Order" to "Place Order",
without changing anything else. This simulates the kind of silent UI
regression that breaks a locator without an obvious visual difference.

## Running it

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

This runs both tests. The first one (against the normal page) passes. The
second one (against `?bug=1`) fails on purpose, because the button's
accessible name no longer matches the locator.

After the run, check the `failures/` folder:

```
failures/
  user_can_submit_an_order_(bug_simulation).png
  user_can_submit_an_order_(bug_simulation).yaml
```

Open the `.png` to see the page at the moment of failure, and the `.yaml`
to see the ARIA snapshot. Note the button now reports name "Place Order",
not "Submit Order", which is exactly the kind of detail you'd hand to an
LLM agent to diagnose the failure and propose a locator fix.

## Useful scripts

- `npm run test:pass` runs only the passing test.
- `npm run test:fail` runs only the failing (bug simulation) test, to
  regenerate the failure artifacts on demand.

## Next steps

For richer diagnostics (the full sequence of actions leading up to the
failure, not just the final frame), look at Playwright's built-in trace
viewer: `trace: 'retain-on-failure'` in `playwright.config.ts`.
