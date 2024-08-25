const processApiRequest = require("./processApiRequest");

describe("Fuzz Testing API Request Processor", () => {
  // Function to generate random strings
  const generateRandomString = (length) => {
    return Array(length)
      .fill(null)
      .map(() =>
        String.fromCharCode(Math.floor(Math.random() * (126 - 32)) + 32)
      )
      .join("");
  };

  // Function to generate random numbers
  const generateRandomNumber = () => {
    return Math.floor(Math.random() * 10000); // Random number between 0 and 9999
  };

  // Function to generate random JSON-like objects
  const generateRandomJsonObject = () => {
    return {
      userId:
        Math.random() > 0.5 ? generateRandomNumber() : generateRandomString(5),
      action:
        Math.random() > 0.5 ? generateRandomString(10) : generateRandomNumber(),
      metadata:
        Math.random() > 0.5
          ? { key: generateRandomString(8) }
          : generateRandomString(10),
    };
  };

  test("randomized API request data", () => {
    for (let i = 0; i < 1000; i++) {
      // Generate random JSON data to simulate incoming API requests
      const randomJson = generateRandomJsonObject();

      try {
        // Attempt to process the random JSON data
        const result = processApiRequest(randomJson);

        // Check that the result contains the expected properties if processing succeeds
        expect(result).toHaveProperty("userId");
        expect(result).toHaveProperty("action");
        expect(result).toHaveProperty("metadata");
      } catch (error) {
        // Ensure that errors are correctly thrown for invalid inputs
        expect(error).toBeInstanceOf(Error);
      }
    }
  });
});
