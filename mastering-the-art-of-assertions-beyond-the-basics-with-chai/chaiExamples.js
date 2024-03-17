import { expect, Assertion } from "chai";

// Verifying Complex Objects

const user = {
  name: "John",
  email: "john@example.com",
  address: { street: "123 Main St" },
};

expect(user).to.be.deep.equal({
  name: "John",
  email: "john@example.com",
  address: { street: "123 Main St" },
});

// Fuzzy Matching for Flexible Comparisons

const price = 9.99;
const discountedPrice = 9.85;

expect(discountedPrice).to.be.closeTo(price, 0.2); // Allow a difference of 0.2

// Custom Assertions for Domain-Specific Needs

function inStock() {
  const actualStock = this._obj.stock;
  this.assert(
    actualStock > 0,
    `Expected product to be in stock, but stock level is ${actualStock}`
  );
}

// Extend the Assertion prototype with the custom method
Assertion.addMethod("inStock", inStock);

const product = { name: "T-Shirt", price: 19.99, stock: 50 };

expect(product).to.be.inStock();

// Handling Expected Exceptions

function calculateDiscount(amount) {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }
  // ... discount calculation logic
}

expect(() => calculateDiscount(-10)).to.throw("Amount cannot be negative");

// Chained Assertions for Readable Code

const person = {
  name: "John Doe",
  age: 30,
  gender: "male",
  occupation: "developer",
};

expect(person)
  .to.have.property("name")
  .that.is.a("string")
  .and.equals("John Doe");
expect(person).to.have.property("age").that.is.a("number").and.equals(30);
expect(person)
  .to.have.property("gender")
  .that.is.a("string")
  .and.equals("male");
expect(person)
  .to.have.property("occupation")
  .that.is.a("string")
  .and.equals("developer");
