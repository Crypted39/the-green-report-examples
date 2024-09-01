const { createLogger, format, transports } = require("winston");

// Create a logger with custom settings
const logger = createLogger({
  level: "error", // Only log messages with 'error' level or higher
  format: format.combine(
    format.timestamp(), // Add a timestamp to each log
    format.printf(({ timestamp, level, message, stack }) => {
      // Custom formatting of the log message
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack || ""}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: "error.log" }), // Save logs to a file
  ],
});

module.exports = logger;
