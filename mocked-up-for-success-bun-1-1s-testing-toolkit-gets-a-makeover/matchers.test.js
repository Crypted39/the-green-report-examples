import { expect, test, mock } from "bun:test";

test("object matcher", () => {
  const user = { name: "John", age: 30 };
  expect(user).toBeObject();
});

test("empty object matcher", () => {
  const emptyObject = {};
  expect(emptyObject).toBeEmptyObject();
});

test("keys matcher", () => {
  const person = { name: "Bob", age: 25 };
  expect(person).toContainKeys(["name", "age"]);
});

test("any key matcher", () => {
  const data = { id: 1 };
  expect(data).toContainAnyKeys(["id", "name"]);
});

const students = [
  { name: "Alice", age: 20, grade: "A" },
  { name: "Bob", age: 22, grade: "B" },
  { name: "Charlie", age: 21, grade: "C" },
];

test("contains a student with specific details", () => {
  const targetStudent = { name: "Alice", age: 20, grade: "A" };
  expect(students).toContainEqual(targetStudent);
});

test("key existence matcher", () => {
  const product = { name: "T-Shirt", price: 19.99 };
  expect(product).toContainKey("price");
});

function addAndCall(a, b, callback) {
  const sum = a + b;
  callback(sum);
}

test("calls the callback with the correct sum", () => {
  const mockCallback = mock();
  addAndCall(2, 3, mockCallback);
  expect(mockCallback).toHaveBeenCalledWith(5);
});

test("updates log with the correct message", () => {
  const mockUpdateLog = mock();

  // Simulate updating the log with different messages
  mockUpdateLog("Message 1");
  mockUpdateLog("Message 2");
  mockUpdateLog("Message 3");

  // Check if updateLog was last called with the correct message
  expect(mockUpdateLog).toHaveBeenLastCalledWith("Message 3");
});

// Function to apply discount and log discounted price
function applyDiscount(item, discount) {
  const discountedPrice = calculateDiscountedPrice(item, discount);
  console.log(`Discounted price for ${item}: $${discountedPrice}`);
}

// Function to calculate discounted price
function calculateDiscountedPrice(item, discount) {
  // Logic to calculate discounted price (not shown in this example)
  return 100 - discount; // Dummy logic for demonstration
}

test("applies discount correctly and logs discounted prices", () => {
  const mockApplyDiscount = mock(applyDiscount); // Mock the actual function

  // Simulate applying discount to multiple items
  mockApplyDiscount("Laptop", 10);
  mockApplyDiscount("Phone", 20);
  mockApplyDiscount("Tablet", 15);

  expect(mockApplyDiscount).toHaveBeenNthCalledWith(1, "Laptop", 10);
  expect(mockApplyDiscount).toHaveBeenNthCalledWith(2, "Phone", 20);
  expect(mockApplyDiscount).toHaveBeenNthCalledWith(3, "Tablet", 15);
});

test("whitespace ignored matcher", () => {
  expect("The Green Report").toEqualIgnoringWhitespace("The Green Report");
  expect(" The Green Report ").toEqualIgnoringWhitespace("The Green Report");
  expect("T he Gr ee n Rep ort").toEqualIgnoringWhitespace("The Green Report");
  expect("The Gre\nen Report").toEqualIgnoringWhitespace("The Green Report");
});

function getUserRole(isAdmin) {
  if (isAdmin) {
    return "admin";
  } else {
    // This path shouldn't be reached if input validation is proper
    expect.unreachable("Non-admin user should not reach this point");
    return "invalid"; // This line would never execute
  }
}

// Simulate proper input
console.log(getUserRole(true)); // Output: "admin"

// Simulate unexpected input (for demonstration purposes only)
console.log(getUserRole(undefined)); // This will throw an error

// This function simulates adding items to a shopping cart
function addToCart(item) {
  return [...cart, item];
}

// Our initial shopping cart
let cart = [];

test("Cart contains expected items", () => {
  cart = addToCart("apples");
  cart = addToCart("bread");
  cart = addToCart("milk");

  // Expected items in the cart (doesn't matter about the order)
  const expectedItems = ["bread", "milk"];

  // Assert that the cart contains all the expected items
  expect(cart).toEqual(expect.arrayContaining(expectedItems));
});

// Function to process user data (simulates adding properties)
function processUserData(data) {
  return {
    ...data,
    userId: Math.random().toString(36).substring(2, 15), // Generate a random ID
  };
}

// Test processing user data
test("Processed user data contains required fields", () => {
  const userData = {
    name: "Jane",
    email: "jane@example.com",
  };

  const processedData = processUserData(userData);

  // Expected properties in the processed data
  const expectedProperties = {
    name: expect.any(String), // We only care it's a string
    email: expect.any(String),
  };

  // Assert that processed data contains required properties
  expect(processedData).toEqual(expect.objectContaining(expectedProperties));
});

test("compare floating-point numbers in object properties with close precision", () => {
  const calculatedSum = 0.1 + 0.2;
  const expectedSum = 0.3;

  expect({
    title: "0.1 + 0.2",
    sum: calculatedSum,
  }).toEqual({
    title: "0.1 + 0.2",
    sum: expect.closeTo(expectedSum, 5), // Compare with a precision of 5 decimal digits
  });
});

// Define a custom matcher to check if a number is close to zero within a specified precision
function toBeCloseToZero(actual, precision = 2) {
  if (
    typeof actual !== "number" ||
    typeof precision !== "number" ||
    precision < 0
  ) {
    throw new TypeError("Arguments must be of type number!");
  }

  const pass = Math.abs(actual) < Math.pow(10, -precision) / 2;
  if (pass) {
    return {
      message: () =>
        `expected ${actual} not to be close to zero within precision ${precision}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected ${actual} to be close to zero within precision ${precision}`,
      pass: false,
    };
  }
}

// Extend the expect object with the custom matcher
expect.extend({
  toBeCloseToZero,
});

// Test cases
test("is close to zero within default precision", () => {
  expect(0.0001).toBeCloseToZero();
});

test("is close to zero within custom precision", () => {
  expect(0.0001).toBeCloseToZero(undefined, 4); // Pass undefined as the first argument to skip it
});

test("is NOT close to zero within default precision", () => {
  expect(0.1).not.toBeCloseToZero();
});
