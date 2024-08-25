function simpleCalculator(operation, x, y) {
  switch (operation) {
    case "add":
      return x + y;
    case "subtract":
      return x - y;
    case "multiply":
      return x * y;
    case "divide":
      if (y === 0) {
        throw new Error("Cannot divide by zero");
      }
      return x / y;
    default:
      throw new Error("Unknown operation");
  }
}

module.exports = simpleCalculator;
