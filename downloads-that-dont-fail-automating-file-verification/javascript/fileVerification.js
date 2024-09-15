const fs = require("fs");
const path = require("path");

// Define the expected file name and path
const expectedFileName = "sample-file.txt";
const downloadDirectory = "/path/to/downloads/";
const filePath = path.join(downloadDirectory, expectedFileName);

// Check if the file exists and has the correct extension
if (fs.existsSync(filePath) && filePath.endsWith(".txt")) {
  console.log(`File name and type verification passed: ${expectedFileName}`);
} else {
  throw new Error(`File name or type verification failed: ${filePath}`);
}

// Read the downloaded file and check its content
const fileContent = fs.readFileSync(filePath, "utf-8");

if (fileContent.includes("testing download")) {
  console.log("Text content verification passed");
} else {
  throw new Error("Text content verification failed");
}

// Get the size of the downloaded file
const stats = fs.statSync(filePath);
const fileSizeInBytes = stats.size;

// Ensure the file size is greater than 0 bytes
if (fileSizeInBytes > 0) {
  console.log(`File size verification passed: ${fileSizeInBytes} bytes`);
} else {
  throw new Error("File size verification failed: File is empty or corrupted");
}
