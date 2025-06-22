const { defineParameterType } = require("@cucumber/cucumber");
const Product = require("../../src/models/Product");
const User = require("../../src/models/User");
const Email = require("../../src/models/Email");
const UserRole = require("../../src/models/UserRole");

// Transform data table to array of Product objects
defineParameterType({
  name: "product_list",
  regexp: /products?/,
  transformer: () => null, // We'll handle this in the step definition
});

// Helper function to transform product table
function transformProductTable(table) {
  return table.hashes().map((row) => {
    return new Product({
      name: row.name,
      price: {
        amount: parseFloat(row.price.replace("$", "")),
        cents: Math.round(parseFloat(row.price.replace("$", "")) * 100),
        currency: "USD",
        toString: () => row.price,
      },
      category: row.category,
      inStock: row.in_stock === "true",
      description: row.description || "",
      tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()) : [],
    });
  });
}

// Helper function to transform user table
function transformUserTable(table) {
  return table.hashes().map((row) => {
    return new User({
      email: new Email(row.email),
      role: new UserRole(row.role),
      name: row.name,
    });
  });
}

// Helper function to transform vertical table to object
function transformVerticalTable(table) {
  const obj = {};
  table.rowsHash(); // This converts vertical table to key-value pairs

  for (const [key, value] of Object.entries(table.rowsHash())) {
    obj[key] = value;
  }

  return obj;
}

module.exports = {
  transformProductTable,
  transformUserTable,
  transformVerticalTable,
};
