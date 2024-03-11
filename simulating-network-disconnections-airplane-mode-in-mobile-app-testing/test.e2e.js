import Page from "../pageobjects/page.js";

const page = new Page();

describe("Simulating Network Disconnections", () => {
  afterAll(async () => {
    await driver.setNetworkConnection(6); // airplane mode off, wifi on, data on
  });

  it("Airplane Mode Test", async () => {
    const companyName = await page.getCompanyName();
    const companyRepositories = await page.getCompanyRepositories();
    expect(companyName).toEqual("Company name: Meta");
    expect(companyRepositories).toEqual("Public repositories: 135");

    await driver.setNetworkConnection(1); // airplane mode on, wifi off, data off
    await page.tapReloadButton();

    const noCompanyName = await page.getCompanyName();
    const noCompanyRepositories = await page.getCompanyRepositories();
    expect(noCompanyName).toEqual("Company name: Error");
    expect(noCompanyRepositories).toEqual("Public repositories: Error");
  });
});
