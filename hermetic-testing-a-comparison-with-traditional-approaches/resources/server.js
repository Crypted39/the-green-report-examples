const express = require("express");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// In-memory user database
const users = {
  12345: {
    id: 12345,
    name: "John Doe",
    status: "active",
    email: "john.doe@example.com",
    createdAt: "2024-01-15",
  },
  67890: {
    id: 67890,
    name: "Jane Smith",
    status: "active",
    email: "jane.smith@example.com",
    createdAt: "2024-03-22",
  },
  11111: {
    id: 11111,
    name: "Bob Johnson",
    status: "inactive",
    email: "bob.johnson@example.com",
    createdAt: "2023-11-05",
  },
};

// GET /users/:id - Get user by ID
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  // Simulate network delay (50-200ms)
  const delay = Math.floor(Math.random() * 150) + 50;

  setTimeout(() => {
    const user = users[userId];

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({
        error: "User not found",
        userId: userId,
      });
    }
  }, delay);
});

// GET /users - Get all users
app.get("/users", (req, res) => {
  const delay = Math.floor(Math.random() * 150) + 50;

  setTimeout(() => {
    res.status(200).json(Object.values(users));
  }, delay);
});

// POST /users - Create a new user
app.post("/users", (req, res) => {
  const { name, email, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: "Name and email are required",
    });
  }

  const newId = Math.floor(Math.random() * 90000) + 10000;
  const newUser = {
    id: newId,
    name,
    email,
    status: status || "active",
    createdAt: new Date().toISOString().split("T")[0],
  };

  users[newId] = newUser;

  res.status(201).json(newUser);
});

// PUT /users/:id - Update user
app.put("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users[userId];

  if (!user) {
    return res.status(404).json({
      error: "User not found",
      userId: userId,
    });
  }

  const { name, email, status } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (status) user.status = status;

  res.status(200).json(user);
});

// DELETE /users/:id - Delete user
app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  if (users[userId]) {
    delete users[userId];
    res.status(200).json({
      message: "User deleted successfully",
      userId: userId,
    });
  } else {
    res.status(404).json({
      error: "User not found",
      userId: userId,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Demo API server running on http://localhost:${PORT}`);
  console.log("\nAvailable endpoints:");
  console.log(`GET http://localhost:${PORT}/health`);
  console.log(`GET http://localhost:${PORT}/users`);
  console.log(`GET http://localhost:${PORT}/users/:id`);
  console.log(`POST http://localhost:${PORT}/users`);
  console.log(`PUT http://localhost:${PORT}/users/:id`);
  console.log(`DELETE http://localhost:${PORT}/users/:id`);
  console.log("\nPre-loaded users: 12345, 67890, 11111");
});
