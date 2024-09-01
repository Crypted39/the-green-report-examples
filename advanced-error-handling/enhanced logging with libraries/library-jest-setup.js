const logger = require("./logger");

global.handleTestError = (error) => {
  logger.error(error.message, { stack: error.stack }); // Log the error with Winston
};
