const { Given, When, Then, Before } = require("@cucumber/cucumber");
const {
  transformProductTable,
  transformVerticalTable,
} = require("./table_transformations");
const Product = require("../../src/models/Product");
const assert = require("assert");

let products = [];
let users = [];
let searchResults = [];

Before(function () {
  products = [];
  users = [];
  searchResults = [];
});

// Using transformed data tables
Given("the following products exist:", function (dataTable) {
  const productList = transformProductTable(dataTable);
  products.push(...productList);
  this.products = products;
});

// Using vertical table transformation
Given("a product with these details:", function (dataTable) {
  const productData = transformVerticalTable(dataTable);

  const product = new Product({
    name: productData.name,
    price: {
      amount: parseFloat(productData.price.replace("$", "")),
      cents: Math.round(parseFloat(productData.price.replace("$", "")) * 100),
      currency: "USD",
      toString: () => productData.price,
    },
    category: productData.category,
    description: productData.description,
    tags: productData.tags
      ? productData.tags.split(",").map((tag) => tag.trim())
      : [],
  });

  products.push(product);
  this.lastCreatedProduct = product;
});

When("I search for products in category {string}", function (category) {
  searchResults = products.filter((product) => product.category === category);
});

When("I search for products with tag {string}", function (tag) {
  searchResults = products.filter((product) => product.hasTag(tag));
});

Then("I should find {int} product(s)", function (expectedCount) {
  assert.strictEqual(searchResults.length, expectedCount);
});

Then("all products should be in stock", function () {
  const inStockProducts = products.filter((product) => product.isAvailable());
  assert.strictEqual(inStockProducts.length, products.length);
});

Then("the product should have the name {string}", function (expectedName) {
  assert.strictEqual(this.lastCreatedProduct.name, expectedName);
});

Then("the product should have {int} tag(s)", function (expectedTagCount) {
  assert.strictEqual(this.lastCreatedProduct.tags.length, expectedTagCount);
});

// Complex table validation
Then("the products should have the following details:", function (dataTable) {
  const expectedProducts = transformProductTable(dataTable);

  expectedProducts.forEach((expectedProduct) => {
    const actualProduct = products.find((p) => p.name === expectedProduct.name);
    assert(actualProduct, `Product ${expectedProduct.name} not found`);
    assert.strictEqual(actualProduct.category, expectedProduct.category);
    assert.strictEqual(actualProduct.price.cents, expectedProduct.price.cents);
  });
});
