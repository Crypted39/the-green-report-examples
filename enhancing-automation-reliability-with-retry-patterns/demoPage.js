class DemoPage {
  get fullName() {
    return $("#userName");
  }

  get email() {
    return $("#userEmail");
  }

  get currentAddress() {
    return $("#currentAddress");
  }

  get fakeButton() {
    return $("#fakeButton");
  }

  async navigateToDemoPageTextBoxes() {
    await browser.maximizeWindow();
    await browser.url("/text-box");
  }

  async fillFullName(fullName) {
    await (await this.fullName).setValue(fullName);
  }

  async fillEmail(email) {
    await (await this.email).setValue(email);
  }

  async fillCurrentAddress(currentAddress) {
    await (await this.currentAddress).setValue(currentAddress);
  }

  async clickFakeButton() {
    await (await this.fakeButton).click();
  }
}

module.exports = DemoPage;
