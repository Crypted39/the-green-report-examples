const WebSocket = require("ws");
const assert = require("assert");

// Connect to the WebSocket server
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Connection established");
  assert.strictEqual(
    ws.readyState,
    WebSocket.OPEN,
    "WebSocket connection was not opened"
  );
  ws.close(); // Close the connection after testing
});

ws.on("error", (error) => {
  assert.fail(`Connection failed: ${error.message}`);
});
