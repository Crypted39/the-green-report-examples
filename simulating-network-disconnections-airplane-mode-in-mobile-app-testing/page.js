import { $ } from "@wdio/globals";

class Page {
  async getCompanyName() {
    const companyName = await $(
      '//android.widget.TextView[@resource-id="com.example.network_app:id/userName"]'
    );
    return companyName.getText();
  }

  async getCompanyRepositories() {
    const companyRepositories = await $(
      '//android.widget.TextView[@resource-id="com.example.network_app:id/userRepos"]'
    );
    return companyRepositories.getText();
  }

  async tapReloadButton() {
    const reloadButton = await $(
      '//android.widget.Button[@resource-id="com.example.network_app:id/reloadButton"]'
    );
    reloadButton.click();
  }
}

export default Page;
