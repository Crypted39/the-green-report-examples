function divideNumbers(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero"); // Custom error message
  }
  return a / b;
}

module.exports = { divideNumbers };
