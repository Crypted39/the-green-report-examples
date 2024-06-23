const { test, expect } = require("@playwright/test");

test("Verify university data with retries and mock", async ({ page }) => {
  const url =
    "http://universities.hipolabs.com/search?name=middle&country=turkey"; // API URL

  const mockData = {
    name: "Mocked University",
    source: "http://mockeduniversity.com",
  };

  let retries = 3;
  let fetchedData = null;
  let attempt = 0;

  for (let i = 0; i < retries; i++) {
    try {
      attempt++;
      const response = await page.evaluate(() =>
        fetch(
          "http://universities.hipolabs.com/search?name=middle&country=turkey"
        ).then((res) => res.json())
      );
      fetchedData = {
        name: response[0].name,
        source: response[0].web_pages[0],
      }; // Assuming first element has data
      console.log(`Attempt ${i + 1}: Successfully fetched data`);
      break;
    } catch (e) {
      console.error(`Attempt ${i + 1} failed: ${e.message}`);
    }
  }

  if (!fetchedData) {
    console.log("All attempts failed. Using mock data.");
    fetchedData = mockData;

    // Mock the API call with the mocked data
    await page.route(url, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { name: fetchedData.name, web_pages: fetchedData.source },
        ]),
      })
    );
    console.log("Verification done with mocked data");
  } else {
    console.log("Verification done with real data");
  }

  await page.goto("http://127.0.0.1:5500/resources/index.html");

  await page.waitForSelector("#name");
  await page.waitForSelector("#source");

  const universityName = await page.textContent("#name");
  const universitySource = await page.textContent("#source");

  console.log(`Total attempts: ${attempt}`);

  expect(universityName).toBe(fetchedData.name);
  expect(universitySource).toContain(fetchedData.source);
});
