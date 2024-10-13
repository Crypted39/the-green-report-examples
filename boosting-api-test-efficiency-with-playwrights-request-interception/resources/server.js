const express = require("express");
const app = express();
const port = 3000;

let apiStatus = {
  api1: 200,
  api2: 200,
  api3: 200,
};

app.use(express.static("public"));
app.use(express.json());

app.post("/api/update-status", (req, res) => {
  apiStatus = { ...req.body };
  res.json({ message: "API status updated", apiStatus });
});

app.get("/api/data1", (req, res) => {
  if (apiStatus.api1 !== 200) {
    res
      .status(apiStatus.api1)
      .send(`API 1 failed with status ${apiStatus.api1}`);
  } else {
    res.json({ message: "Data from API 1" });
  }
});

app.get("/api/data2", (req, res) => {
  if (apiStatus.api2 !== 200) {
    res
      .status(apiStatus.api2)
      .send(`API 2 failed with status ${apiStatus.api2}`);
  } else {
    res.json({ message: "Data from API 2" });
  }
});

app.get("/api/data3", (req, res) => {
  if (apiStatus.api3 !== 200) {
    res
      .status(apiStatus.api3)
      .send(`API 3 failed with status ${apiStatus.api3}`);
  } else {
    res.json({ message: "Data from API 3" });
  }
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
