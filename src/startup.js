const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');
const auth = require('./auth-bot');
//const store = require('./store');
const store = require('./azure-store');
const requestVerification = require('./request-verification');

const port = process.env.PORT || 8080;
const app = express();

app.listen(port, () => {
  console.log("HTTP server listening on", port);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(requestVerification.verify);
  auth.init(app, store);
  bot.start(app, store);
});