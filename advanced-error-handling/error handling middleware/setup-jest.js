global.handleTestError = (error) => {
  const formattedError = {
    message: error.message,
    stack: error.stack.split("\n").slice(0, 5).join("\n"), // Trimmed stack trace for clarity
    timestamp: new Date().toISOString(),
  };
  console.error("Formatted Test Error:", formattedError); // Log the formatted error
};
