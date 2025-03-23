const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// This should be an environment variable in a real app
const JWT_SECRET = "insecure-secret-key-for-testing";

// Route for getting a token (simulating login)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Simple validation (don't do this in production!)
  if (username === "user" && password === "password") {
    // Create a user object
    const user = {
      id: 123,
      username: "user",
      role: "user",
    };

    // Create and sign a JWT token
    const token = jwt.sign(user, JWT_SECRET, {
      expiresIn: "1h",
      algorithm: "HS256",
    });

    return res.json({ token });
  }

  // Admin login
  if (username === "admin" && password === "admin123") {
    const admin = {
      id: 1,
      username: "admin",
      role: "admin",
    };

    const token = jwt.sign(admin, JWT_SECRET, {
      expiresIn: "1h",
      algorithm: "HS256",
    });

    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// Vulnerable JWT verification - accepts 'none' algorithm
app.get("/api/vulnerable/none-algorithm", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // VULNERABLE: This doesn't specify allowed algorithms
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({
      message: "Protected data accessed",
      user: decoded,
    });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
});

// Vulnerable to expired tokens
app.get("/api/vulnerable/expired-tokens", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // VULNERABLE: ignores expiration
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

    return res.json({
      message: "Protected data accessed",
      user: decoded,
    });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
});

// Vulnerable to signature stripping
app.get("/api/vulnerable/signature-check", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // VULNERABLE: Custom parsing without proper signature validation
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(403).json({ message: "Invalid token format" });
    }

    // Decode the payload without verifying the signature
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // Only check if the token has a user ID
    if (payload && payload.id) {
      return res.json({
        message: "Protected data accessed",
        user: payload,
      });
    }

    return res.status(403).json({ message: "Invalid token content" });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
});

// Secure endpoint as a control
app.get("/api/secure", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // SECURE: Properly validates token with algorithm restriction
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"], // Only allow HS256
    });

    return res.json({
      message: "Secure data accessed",
      user: decoded,
    });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Vulnerable JWT server running at http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("  POST /api/login - Get a valid token");
  console.log(
    "  GET /api/vulnerable/none-algorithm - Vulnerable to algorithm confusion"
  );
  console.log("  GET /api/vulnerable/expired-tokens - Accepts expired tokens");
  console.log(
    "  GET /api/vulnerable/signature-check - Vulnerable to signature tampering"
  );
  console.log("  GET /api/secure - Properly secured endpoint (for comparison)");
});
