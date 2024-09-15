const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");

// Define the expected file name and path
const expectedFileName = "sample-file.pdf";
const downloadDirectory = "/path/to/downloads/";
const filePath = path.join(downloadDirectory, expectedFileName);

async function verifyPdfContent(filePath) {
  // Read the PDF file
  const dataBuffer = fs.readFileSync(filePath);

  // Parse the PDF content
  const data = await pdf(dataBuffer);

  // Extract text from the first page
  const text = data.text;

  // Check if the PDF contains the expected content
  if (text.includes("expected content")) {
    console.log("PDF content verification passed");
  } else {
    throw new Error("PDF content verification failed");
  }
}

verifyPdfContent(filePath);
