const fs = require("fs");
const path = require("path");

function checkFileStructure(basePath, expected, options = {}) {
  const { ignoreFiles = [] } = options;

  // Process each key in the expected structure
  for (const [name, value] of Object.entries(expected)) {
    const fullPath = path.join(basePath, name);

    // Skip ignored paths
    if (ignoreFiles.includes(name) || ignoreFiles.includes(fullPath)) {
      continue;
    }

    // Check if the path exists
    if (!fs.existsSync(fullPath)) {
      return {
        pass: false,
        message: () => `Expected path "${fullPath}" to exist, but it doesn't`,
      };
    }

    // Check directory contents
    if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof RegExp)
    ) {
      const stats = fs.statSync(fullPath);
      if (!stats.isDirectory()) {
        return {
          pass: false,
          message: () =>
            `Expected "${fullPath}" to be a directory, but it's not`,
        };
      }

      // Recursively check the directory contents
      const result = checkFileStructure(fullPath, value, options);
      if (!result.pass) {
        return result;
      }
    }
    // Check file with content validation
    else if (value !== true) {
      // Only validate content if value is not 'true'
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        return {
          pass: false,
          message: () => `Expected "${fullPath}" to be a file, but it's not`,
        };
      }

      // If value is a string or RegExp or function, validate file contents
      if (
        typeof value === "string" ||
        value instanceof RegExp ||
        typeof value === "function"
      ) {
        const content = fs.readFileSync(fullPath, "utf8");

        if (value instanceof RegExp) {
          if (!value.test(content)) {
            return {
              pass: false,
              message: () =>
                `File "${fullPath}" content doesn't match regex pattern`,
            };
          }
        } else if (typeof value === "function") {
          // Use callback function for validation
          const isValid = value(content);
          if (!isValid) {
            return {
              pass: false,
              message: () =>
                `File "${fullPath}" content failed custom validation function`,
            };
          }
        } else if (content !== value) {
          return {
            pass: false,
            message: () =>
              `File "${fullPath}" content doesn't match expected string`,
          };
        }
      }
    }
    // If value is true, just check that the path exists (already done above)
  }

  return {
    pass: true,
    message: () => `File structure matches expected pattern`,
  };
}

expect.extend({
  toMatchFileStructure(received, expected, options = {}) {
    const basePath = typeof received === "string" ? received : received.path;

    if (!fs.existsSync(basePath)) {
      return {
        pass: false,
        message: () =>
          `Expected base path "${basePath}" to exist, but it doesn't`,
      };
    }

    return checkFileStructure(basePath, expected, options);
  },
});
