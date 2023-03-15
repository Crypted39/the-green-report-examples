const ResponsivenessUtility = require("../utilities/responsivenessUtility");

class Homepage extends ResponsivenessUtility {
  get latestNewsBanner() {
    return $(".headline-banner");
  }

  get firstFeaturedArticle() {
    return $(".featured-article-1");
  }

  get secondFeaturedArticle() {
    return $(".featured-article-2");
  }

  get thirdFeaturedArticle() {
    return $(".featured-article-3");
  }

  get randomArticlesSection() {
    return $(".sidebar");
  }

  async navigateToHomepage() {
    await browser.maximizeWindow();
    await browser.url("https://www.thegreenreport.blog/");
  }

  async verifyFullSizeHomepageLayout() {
    await this.resizeBrowser(1920, 1080);
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.secondFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.latestNewsBanner
    );
    await this.verifyElementOnTheRight(
      await this.secondFeaturedArticle,
      await this.firstFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.thirdFeaturedArticle,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.secondFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.secondFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementAlignment(
      [this.firstFeaturedArticle, this.secondFeaturedArticle],
      "HorizontallyTop"
    );
  }

  async verifyFirstBreakPointHomepageLayout() {
    await this.resizeBrowser(1499, 1080);
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.secondFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.latestNewsBanner
    );
    await this.verifyElementOnTheRight(
      await this.secondFeaturedArticle,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.secondFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.firstFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.secondFeaturedArticle
    );
    await this.verifyElementOnTheRight(
      await this.randomArticlesSection,
      await this.thirdFeaturedArticle
    );
  }

  async verifySecondBreakPointHomepageLayout() {
    await this.resizeBrowser(1023, 1080);
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.secondFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.secondFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.firstFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.thirdFeaturedArticle,
      await this.randomArticlesSection
    );
  }

  async verifyThirdBreakPointHomepageLayout() {
    await this.resizeBrowser(767, 1080);
    await this.verifyElementIsAbove(
      await this.latestNewsBanner,
      await this.firstFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.firstFeaturedArticle,
      await this.secondFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.secondFeaturedArticle,
      await this.thirdFeaturedArticle
    );
    await this.verifyElementIsAbove(
      await this.thirdFeaturedArticle,
      await this.randomArticlesSection
    );
  }

  async screenshotVerification() {
    await this.verifyElementOnTheRight(
      await this.firstFeaturedArticle,
      await this.latestNewsBanner
    );
  }
}

module.exports = new Homepage();
