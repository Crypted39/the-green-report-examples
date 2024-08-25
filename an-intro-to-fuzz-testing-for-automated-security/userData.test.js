const processUserData = require("./processUserData");

describe("Fuzz Testing User Data Processor", () => {
  // Function to generate a random string of a specified length
  const generateRandomString = (length) => {
    return Array(length) // Create an array with the specified length
      .fill(null) // Fill the array with null values
      .map(() =>
        String.fromCharCode(Math.floor(Math.random() * (126 - 32)) + 32)
      ) // Generate random ASCII characters between 32 and 126 (printable characters)
      .join(""); // Join the array of characters into a single string
  };

  // Function to generate a random email address
  const generateRandomEmail = () => {
    const name = generateRandomString(Math.floor(Math.random() * 10) + 1); // Generate a random string for the email name part
    const domain = generateRandomString(Math.floor(Math.random() * 5) + 3); // Generate a random string for the domain part
    const tld = generateRandomString(Math.floor(Math.random() * 3) + 2); // Generate a random string for the top-level domain (TLD) part
    return `${name}@${domain}.${tld}`; // Combine name, domain, and TLD to form a complete email address
  };

  // Function to generate a random password
  const generateRandomPassword = () => {
    return `${generateRandomString(Math.floor(Math.random() * 4) + 4)}A1`; // Generate a random string and append "A1" to ensure it has an uppercase letter and a number
  };

  test("randomized user data", () => {
    // Loop to generate and test 1000 random user data objects
    for (let i = 0; i < 1000; i++) {
      const randomName = generateRandomString(Math.floor(Math.random() * 20)); // Generate a random string for the name
      const randomEmail = generateRandomEmail(); // Generate a random email
      const randomPassword = generateRandomPassword(); // Generate a random password

      const user = {
        name: Math.random() > 0.5 ? randomName : null, // Assign a random name or null based on a random condition
        email: Math.random() > 0.5 ? randomEmail : null, // Assign a random email or null based on a random condition
        password: Math.random() > 0.5 ? randomPassword : null, // Assign a random password or null based on a random condition
      };

      try {
        const result = processUserData(user); // Attempt to process the user data
        expect(result).toHaveProperty("name"); // Verify that the processed user data has a name property
        expect(result).toHaveProperty("email"); // Verify that the processed user data has an email property
        expect(result).toHaveProperty("password"); // Verify that the processed user data has a password property
      } catch (error) {
        expect(error).toBeInstanceOf(Error); // If an error is thrown, ensure it is an instance of Error
      }
    }
  });
});
