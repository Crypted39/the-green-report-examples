const simpleCalculator = require("./simpleCalculator");

describe("Fuzz Testing Simple Calculator", () => {
  test("randomized inputs", () => {
    for (let i = 0; i < 1000; i++) {
      const operations = ["add", "subtract", "multiply", "divide", "unknown"];
      const operation =
        operations[Math.floor(Math.random() * operations.length)];
      const x = Math.floor(Math.random() * 100) - 50;
      const y = Math.floor(Math.random() * 100) - 50;

      try {
        simpleCalculator(operation, x, y);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }
  });
});
