const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');
const auth = require('./auth-bot');
const store = require('./store');
const requestVerification = require('./request-verification');

//put port in configs or package.json maybe w/e
const port = process.env.PORT || 8080;
const app = express();

app.listen(port, () => {
  console.log("HTTP server listening on", port);
  app.use(requestVerification.verify);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  auth.init(app, store);
  bot.start(app, store);
});