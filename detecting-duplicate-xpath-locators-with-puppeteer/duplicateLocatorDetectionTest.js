import { checkLocatorEquivalence } from "./locatorDetection.js";
import { getLocatorsFromFile } from "./parser.js";

const url = ""; // URL of the webpage under test
const filePath = ""; // File path to the script containing locators

let locators = getLocatorsFromFile(filePath);

await checkLocatorEquivalence(url, locators).then((duplicates) => {
  if (duplicates.length > 0) {
    console.log("Duplicate locators found:", duplicates);
    // Handle duplicates as needed, e.g., remove or flag them
  } else {
    console.log("No duplicate locators found.");
  }
});
