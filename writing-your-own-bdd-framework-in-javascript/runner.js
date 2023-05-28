const fs = require("fs");
const { parseCapability } = require("./parser.js");

const bddFile = fs.readFileSync("bookerApi.bdd", "utf8");
parseCapability(bddFile);
