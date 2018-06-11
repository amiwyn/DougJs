const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');
const auth = require('./auth-bot');

//put port in configs or package.json maybe w/e
const PORT = 6958;
const config = new Configstore(process.env.CONFIGKEY);
const app = express();

app.listen(PORT, () => {
  console.log("HTTP server listening on", PORT);
  seedConfigs();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  auth.init(app);
  bot.start(app);
});

function seedConfigs() {
  if (!config.get('roster')) {
    config.set('roster', []);
  }

  if (!config.get('skippers')) {
    config.set('skippers', []);
  }
}

