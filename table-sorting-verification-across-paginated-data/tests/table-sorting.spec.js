const { test, expect } = require("@playwright/test");

test.describe("Table Sorting Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:5500/index.html"); // Update URL if different
  });

  const columns = ["name", "age", "joiningDate", "salary"];

  async function getTableData(page) {
    return await page.$$eval("#tableBody tr", (rows) =>
      rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          name: cells[0].textContent.trim(),
          age: parseInt(cells[1].textContent.trim(), 10),
          joiningDate: new Date(cells[2].textContent.trim()),
          salary: parseFloat(cells[3].textContent.replace("$", "").trim()),
        };
      })
    );
  }

  async function verifySorted(data, column, direction) {
    const sorted = [...data].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (column === "age" || column === "salary") {
        return direction === "asc" ? valA - valB : valB - valA;
      } else if (column === "joiningDate") {
        return direction === "asc" ? valA - valB : valB - valA;
      } else {
        return direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
    });
    for (let i = 0; i < data.length; i++) {
      if (data[i][column] !== sorted[i][column]) return false;
    }
    return true;
  }

  for (const column of columns) {
    for (const direction of ["asc", "desc"]) {
      test(`should sort table by ${column} in ${direction} order across pages`, async ({
        page,
      }) => {
        if (column !== "name") {
          await page.click(`th[data-sort="${column}"]`); // Default sort is by name in asc order
        }

        if (direction === "desc") {
          await page.click(`th[data-sort="${column}"]`); // Click again for descending
        }

        let allData = [];
        let currentPage = 1;
        let totalPages;

        do {
          const tableData = await getTableData(page);
          allData = allData.concat(tableData);

          if (!totalPages) {
            const pageInfoText = await page.locator("#pageInfo").textContent();
            totalPages = parseInt(
              pageInfoText.match(/Page \d+ of (\d+)/)[1],
              10
            );
          }

          if (currentPage < totalPages) {
            await page.click('button:has-text("Next")');
            currentPage++;
          } else {
            break; // Exit loop if on the last page
          }
        } while (currentPage <= totalPages);
        expect(await verifySorted(allData, column, direction)).toBeTruthy();
      });
    }
  }
});
