const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');
const auth = require('./auth-bot');
const store = require('./store');

//put port in configs or package.json maybe w/e
const PORT = 6958;
const app = express();

app.listen(PORT, () => {
  console.log("HTTP server listening on", PORT);
  store.seedConfigs();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  auth.init(app);
  bot.start(app);
});