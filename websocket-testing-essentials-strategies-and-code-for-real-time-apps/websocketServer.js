const WebSocket = require("ws");

// Create a WebSocket server on port 8080
const server = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server started on ws://localhost:8080");

server.on("connection", (ws) => {
  console.log("Client connected");

  // Handle incoming messages from the client
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);

    try {
      const parsedMessage = JSON.parse(message);
      // Handle the parsed message
      if (parsedMessage.event === "ping") {
        ws.send(JSON.stringify({ event: "pong" }));
      } else {
        ws.send(JSON.stringify({ event: "received", data: parsedMessage }));
      }
    } catch (error) {
      console.log("Invalid JSON received:", message);
      ws.send(JSON.stringify({ event: "error", error: "Invalid JSON format" }));
      ws.close(1008, "Invalid message format"); // Close connection with code 1008
    }
  });

  // Handle connection closure
  ws.on("close", (code, reason) => {
    console.log(`Client disconnected: ${code} - ${reason}`);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error}`);
  });

  // Send a welcome message to the client
  ws.send(
    JSON.stringify({
      event: "welcome",
      message: "Welcome to the WebSocket server!",
    })
  );
});
