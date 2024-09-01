const { divideNumbers } = require("../divideNumbers");

test("should throw an error when dividing by zero", () => {
  try {
    divideNumbers(10, 0); // This will throw an error
  } catch (error) {
    global.handleTestError(error); // Use the Winston logger to handle the error
    expect(() => {
      throw error;
    }).toThrow("Cannot divide by zero"); // Mark test as failed without default Jest stack trace
  }
});
