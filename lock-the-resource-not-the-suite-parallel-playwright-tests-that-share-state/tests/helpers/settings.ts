import { expect, type Page } from '@playwright/test';

export type Field = 'displayName' | 'email' | 'notifications' | 'plan';

/** The two contended resources the demo app exposes. */
export type Resource = 'settings' | 'queue';

async function openPanel(page: Page, owner: string, resource: Resource) {
  await page.goto(`/${resource}`);
  await page.locator('#owner').fill(owner);
}

async function save(page: Page, field: Field, value: string) {
  await page.locator('#field').selectOption(field);
  await page.locator('#value').fill(value);
  await page.locator('#save').click();
  await expect(page.locator('#status')).toHaveText('saved');
}

async function readBack(page: Page, field: Field) {
  await page.locator('#field').selectOption(field);
  await page.locator('#refresh').click();
  await expect(page.locator('#status')).toHaveText('loaded');
  return {
    owner: (await page.locator('#owner-badge').textContent())?.trim(),
    value: (await page.locator('#current-value').textContent())?.trim(),
  };
}

/**
 * The shape all four mutating tests share: write to the one shared record,
 * let the app settle, then confirm nobody else moved it underneath us.
 *
 * A snapshot read is used on purpose. Web-first assertions retry, which would
 * paper over a race by waiting for the record to swing back around.
 */
export async function exerciseSharedRecord(
  page: Page,
  owner: string,
  field: Field,
  { resource = 'settings' as Resource, rounds = 3 } = {},
) {
  await openPanel(page, owner, resource);

  for (let round = 1; round <= rounds; round++) {
    const value = `${owner}-${round}`;
    await save(page, field, value);

    // A real test would be asserting UI, calling another endpoint, or
    // waiting on a toast here. Any of it widens the window.
    await page.waitForTimeout(250);

    const state = await readBack(page, field);
    expect(state.owner, `round ${round}: another test wrote to ${resource}`).toBe(owner);
    expect(state.value, `round ${round}: our value was clobbered`).toBe(value);
  }
}
