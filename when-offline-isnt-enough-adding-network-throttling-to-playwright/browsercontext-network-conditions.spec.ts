/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { browserTest as it, expect } from '../config/browserTest';

it('should add latency to requests', async ({ browser, server, browserName }) => {
  it.skip(browserName !== 'chromium', 'Network throttling is only supported in Chromium');

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(server.EMPTY_PAGE);

  await context.setNetworkConditions({ latency: 500 });
  const start = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.EMPTY_PAGE);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThanOrEqual(400);

  await context.close();
});

it('should throttle download throughput', async ({ browser, server, browserName }) => {
  it.skip(browserName !== 'chromium', 'Network throttling is only supported in Chromium');

  const payload = 'a'.repeat(200 * 1024); // 200 KB
  server.setRoute('/big-payload', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-store');
    res.end(payload);
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(server.EMPTY_PAGE);

  // 50 KB/s -> 200 KB should take at least ~4 seconds.
  await context.setNetworkConditions({ downloadThroughput: 50 * 1024 });
  const start = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.PREFIX + '/big-payload');
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThanOrEqual(3000);

  await context.close();
});

it('should clear throttling when set to null', async ({ browser, server, browserName }) => {
  it.skip(browserName !== 'chromium', 'Network throttling is only supported in Chromium');

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(server.EMPTY_PAGE);

  await context.setNetworkConditions({ latency: 1000 });
  const slowStart = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.EMPTY_PAGE);
  expect(Date.now() - slowStart).toBeGreaterThanOrEqual(800);

  await context.setNetworkConditions(null);
  const fastStart = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.EMPTY_PAGE);
  expect(Date.now() - fastStart).toBeLessThan(500);

  await context.close();
});

it('should accept conditions via newContext option', async ({ browser, server, browserName }) => {
  it.skip(browserName !== 'chromium', 'Network throttling is only supported in Chromium');

  const context = await browser.newContext({ networkConditions: { latency: 500 } });
  const page = await context.newPage();
  await page.goto(server.EMPTY_PAGE);

  const start = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.EMPTY_PAGE);
  expect(Date.now() - start).toBeGreaterThanOrEqual(400);

  await context.close();
});

it('should compose with offline', async ({ browser, server, browserName }) => {
  it.skip(browserName !== 'chromium', 'Network throttling is only supported in Chromium');

  const context = await browser.newContext({ networkConditions: { latency: 100 } });
  const page = await context.newPage();
  await page.goto(server.EMPTY_PAGE);

  await context.setOffline(true);
  let error: Error | null = null;
  await page.evaluate(url => fetch(url, { cache: 'no-store' }), server.EMPTY_PAGE).catch(e => error = e);
  expect(error).toBeTruthy();

  await context.setOffline(false);
  const start = Date.now();
  await page.evaluate(url => fetch(url, { cache: 'no-store' }).then(r => r.text()), server.EMPTY_PAGE);
  // Latency throttling should still apply after coming back online.
  expect(Date.now() - start).toBeGreaterThanOrEqual(80);

  await context.close();
});

it('should throw in firefox and webkit', async ({ browser, browserName }) => {
  it.skip(browserName === 'chromium');

  const context = await browser.newContext();
  await expect(context.setNetworkConditions({ latency: 100 }))
      .rejects.toThrow(/Network throttling is not yet supported/);
  await context.close();
});

it('should throw in firefox and webkit at newContext', async ({ browser, browserName }) => {
  it.skip(browserName === 'chromium');

  await expect(browser.newContext({ networkConditions: { latency: 100 } }))
      .rejects.toThrow(/Network throttling is not yet supported/);
});
