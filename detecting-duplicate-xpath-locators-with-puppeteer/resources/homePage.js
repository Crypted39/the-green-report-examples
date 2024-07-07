const { expect } = require("@playwright/test");

class HomePage {
  constructor(page) {
    this.page = page;
  }

  get firstPlantTypeSelector() {
    return this.page.locator(`//select[@name='plant-type']`);
  }

  get secondPlantTypeSelector() {
    return this.page.locator(`//select[@id='plants']`);
  }

  get thirdPlantTypeSelector() {
    return this.page.locator(`//div[@class='controls']/select[1]`);
  }

  get firstGardenNotesTextArea() {
    return this.page.locator(`//textarea[@id='garden-notes-auto-id']`);
  }

  get secondGardenNotesTextArea() {
    return this.page.locator(`//div[@class='main-container']/textarea`);
  }

  get firstVegetableName() {
    return this.page.locator(
      `//table[@id='vegetables']//td[@class='data-1-1']`
    );
  }

  get secondVegetableName() {
    return this.page.locator(`//table[@id='vegetables']//tr[2]/td[1]`);
  }

  get thirdVegetableName() {
    return this.page.locator(`//tr[//th[text()='Vegetable']]/td[1]`);
  }

  get fourthVegetableName() {
    return this.page.locator(`//table[@id='vegetables']//td[position()=1]`);
  }

  get fifthVegetableName() {
    return this.page.locator(
      `//table[@id='vegetables']//tr/td[descendant::text()='Tomatoes']`
    );
  }

  get firstListItem() {
    return this.page.locator(`//li[@id='list-item-2']`);
  }

  get secondListItem() {
    return this.page.locator(`//li[@id='list-item-2']`);
  }

  get trackButtonLocator() {
    return this.page.locator(`//button[@id='track-button']`);
  }

  async selectPlantType() {
    await this.firstPlantTypeSelector.click();
  }

  async enterGardenNotes(notes) {
    await this.firstGardenNotesTextArea.fill(notes);
    await this.trackButton.click();
  }

  async verifyTaskListValue() {
    await expect(this.thirdVegetableName).toContainText("Tomatoes");
  }
}

module.exports = HomePage;
