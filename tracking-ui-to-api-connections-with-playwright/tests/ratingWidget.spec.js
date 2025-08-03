// @ts-check
import { test, expect } from "@playwright/test";

test("sends correct rating payload when a star is clicked", async ({
  page,
}) => {
  await page.goto("http://localhost:3000");

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url().includes("/rating") && request.method() === "POST"
    ),
    page.click('[data-rating="2"]'),
  ]);

  const payload = JSON.parse(request.postData());
  expect(payload).toEqual({ rating: 2 });
});
