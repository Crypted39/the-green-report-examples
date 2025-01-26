const WebSocket = require("ws");
const assert = require("assert");

// Connect to the WebSocket server
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Connection established");

  // Send an invalid message (not in JSON format)
  ws.send("InvalidMessageFormat");
});

ws.on("message", (message) => {
  // Parse the message if it's in JSON format
  try {
    const parsedMessage = JSON.parse(message.toString()); // Convert buffer to string and parse JSON
    console.log("Received message:", parsedMessage);

    // Check for error responses
    if (parsedMessage.event === "error") {
      assert.strictEqual(
        parsedMessage.error,
        "Invalid JSON format",
        "Unexpected error message"
      );
      console.log("Error simulation validation passed");
    }
  } catch (err) {
    console.error("Failed to parse message:", err.message);
  }
});

ws.on("close", (code, reason) => {
  try {
    // Assert that the connection closed with the expected error code and reason
    assert.strictEqual(code, 1008, "Unexpected close code"); // 1008: Policy Violation
    assert.strictEqual(
      reason.toString(),
      "Invalid message format",
      "Unexpected close reason"
    );
    console.log("Connection closed validation passed");
  } catch (error) {
    console.error("Close event validation failed:", error.message);
  }
});

ws.on("error", (error) => {
  console.error("Error occurred:", error.message);
});
