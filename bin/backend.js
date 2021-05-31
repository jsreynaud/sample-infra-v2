/*
  Ce code est le module principal de notre backend.
*/
require('dotenv').config();

const main = require("../src/backend/main");

console.log("Starting Backend");

main.run();
