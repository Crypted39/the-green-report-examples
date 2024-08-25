function processUserData(user) {
  // Check if the user's name is missing, not a string, or just whitespace
  if (
    !user.name || // Check if name is undefined or null
    typeof user.name !== "string" || // Check if name is not a string
    user.name.trim().length === 0 // Check if name is just whitespace or empty after trimming
  ) {
    throw new Error("Invalid name"); // If any of the above conditions are true, throw an error
  }

  // Check if the user's email is missing or not in a valid email format
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new Error("Invalid email address"); // If the email is missing or invalid, throw an error
  }

  // Check if the user's password is missing, less than 8 characters, or does not meet complexity requirements
  if (
    !user.password || // Check if password is undefined or null
    user.password.length < 8 || // Check if password is less than 8 characters
    !/[A-Z]/.test(user.password) || // Check if password does not contain an uppercase letter
    !/[0-9]/.test(user.password) // Check if password does not contain a number
  ) {
    throw new Error(
      "Password must be at least 8 characters long, contain an uppercase letter, and a number"
    ); // If any of the above conditions are true, throw an error
  }

  // Normalize user's name and email before returning the object
  const normalizedUser = {
    ...user, // Copy all properties from the original user object
    name: user.name.trim().replace(/\s+/g, " "), // Trim and replace multiple spaces in the name with a single space
    email: user.email.toLowerCase(), // Convert email to lowercase
  };

  return normalizedUser; // Return the normalized user object
}

module.exports = processUserData; // Export the function for use in other modules
