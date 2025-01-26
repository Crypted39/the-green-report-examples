const WebSocket = require("ws");
const assert = require("assert");

// Connect to the WebSocket server
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Connection established");

  // Send a valid message in JSON format
  const message = JSON.stringify({ event: "test", data: "Hello WebSocket" });
  ws.send(message);
});

ws.on("message", (message) => {
  // Parse the message and handle based on event type
  try {
    const parsedMessage = JSON.parse(message.toString());
    console.log("Received message:", parsedMessage);

    // Handle the welcome event
    if (parsedMessage.event === "welcome") {
      console.log("Received welcome message:", parsedMessage.message);
    }

    // Handle the received event from the server
    if (parsedMessage.event === "received") {
      // Handle the nested data field correctly
      assert.strictEqual(
        parsedMessage.data.data,
        "Hello WebSocket",
        "Message data mismatch"
      );
      console.log("Message validation passed");

      // Close the WebSocket connection after validation
      ws.close(1000, "Test complete");
    }
  } catch (err) {
    console.error("Failed to parse message:", err.message);
  }
});
