const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Track users and their states
const users = new Map(); // userId -> { state: 'waiting' | 'connected', peerId: string }
let waitingUsers = new Set();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  users.set(socket.id, { state: "idle" });

  socket.on("startSearching", () => {
    const user = users.get(socket.id);
    if (user) {
      user.state = "waiting";
      waitingUsers.add(socket.id);

      // Try to match with another waiting user
      matchUsers();
    }
  });

  socket.on("peerInfo", ({ peerId }) => {
    const user = users.get(socket.id);
    if (user) {
      user.peerId = peerId;
    }
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user && user.state === "waiting") {
      waitingUsers.delete(socket.id);
    }
    users.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

function matchUsers() {
  if (waitingUsers.size >= 2) {
    const [user1, user2] = [...waitingUsers].slice(0, 2);

    // Remove users from waiting pool
    waitingUsers.delete(user1);
    waitingUsers.delete(user2);

    // Update their states
    users.get(user1).state = "connected";
    users.get(user2).state = "connected";

    // Notify both users of the match
    io.to(user1).emit("matched", {
      peerId: users.get(user2).peerId,
    });
    io.to(user2).emit("matched", {
      peerId: users.get(user1).peerId,
    });
  }
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
