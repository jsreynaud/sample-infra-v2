/*
  Ce code est le module principal de notre routeur
*/
require('dotenv').config();

const main = require("../src/router/main");

console.log("Starting Routing");

main.run();
