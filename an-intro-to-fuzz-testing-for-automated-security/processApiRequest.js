// Function to process incoming API request data
function processApiRequest(requestBody) {
  // Validate that the request body is an object
  if (typeof requestBody !== "object" || requestBody === null) {
    throw new Error("Invalid request body: must be a non-null object");
  }

  // Extract and validate the required 'userId' field
  if (
    !requestBody.hasOwnProperty("userId") ||
    typeof requestBody.userId !== "number"
  ) {
    throw new Error("Invalid or missing 'userId'");
  }

  // Extract and validate the optional 'action' field
  if (
    requestBody.hasOwnProperty("action") &&
    typeof requestBody.action !== "string"
  ) {
    throw new Error("Invalid 'action': must be a string if provided");
  }

  // Extract and validate the optional 'metadata' field, which should be an object
  if (
    requestBody.hasOwnProperty("metadata") &&
    (typeof requestBody.metadata !== "object" || requestBody.metadata === null)
  ) {
    throw new Error(
      "Invalid 'metadata': must be a non-null object if provided"
    );
  }

  // Further processing could include storing the data, triggering actions, etc.
  // For this example, we simply return a normalized version of the request
  return {
    userId: requestBody.userId,
    action: requestBody.action || "default_action",
    metadata: requestBody.metadata || {},
  };
}

module.exports = processApiRequest;
