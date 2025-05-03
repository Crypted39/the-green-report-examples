const fs = require("fs");
const path = require("path");

/**
 * Creates a sample project structure with the specified name
 * @param {string} projectName - The name of the project to create
 */
function generateProject(projectName) {
  // Create the main project directory
  fs.mkdirSync(projectName);

  // Create src directory and files
  fs.mkdirSync(path.join(projectName, "src"));
  fs.writeFileSync(
    path.join(projectName, "src", "index.js"),
    'export default function() { return "Hello World"; }'
  );
  fs.writeFileSync(
    path.join(projectName, "src", "utils.js"),
    "export const sum = (a, b) => a + b;"
  );

  // Create package.json
  fs.writeFileSync(
    path.join(projectName, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "1.0.0",
        type: "module",
        scripts: {
          test: "jest",
        },
      },
      null,
      2
    )
  );

  // Create README.md
  fs.writeFileSync(
    path.join(projectName, "README.md"),
    "# My Project\n\nA generated project."
  );

  // Create .git directory to simulate a git repo
  fs.mkdirSync(path.join(projectName, ".git"));
}

module.exports = generateProject;
