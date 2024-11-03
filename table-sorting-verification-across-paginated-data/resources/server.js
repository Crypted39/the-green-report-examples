const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Enable CORS for frontend requests
app.use(cors());

// Generate random data for the table
function generateRandomData() {
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Edward",
    "Fiona",
    "George",
    "Helen",
    "Isaac",
    "Jasmine",
    "Kevin",
    "Liam",
    "Mia",
    "Noah",
    "Olivia",
    "Paul",
    "Quinn",
    "Rachel",
    "Sophie",
    "Thomas",
    "Ursula",
    "Violet",
    "William",
    "Xander",
    "Yasmin",
    "Zachary",
    "Amber",
    "Blake",
    "Carmen",
    "Derek",
    "Ella",
    "Frank",
    "Grace",
    "Henry",
    "Isabella",
    "Jack",
    "Kylie",
    "Leo",
    "Mason",
    "Nina",
    "Oscar",
    "Penny",
    "Quincy",
    "Rose",
    "Sam",
    "Tina",
    "Ulysses",
    "Valerie",
    "Wyatt",
    "Xenia",
    "Yvonne",
    "Zane",
    "Adam",
    "Bella",
    "Caleb",
    "Daisy",
    "Ethan",
    "Freya",
    "Gavin",
    "Holly",
    "Ivan",
    "Julia",
  ];
  return Array.from({ length: 50 }, () => ({
    name: names[Math.floor(Math.random() * names.length)],
    age: Math.floor(Math.random() * 60) + 20, // Random age between 20-80
    joiningDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date
    salary: (Math.random() * 90000 + 10000).toFixed(2), // Random salary between $10,000-$100,000
  }));
}

// Simulate a database
let tableData = generateRandomData();

// API endpoint for paginated and sortable data
app.get("/api/data", (req, res) => {
  const {
    page = 1,
    limit = 5,
    sortBy = "name",
    sortDirection = "asc",
  } = req.query;

  // Sort the data based on column and direction
  const sortedData = [...tableData].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (sortBy === "age" || sortBy === "salary") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    } else if (sortBy === "joiningDate") {
      return sortDirection === "asc"
        ? new Date(valA) - new Date(valB)
        : new Date(valB) - new Date(valA);
    } else {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
  });

  // Paginate the sorted data
  const startIndex = (page - 1) * limit;
  const paginatedData = sortedData.slice(
    startIndex,
    startIndex + parseInt(limit)
  );

  res.json({
    data: paginatedData,
    currentPage: parseInt(page),
    totalPages: Math.ceil(tableData.length / limit),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
