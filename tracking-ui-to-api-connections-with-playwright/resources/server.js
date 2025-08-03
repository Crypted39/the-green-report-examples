const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.post("/rating", (req, res) => {
  console.log("Received rating:", req.body);
  res.status(200).json({ message: "Rating received!" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
