const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom login route
server.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = router.db; // lowdb instance
  const user = db.get("users").find({ username, password }).value();

  if (user) {
    return res.json({ token: user.token });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
});

// Basic search endpoint
server.get("/api/search", (req, res) => {
  const q = req.query.q?.toLowerCase() || "";
  const db = router.db;
  const results = db
    .get("items")
    .filter((item) => item.name.toLowerCase().includes(q))
    .value();

  res.json({ results });
});

// Items detail (fallback to json-server router)
server.use("/api", router);

server.listen(3000, () => {
  console.log("Mock API running on http://localhost:3000");
});
