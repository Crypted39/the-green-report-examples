const fs = require("fs");
const generateProject = require("./generateProject");

describe("Project Generator", () => {
  beforeEach(() => {
    // Clean up test directories
    if (fs.existsSync("my-project")) {
      fs.rmSync("my-project", { recursive: true, force: true });
    }
  });

  test("creates project with correct content", () => {
    generateProject("my-project");

    expect("my-project").toMatchFileStructure(
      {
        src: {
          "index.js": /export default/, // Checks that index.js contains this text
          "utils.js": true,
        },
        "package.json": (content) => JSON.parse(content).name === "my-project",
        "README.md": "# My Project\n\nA generated project.",
        ".git": true, // We just care it exists, don't check contents
      },
      {
        ignoreFiles: ["node_modules"],
      }
    );
  });
});
